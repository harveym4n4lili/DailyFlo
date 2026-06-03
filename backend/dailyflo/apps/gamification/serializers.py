from rest_framework import serializers

from apps.gamification.models import UserGoal
from apps.tasks.models import Task

MAX_ACTIVE_GOALS = 5


class GamificationSummarySerializer(serializers.Serializer):
    completionsToday = serializers.IntegerField()
    completionsThisWeek = serializers.IntegerField()
    completionsThisMonth = serializers.IntegerField()
    currentStreak = serializers.IntegerField()
    longestStreak = serializers.IntegerField()
    lastCompletionDate = serializers.CharField(allow_null=True)
    goalsOnTrack = serializers.IntegerField()
    goalsTotal = serializers.IntegerField()
    unlockedAchievementCount = serializers.IntegerField()


class UserGoalSerializer(serializers.ModelSerializer):
    goalType = serializers.ChoiceField(source='goal_type', choices=UserGoal.GOAL_TYPE_CHOICES)
    targetCount = serializers.IntegerField(source='target_count', min_value=1)
    linkedTaskId = serializers.PrimaryKeyRelatedField(
        source='linked_task',
        queryset=Task.objects.none(),
        allow_null=True,
        required=False,
    )
    isActive = serializers.BooleanField(source='is_active', required=False, default=True)

    class Meta:
        model = UserGoal
        fields = [
            'id',
            'title',
            'goalType',
            'targetCount',
            'period',
            'linkedTaskId',
            'isActive',
        ]
        read_only_fields = ['id']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            self.fields['linkedTaskId'].queryset = Task.objects.filter(
                user=request.user,
                soft_deleted=False,
            )

    def validate(self, attrs):
        goal_type = attrs.get('goal_type', getattr(self.instance, 'goal_type', 'task_count'))
        linked = attrs.get('linked_task', getattr(self.instance, 'linked_task', None))
        if goal_type == 'linked_task' and not linked:
            raise serializers.ValidationError({'linkedTaskId': 'Required for linked_task goals.'})
        return attrs

    def create(self, validated_data):
        user = self.context['request'].user
        active_count = UserGoal.objects.filter(user=user, is_active=True).count()
        if active_count >= MAX_ACTIVE_GOALS:
            raise serializers.ValidationError('Maximum of 5 active goals allowed.')
        validated_data['user'] = user
        return super().create(validated_data)


class UserGoalDetailSerializer(serializers.Serializer):
    """response shape after enrich_goal — not a model serializer."""

    id = serializers.UUIDField()
    title = serializers.CharField()
    goalType = serializers.CharField()
    targetCount = serializers.IntegerField()
    currentCount = serializers.IntegerField()
    period = serializers.CharField()
    periodLabel = serializers.CharField()
    linkedTaskId = serializers.CharField(allow_null=True)
    isActive = serializers.BooleanField()
    isMet = serializers.BooleanField()
    createdAt = serializers.DateTimeField()
    updatedAt = serializers.DateTimeField()
