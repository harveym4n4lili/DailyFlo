import uuid

from django.conf import settings
from django.db import models


class Habit(models.Model):
    """user habit — consistency tracker separate from tasks."""

    COLOR_CHOICES = [
        ('red', 'Red'),
        ('blue', 'Blue'),
        ('green', 'Green'),
        ('yellow', 'Yellow'),
        ('purple', 'Purple'),
        ('teal', 'Teal'),
        ('orange', 'Orange'),
    ]

    TRACKING_TYPE_CHOICES = [
        ('binary', 'Binary'),
        ('numeric', 'Numeric'),
    ]

    FREQUENCY_TYPE_CHOICES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('weekdays', 'Weekdays'),
        ('weekends', 'Weekends'),
        ('custom', 'Custom'),
        ('times_per_week', 'Times per week'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='habits',
    )
    title = models.CharField(max_length=255)
    icon_key = models.CharField(max_length=64, blank=True, default='')
    color = models.CharField(max_length=20, choices=COLOR_CHOICES, default='green')
    tracking_type = models.CharField(max_length=20, choices=TRACKING_TYPE_CHOICES, default='binary')
    target_value = models.FloatField(null=True, blank=True)
    unit_label = models.CharField(max_length=64, blank=True, default='')
    frequency_type = models.CharField(max_length=32, choices=FREQUENCY_TYPE_CHOICES, default='daily')
    frequency_config = models.JSONField(default=dict, blank=True)
    reminder_time = models.CharField(max_length=5, blank=True, default='')
    sort_order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    soft_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'habits'
        ordering = ['sort_order', 'created_at']
        indexes = [
            models.Index(fields=['user', 'soft_deleted', 'is_active']),
        ]

    def __str__(self):
        return f'{self.title} ({self.user_id})'


class HabitCompletion(models.Model):
    """one row per habit per calendar day."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    habit = models.ForeignKey(Habit, on_delete=models.CASCADE, related_name='completions')
    completion_date = models.DateField()
    logged_value = models.FloatField(default=0)
    is_complete = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'habit_completions'
        constraints = [
            models.UniqueConstraint(fields=['habit', 'completion_date'], name='unique_habit_completion_per_day'),
        ]
        indexes = [
            models.Index(fields=['habit', 'completion_date']),
        ]

    def __str__(self):
        return f'{self.habit_id} @ {self.completion_date}'
