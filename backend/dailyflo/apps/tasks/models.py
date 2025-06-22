from django.db import models
from django.conf import settings

class RecurringTask(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="recurring_tasks"
    )
    
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    day_of_week = models.IntegerField(
        choices=[(i, str(i)) for i in range (0, 7)],
        default=0
    )
    
    due_date = models.DateTimeField(blank=True, null=True)
    is_active = models.BooleanField(default=False)
    
    priority_level = models.IntegerField(
        choices=[(i, str(i)) for i in range (1, 6)],
        default=3
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    metadata = models.JSONField(blank=True, default=dict)
    soft_deleted = models.BooleanField(default=False)
    
class Task(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="tasks"
    )
    
    recurring_task = models.ForeignKey(
        RecurringTask,
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )
    
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    due_date = models.DateTimeField(blank=True, null=True)
    is_completed = models.BooleanField(default=False)
    
    priority_level = models.IntegerField(
        choices=[(i, str(i)) for i in range (1, 6)],
        default=3
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    metadata = models.JSONField(blank=True, default=dict)
    soft_deleted = models.BooleanField(default=False)
    