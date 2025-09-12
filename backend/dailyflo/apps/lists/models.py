from django.db import models
from django.conf import settings
import uuid


class List(models.Model):
    """
    Task list model for organizing tasks into categories
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
    
    # primary key
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # user relationship
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='lists',
        help_text="User who owns this list"
    )
    
    # list information
    name = models.CharField(
        max_length=255,
        help_text="Name of the task list"
    )
    description = models.TextField(
        blank=True,
        help_text="Optional description of the list"
    )
    
    # visual organization
    color = models.CharField(
        max_length=20,
        choices=COLOR_CHOICES,
        default='blue',
        help_text="Color for visual organization"
    )
    icon = models.CharField(
        max_length=50,
        blank=True,
        help_text="Icon identifier for the list"
    )
    
    # list properties
    is_default = models.BooleanField(
        default=False,
        help_text="Whether this is the default inbox list"
    )
    sort_order = models.IntegerField(
        default=0,
        help_text="Custom ordering for lists"
    )
    
    # metadata and timestamps
    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text="Additional metadata for future extensibility"
    )
    soft_deleted = models.BooleanField(
        default=False,
        help_text="Whether the list has been soft deleted"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'lists'
        verbose_name = 'List'
        verbose_name_plural = 'Lists'
        # ensure unique list names per user
        unique_together = ['user', 'name']
        # database indexes for performance
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['user', 'sort_order']),
            models.Index(fields=['is_default']),
            models.Index(fields=['soft_deleted']),
        ]
        # ordering
        ordering = ['sort_order', 'name']
    
    def __str__(self):
        return f"{self.name} ({self.user.email})"
    
    def get_task_count(self):
        """get total number of tasks in this list"""
        return self.tasks.filter(soft_deleted=False).count()
    
    def get_completed_task_count(self):
        """get number of completed tasks in this list"""
        return self.tasks.filter(soft_deleted=False, is_completed=True).count()
    
    def get_pending_task_count(self):
        """get number of pending tasks in this list"""
        return self.tasks.filter(soft_deleted=False, is_completed=False).count()
    
    def save(self, *args, **kwargs):
        """override save to handle default list creation"""
        # ensure only one default list per user
        if self.is_default:
            # remove default flag from other lists for this user
            List.objects.filter(
                user=self.user,
                is_default=True,
                soft_deleted=False
            ).exclude(id=self.id).update(is_default=False)
        
        super().save(*args, **kwargs)
