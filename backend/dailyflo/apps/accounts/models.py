from django.db import models
from django.contrib.auth.models import AbstractUser

class CustomUser(AbstractUser):
    display_name = models.CharField(max_length=100, blank=True, null=True)
    first_name = models.CharField(max_length=100, blank=True, null=True)
    last_name = models.CharField(max_length=100, blank=True, null=True)
    bio = models.TextField(blank=True, null=True)

