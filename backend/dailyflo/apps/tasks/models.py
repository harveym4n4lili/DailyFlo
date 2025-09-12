from django.db import models
from django.conf import settings
import uuid


class Task(models.Model):
    """
    task model for individual tasks
    """
    
    # color choices matching wireframe designs
    COLOR_CHOICES = [
        ('red', 'Red'),
        ('blue', 'Blue'),
        ('green', 'Green'),
        ('yellow', 'Yellow'),
        ('purple', 'Purple'),
        ('teal', 'Teal'),
        ('orange', 'Orange'),
    ]
    
    # routine type choices
    ROUTINE_TYPE_CHOICES = [
        ('once', 'Once'),
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
    ]
    
    # primary key
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # user relationship
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='tasks',
        help_text="User who owns this task"
    )
    
    # list relationship (nullable for inbox tasks)
    list = models.ForeignKey(
        'lists.List',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tasks',
        help_text="List this task belongs to (null for inbox)"
    )
    
    # routine relationship (for recurring tasks) - TODO: implement when routines app is ready
    # recurring_task = models.ForeignKey(
    #     'routines.Routine',
    #     on_delete=models.SET_NULL,
    #     null=True,
    #     blank=True,
    #     related_name='generated_tasks',
    #     help_text="Routine that generated this task"
    # )
    
    # task information
    title = models.CharField(
        max_length=255,
        help_text="Title of the task"
    )
    description = models.TextField(
        blank=True,
        help_text="Optional description of the task"
    )
    
    # task properties
    due_date = models.DateTimeField(
        blank=True,
        null=True,
        help_text="When the task is due"
    )
    is_completed = models.BooleanField(
        default=False,
        help_text="Whether the task is completed"
    )
    completed_at = models.DateTimeField(
        blank=True,
        null=True,
        help_text="When the task was completed"
    )
    
    # task organization
    priority_level = models.IntegerField(
        choices=[(i, f'Priority {i}') for i in range(1, 6)],
        default=3,
        help_text="Priority level from 1 (lowest) to 5 (highest)"
    )
    color = models.CharField(
        max_length=20,
        choices=COLOR_CHOICES,
        default='blue',
        help_text="Color for visual organization"
    )
    routine_type = models.CharField(
        max_length=20,
        choices=ROUTINE_TYPE_CHOICES,
        default='once',
        help_text="Type of routine for this task"
    )
    sort_order = models.IntegerField(
        default=0,
        help_text="Custom ordering within the list"
    )
    
    # metadata and timestamps
    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text="Additional metadata for subtasks, notes, etc."
    )
    soft_deleted = models.BooleanField(
        default=False,
        help_text="Whether the task has been soft deleted"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'tasks'
        verbose_name = 'Task'
        verbose_name_plural = 'Tasks'
        # database indexes for performance
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['user', 'list']),
            models.Index(fields=['user', 'is_completed']),
            models.Index(fields=['user', 'due_date']),
            models.Index(fields=['user', 'priority_level']),
            models.Index(fields=['user', 'color']),
            models.Index(fields=['user', 'routine_type']),
            models.Index(fields=['soft_deleted']),
        ]
        # ordering
        ordering = ['sort_order', 'created_at']
    
    def __str__(self):
        return f"{self.title} ({self.user.email})"
    
    def mark_completed(self):
        """mark task as completed"""
        from django.utils import timezone
        self.is_completed = True
        self.completed_at = timezone.now()
        self.save()
    
    def mark_incomplete(self):
        """mark task as incomplete"""
        self.is_completed = False
        self.completed_at = None
        self.save()
    
    def get_subtasks(self):
        """get all subtasks for this task"""
        return self.subtasks.filter(soft_deleted=False).order_by('sort_order')
    
    def get_completed_subtasks_count(self):
        """get count of completed subtasks"""
        return self.subtasks.filter(soft_deleted=False, is_completed=True).count()
    
    def get_total_subtasks_count(self):
        """get total count of subtasks"""
        return self.subtasks.filter(soft_deleted=False).count()
    
    def is_overdue(self):
        """check if task is overdue"""
        if not self.due_date or self.is_completed:
            return False
        from django.utils import timezone
        return timezone.now() > self.due_date
    
    def get_priority_display(self):
        """get human-readable priority level"""
        priority_map = {
            1: 'Very Low',
            2: 'Low',
            3: 'Medium',
            4: 'High',
            5: 'Very High'
        }
        return priority_map.get(self.priority_level, 'Medium')
    