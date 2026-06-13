from datetime import date

from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.gamification.services.stats import get_user_timezone
from apps.habits.models import Habit, HabitCompletion
from apps.habits.serializers import (
    HabitLogRequestSerializer,
    HabitSerializer,
)
from apps.habits.services.habit_schedule import habit_is_due
from apps.habits.services.habit_stats import habit_full_stats, habit_streaks, user_today_from_prefs
from apps.tasks.models import ActivityLog


def _serialize_today_item(habit, completion, today: date) -> dict:
    streaks = habit_streaks(habit, today)
    logged = completion.logged_value if completion else 0.0
    is_complete = completion.is_complete if completion else False
    return {
        'id': habit.id,
        'title': habit.title,
        'iconKey': habit.icon_key or '',
        'color': habit.color,
        'trackingType': habit.tracking_type,
        'targetValue': habit.target_value,
        'loggedValue': logged,
        'unitLabel': habit.unit_label or '',
        'isCompleteToday': is_complete,
        'currentStreak': streaks['currentStreak'],
        'longestStreak': streaks['longestStreak'],
        'frequencyType': habit.frequency_type,
    }


def _sync_activity_log_on_complete(habit, completion_date: date, user):
    """write one habit_completed log per habit+day when completion first becomes true."""
    exists = ActivityLog.objects.filter(
        user=user,
        action_type='habit_completed',
        task_title=habit.title,
        occurrence_date=completion_date,
    ).exists()
    if not exists:
        ActivityLog.objects.create(
            user=user,
            task=None,
            action_type='habit_completed',
            task_title=habit.title,
            occurrence_date=completion_date,
        )


def _remove_activity_log_on_undo(habit, completion_date: date, user):
    ActivityLog.objects.filter(
        user=user,
        action_type='habit_completed',
        task_title=habit.title,
        occurrence_date=completion_date,
    ).delete()


class HabitViewSet(viewsets.ModelViewSet):
    """CRUD + log endpoints for /habits/."""

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = HabitSerializer
    http_method_names = ['get', 'post', 'patch', 'delete', 'head', 'options']

    def get_queryset(self):
        return Habit.objects.filter(
            user=self.request.user,
            soft_deleted=False,
            is_active=True,
        ).order_by('sort_order', 'created_at')

    def perform_destroy(self, instance):
        instance.soft_deleted = True
        instance.is_active = False
        instance.save(update_fields=['soft_deleted', 'is_active', 'updated_at'])

    @action(detail=False, methods=['get'], url_path='today')
    def today(self, request):
        """GET /habits/today/ — habits due today with completion state."""
        user = request.user
        today = user_today_from_prefs(user)
        habits = list(self.get_queryset())
        due_habits = [h for h in habits if habit_is_due(h, today)]

        completion_map = {
            c.habit_id: c
            for c in HabitCompletion.objects.filter(
                habit__in=due_habits,
                completion_date=today,
            )
        }

        items = []
        completed_count = 0
        best_streak = 0
        for habit in due_habits:
            completion = completion_map.get(habit.id)
            item = _serialize_today_item(habit, completion, today)
            items.append(item)
            if item['isCompleteToday']:
                completed_count += 1
            best_streak = max(best_streak, item['currentStreak'])

        return Response({
            'date': today.isoformat(),
            'summary': {
                'scheduledCount': len(items),
                'completedCount': completed_count,
                'bestActiveStreak': best_streak,
            },
            'habits': items,
        })

    @action(detail=True, methods=['post', 'delete'], url_path='log')
    def log(self, request, pk=None):
        """POST /habits/{id}/log/ — toggle or increment; DELETE ?date= — undo."""
        habit = self.get_object()

        if request.method == 'DELETE':
            date_str = request.query_params.get('date')
            if not date_str:
                return Response({'detail': 'date query param required.'}, status=status.HTTP_400_BAD_REQUEST)
            try:
                target_date = date.fromisoformat(date_str)
            except ValueError:
                return Response({'detail': 'Invalid date format.'}, status=status.HTTP_400_BAD_REQUEST)

            completion = HabitCompletion.objects.filter(habit=habit, completion_date=target_date).first()
            if completion:
                was_complete = completion.is_complete
                completion.logged_value = 0
                completion.is_complete = False
                completion.save()
                if was_complete:
                    _remove_activity_log_on_undo(habit, target_date, request.user)

            streaks = habit_streaks(habit, user_today_from_prefs(request.user))
            return Response({
                'id': completion.id if completion else None,
                'completionDate': target_date.isoformat(),
                'loggedValue': 0,
                'isComplete': False,
                'isCompleteToday': False,
                'currentStreak': streaks['currentStreak'],
                'longestStreak': streaks['longestStreak'],
                'targetValue': habit.target_value,
            })

        body = HabitLogRequestSerializer(data=request.data)
        body.is_valid(raise_exception=True)
        target_date = body.validated_data.get('date') or user_today_from_prefs(request.user)
        delta = body.validated_data.get('delta', 1)

        completion, _created = HabitCompletion.objects.get_or_create(
            habit=habit,
            completion_date=target_date,
            defaults={'logged_value': 0, 'is_complete': False},
        )
        was_complete = completion.is_complete

        if habit.tracking_type == 'binary':
            completion.is_complete = not completion.is_complete
            completion.logged_value = 1.0 if completion.is_complete else 0.0
        else:
            completion.logged_value = (completion.logged_value or 0) + delta
            target = habit.target_value or 1
            completion.is_complete = completion.logged_value >= target

        completion.save()

        if completion.is_complete and not was_complete:
            _sync_activity_log_on_complete(habit, target_date, request.user)
        elif not completion.is_complete and was_complete:
            _remove_activity_log_on_undo(habit, target_date, request.user)

        streaks = habit_streaks(habit, user_today_from_prefs(request.user))
        return Response({
            'id': completion.id,
            'completionDate': target_date.isoformat(),
            'loggedValue': completion.logged_value,
            'isComplete': completion.is_complete,
            'isCompleteToday': completion.is_complete,
            'currentStreak': streaks['currentStreak'],
            'longestStreak': streaks['longestStreak'],
            'targetValue': habit.target_value,
        })


class HabitStatsView(APIView):
    """GET /habits/{id}/stats/ — streaks, heatmap, and 30-day trend."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, habit_id):
        try:
            habit = Habit.objects.get(
                id=habit_id,
                user=request.user,
                soft_deleted=False,
            )
        except Habit.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        today = user_today_from_prefs(request.user)
        return Response(habit_full_stats(habit, today))
