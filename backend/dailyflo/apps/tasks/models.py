from django.db import models
from django.conf import settings

class Task(models.Model):
    user_id = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=CASCADE
    )
    
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    due_date = models.DateTimeField(blank=True)
    is_completed = models.BooleanField(default=False)
    