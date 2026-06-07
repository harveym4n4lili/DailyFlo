import uuid

from django.conf import settings
from django.db import models


class AchievementDefinition(models.Model):
    """
    static catalog row — seeded via fixture.
    criteria json drives the on-read evaluator in services/achievements.py.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=64, unique=True)
    title = models.CharField(max_length=120)
    description = models.TextField()
    icon_key = models.CharField(max_length=64, default='trophy')
    sort_order = models.PositiveIntegerField(default=0)
    criteria = models.JSONField(default=dict)

    class Meta:
        db_table = 'achievement_definitions'
        ordering = ['sort_order', 'code']

    def __str__(self):
        return self.code


class UserAchievement(models.Model):
    """unlocked achievement for a user — one row per definition."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='user_achievements',
    )
    achievement = models.ForeignKey(
        AchievementDefinition,
        on_delete=models.CASCADE,
        related_name='user_unlocks',
    )
    unlocked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'user_achievements'
        unique_together = [['user', 'achievement']]
        ordering = ['-unlocked_at']

    def __str__(self):
        return f'{self.user_id} — {self.achievement.code}'


class UserGoal(models.Model):
    """user-defined target — progress computed from activity logs on read."""

    GOAL_TYPE_CHOICES = [
        ('task_count', 'Task count'),
        ('linked_task', 'Linked task'),
    ]
    PERIOD_CHOICES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='user_goals',
    )
    title = models.CharField(max_length=120)
    goal_type = models.CharField(max_length=20, choices=GOAL_TYPE_CHOICES, default='task_count')
    target_count = models.PositiveIntegerField(default=1)
    period = models.CharField(max_length=20, choices=PERIOD_CHOICES, default='weekly')
    linked_task = models.ForeignKey(
        'tasks.Task',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='linked_goals',
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'user_goals'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.title} ({self.user_id})'
