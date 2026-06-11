from rest_framework import permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.gamification.models import UserGoal
from apps.gamification.serializers import GamificationSummarySerializer, UserGoalSerializer
from apps.gamification.services.achievements import list_achievements_for_user
from apps.gamification.services.goals import enrich_goal, list_user_goals
from apps.gamification.services.stats import compute_gamification_summary, effective_completion_date, get_user_timezone
from apps.tasks.models import ActivityLog
from django.utils import timezone as django_tz


class GamificationSummaryView(APIView):
    """GET /gamification/summary/ — streak, period counts, goal/achievement tallies."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        data = compute_gamification_summary(request.user)
        serializer = GamificationSummarySerializer(data)
        return Response(serializer.data)


class GamificationAchievementsView(APIView):
    """GET /gamification/achievements/ — catalog with unlock state."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        user_tz = get_user_timezone(user)
        logs = ActivityLog.objects.filter(user=user, action_type__in=['completed', 'habit_completed'])
        completion_dates = set()
        for log in logs.only('occurrence_date', 'created_at'):
            completion_dates.add(effective_completion_date(log, user_tz))
        items = list_achievements_for_user(user, completion_dates, logs)
        return Response(items)


class UserGoalViewSet(viewsets.ModelViewSet):
    """
    CRUD for user goals under /gamification/goals/.
    list/create use enriched progress in responses.
    """

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserGoalSerializer
    http_method_names = ['get', 'post', 'patch', 'delete', 'head', 'options']

    def get_queryset(self):
        return UserGoal.objects.filter(user=self.request.user, is_active=True)

    def _today(self, user):
        user_tz = get_user_timezone(user)
        return django_tz.now().astimezone(user_tz).date()

    def list(self, request, *args, **kwargs):
        return Response(list_user_goals(request.user))

    def retrieve(self, request, *args, **kwargs):
        goal = self.get_object()
        return Response(enrich_goal(goal, request.user, get_user_timezone(request.user), self._today(request.user)))

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        goal = serializer.save()
        return Response(
            enrich_goal(goal, request.user, get_user_timezone(request.user), self._today(request.user)),
            status=status.HTTP_201_CREATED,
        )

    def partial_update(self, request, *args, **kwargs):
        goal = self.get_object()
        serializer = self.get_serializer(goal, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        goal = serializer.save()
        return Response(enrich_goal(goal, request.user, get_user_timezone(request.user), self._today(request.user)))

    def destroy(self, request, *args, **kwargs):
        goal = self.get_object()
        goal.is_active = False
        goal.save(update_fields=['is_active', 'updated_at'])
        return Response(status=status.HTTP_204_NO_CONTENT)
