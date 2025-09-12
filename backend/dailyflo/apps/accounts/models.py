from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import EmailValidator
import uuid


class CustomUser(AbstractUser):
    """
    enhanced CustomUser model with social authentication support
    and user preferences
    """
    
    # basic user information
    # UUID provides secure, non-sequential user IDs that don't reveal database size
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(
        unique=True,
        validators=[EmailValidator()],
        help_text="User's email address (required and unique)"
    )
    
    # social authentication fields
    auth_provider = models.CharField(
        max_length=20,
        choices=[
            ('email', 'Email/Password'),
            ('google', 'Google'),
            ('apple', 'Apple'),
            ('facebook', 'Facebook'),
        ],
        default='email',
        help_text="Authentication provider used by the user"
    )
    auth_provider_id = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Provider-specific user ID for social authentication"
    )
    
    # user profile information
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    avatar_url = models.URLField(
        blank=True,
        null=True,
        help_text="URL to user's avatar image"
    )
    
    # account status and verification
    is_email_verified = models.BooleanField(
        default=False,
        help_text="Whether the user's email has been verified"
    )
    last_login = models.DateTimeField(
        blank=True,
        null=True,
        help_text="Last time the user logged in"
    )
    
    # user preferences (JSON field for flexibility)
    preferences = models.JSONField(
        default=dict,
        blank=True,
        help_text="User preferences and app settings"
    )
    
    # soft delete support
    soft_deleted = models.BooleanField(
        default=False,
        help_text="Whether the user account has been soft deleted"
    )
    
    # timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # override username to make it optional for social auth users
    username = models.CharField(
        max_length=150,
        unique=True,
        blank=True,
        null=True,
        help_text="Username (optional for social auth users)"
    )
    
    # override password to make it optional for social auth users
    password = models.CharField(
        max_length=128,
        blank=True,
        null=True,
        help_text="Password hash (optional for social auth users)"
    )
    
    class Meta:
        # custom database table name instead of default app_model format
        db_table = 'users'
        # singular name for admin interface
        verbose_name = 'User'
        # plural name for admin interface
        verbose_name_plural = 'Users'
        # creates a separate, sorted lookup table for each field that points back to the main table rows
        indexes = [
            # speeds up login lookups and email uniqueness checks
            models.Index(fields=['email']),
            # speeds up social auth lookups (google/apple/facebook user matching)
            models.Index(fields=['auth_provider', 'auth_provider_id']),
            # speeds up filtering verified vs unverified users
            models.Index(fields=['is_email_verified']),
            # speeds up soft delete queries (active vs deleted users)
            models.Index(fields=['soft_deleted']),
            # speeds up user creation date sorting and filtering
            models.Index(fields=['created_at']),
        ]
        # database-level constraints for data integrity
        constraints = [
            # prevents duplicate social auth accounts: same provider + provider_id can only exist once
            # condition ensures this only applies when auth_provider_id is not null
            models.UniqueConstraint(
                fields=['auth_provider', 'auth_provider_id'],
                condition=models.Q(auth_provider_id__isnull=False),
                name='unique_social_auth_provider'
            ),
        ]
    
    def __str__(self):
        return f"{self.email} ({self.get_full_name() or 'No Name'})"
    
    def get_full_name(self):
        """return the user's full name"""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        elif self.first_name:
            return self.first_name
        elif self.last_name:
            return self.last_name
        return ""
    
    def get_short_name(self):
        """return the user's first name or email"""
        return self.first_name or self.email.split('@')[0]
    
    def is_social_user(self):
        """check if user authenticated via social provider"""
        return self.auth_provider != 'email'
    
    def get_display_name(self):
        """get display name for the user"""
        return self.get_full_name() or self.get_short_name()
    
    def set_default_preferences(self):
        """set default user preferences if not already sec"""
        if not self.preferences:
            self.preferences = {
                'theme': 'light',
                'notifications': {
                    'enabled': True,
                    'due_date_reminders': True,
                    'routine_reminders': True,
                    'push_notifications': True,
                },
                'default_priority': 3,
                'default_color': 'blue',
                'default_list_view': 'list',
                'timezone': 'UTC',
                'date_format': 'MM/DD/YYYY',
                'time_format': '12h',
            }
    
    def save(self, *args, **kwargs):
        """override save to set default preferences and handle social auth"""
        # set default preferences for new users
        if not self.pk:
            self.set_default_preferences()
        
        # Handle social auth users
        if self.is_social_user():
            # Social auth users don't need username/password
            if not self.username:
                self.username = f"{self.auth_provider}_{self.auth_provider_id}"
            if not self.password:
                self.set_unusable_password()
        
        # ensure email is always set as username for email auth users
        elif self.auth_provider == 'email' and self.email:
            self.username = self.email
        
        super().save(*args, **kwargs)

