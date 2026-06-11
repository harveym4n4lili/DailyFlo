from rest_framework import serializers

from apps.habits.models import Habit, HabitCompletion


class HabitSerializer(serializers.ModelSerializer):
    """camelCase read/write for habit CRUD."""

    iconKey = serializers.CharField(source='icon_key', required=False, allow_blank=True, default='')
    trackingType = serializers.ChoiceField(source='tracking_type', choices=Habit.TRACKING_TYPE_CHOICES)
    targetValue = serializers.FloatField(source='target_value', required=False, allow_null=True)
    unitLabel = serializers.CharField(source='unit_label', required=False, allow_blank=True, default='')
    frequencyType = serializers.ChoiceField(source='frequency_type', choices=Habit.FREQUENCY_TYPE_CHOICES)
    frequencyConfig = serializers.JSONField(source='frequency_config', required=False, default=dict)
    reminderTime = serializers.CharField(source='reminder_time', required=False, allow_blank=True, default='')
    sortOrder = serializers.IntegerField(source='sort_order', required=False, default=0)
    isActive = serializers.BooleanField(source='is_active', required=False, default=True)

    class Meta:
        model = Habit
        fields = [
            'id',
            'title',
            'iconKey',
            'color',
            'trackingType',
            'targetValue',
            'unitLabel',
            'frequencyType',
            'frequencyConfig',
            'reminderTime',
            'sortOrder',
            'isActive',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, attrs):
        tracking = attrs.get('tracking_type', getattr(self.instance, 'tracking_type', 'binary'))
        target = attrs.get('target_value', getattr(self.instance, 'target_value', None))
        if tracking == 'numeric' and target is None:
            raise serializers.ValidationError({'targetValue': 'Required when trackingType is numeric.'})
        return attrs

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class HabitTodayItemSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    title = serializers.CharField()
    iconKey = serializers.CharField()
    color = serializers.CharField()
    trackingType = serializers.CharField()
    targetValue = serializers.FloatField(allow_null=True)
    loggedValue = serializers.FloatField()
    unitLabel = serializers.CharField()
    isCompleteToday = serializers.BooleanField()
    currentStreak = serializers.IntegerField()
    longestStreak = serializers.IntegerField()
    frequencyType = serializers.CharField()


class HabitTodaySummarySerializer(serializers.Serializer):
    scheduledCount = serializers.IntegerField()
    completedCount = serializers.IntegerField()
    bestActiveStreak = serializers.IntegerField()


class HabitTodayResponseSerializer(serializers.Serializer):
    date = serializers.CharField()
    summary = HabitTodaySummarySerializer()
    habits = HabitTodayItemSerializer(many=True)


class HabitLogRequestSerializer(serializers.Serializer):
    date = serializers.DateField(required=False)
    delta = serializers.FloatField(required=False, default=1)


class HabitLogResponseSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    completionDate = serializers.CharField()
    loggedValue = serializers.FloatField()
    isComplete = serializers.BooleanField()
    isCompleteToday = serializers.BooleanField()
    currentStreak = serializers.IntegerField()
    longestStreak = serializers.IntegerField()
    targetValue = serializers.FloatField(allow_null=True)
