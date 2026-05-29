import re

from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import CustomUser

_HH_MM_RE = re.compile(r'^([01]\d|2[0-3]):([0-5]\d)$')
_ONBOARDING_BRANCHES = frozenset({'habit', 'task'})
_ONBOARDING_HABIT_FREQUENCIES = frozenset({'daily', 'weekly', 'weekends'})
_DISPLAY_SORT_OPTIONS = frozenset({'None', 'Due Date', 'Added Date', 'Priority'})
_DISPLAY_ORDERING_OPTIONS = frozenset({'Ascending', 'Descending'})
_DISPLAY_LAYOUT_VIEWS = frozenset({'list', 'timeline'})
_DISPLAY_TAB_KEYS = frozenset({'today', 'planner'})
_NAVIGATION_TAB_KEYS = frozenset({'today', 'planner', 'ai', 'browse', 'inbox'})


def _validate_hh_mm_string(value):
    """wake/sleep planner bounds must be sane 24h clock strings HH:MM"""
    if value is None:
        return
    if not isinstance(value, str) or not _HH_MM_RE.match(value):
        raise serializers.ValidationError('Expected time as HH:MM in 24h format')


def _validate_display_tab_preferences(value, tab_name):
    """per-tab display modal prefs (today / planner) — labels match frontend pickers"""
    if value is None:
        return
    if not isinstance(value, dict):
        raise serializers.ValidationError(f'display_preferences.{tab_name} must be a JSON object')

    allowed_tab_keys = {
        'sort_option', 'ordering_option', 'show_completed_tasks',
        'layout_view', 'show_all_day_tasks',
        # camelCase tolerated when clients send mixed keys
        'sortOption', 'orderingOption', 'showCompletedTasks',
        'layoutView', 'showAllDayTasks',
    }
    for key in value.keys():
        if key not in allowed_tab_keys:
            raise serializers.ValidationError(f'Invalid display_preferences.{tab_name} key: {key}')

    sort_option = value.get('sort_option', value.get('sortOption'))
    if sort_option is not None and sort_option not in _DISPLAY_SORT_OPTIONS:
        raise serializers.ValidationError(f'Invalid sort_option on display_preferences.{tab_name}')

    ordering_option = value.get('ordering_option', value.get('orderingOption'))
    if ordering_option is not None and ordering_option not in _DISPLAY_ORDERING_OPTIONS:
        raise serializers.ValidationError(f'Invalid ordering_option on display_preferences.{tab_name}')

    layout_view = value.get('layout_view', value.get('layoutView'))
    if layout_view is not None and layout_view not in _DISPLAY_LAYOUT_VIEWS:
        raise serializers.ValidationError(f'Invalid layout_view on display_preferences.{tab_name}')

    show_completed = value.get('show_completed_tasks', value.get('showCompletedTasks'))
    if show_completed is not None and not isinstance(show_completed, bool):
        raise serializers.ValidationError(f'show_completed_tasks on display_preferences.{tab_name} must be a boolean')

    show_all_day = value.get('show_all_day_tasks', value.get('showAllDayTasks'))
    if show_all_day is not None and not isinstance(show_all_day, bool):
        raise serializers.ValidationError(f'show_all_day_tasks on display_preferences.{tab_name} must be a boolean')


def _validate_display_preferences(value):
    """nested display modal prefs — today / planner tabs"""
    if value is None:
        return
    if not isinstance(value, dict):
        raise serializers.ValidationError('display_preferences must be a JSON object')

    for key in value.keys():
        if key not in _DISPLAY_TAB_KEYS:
            raise serializers.ValidationError(f'Invalid display_preferences key: {key}')

    if 'today' in value:
        _validate_display_tab_preferences(value.get('today'), 'today')
    if 'planner' in value:
        _validate_display_tab_preferences(value.get('planner'), 'planner')


def _validate_navigation_preferences(value):
    """navbar tab order saved from the Navigation settings screen"""
    if value is None:
        return
    if not isinstance(value, dict):
        raise serializers.ValidationError('navigation_preferences must be a JSON object')

    allowed_keys = {'tab_order', 'pinned_tab', 'tabOrder', 'pinnedTab'}
    for key in value.keys():
        if key not in allowed_keys:
            raise serializers.ValidationError(f'Invalid navigation_preferences key: {key}')

    tab_order = value.get('tab_order', value.get('tabOrder'))
    if tab_order is not None:
        if not isinstance(tab_order, list):
            raise serializers.ValidationError('navigation_preferences.tab_order must be a list')
        if len(tab_order) == 0:
            raise serializers.ValidationError('navigation_preferences.tab_order cannot be empty')
        seen = set()
        for item in tab_order:
            if not isinstance(item, str) or item not in _NAVIGATION_TAB_KEYS:
                raise serializers.ValidationError('Invalid navigation_preferences.tab_order entry')
            if item in seen:
                raise serializers.ValidationError('navigation_preferences.tab_order must not contain duplicates')
            seen.add(item)
        if 'browse' not in seen:
            raise serializers.ValidationError('navigation_preferences.tab_order must include browse')

    pinned_tab = value.get('pinned_tab', value.get('pinnedTab'))
    if pinned_tab is not None and pinned_tab not in _NAVIGATION_TAB_KEYS:
        raise serializers.ValidationError('Invalid navigation_preferences.pinned_tab')


def _validate_onboarding_questionnaire(value):
    """questionnaire snapshot written once when user finishes onboarding setup"""
    if value is None:
        return
    if not isinstance(value, dict):
        raise serializers.ValidationError('onboarding_questionnaire must be a JSON object')

    allowed_top = {'v', 'branch', 'completed_at', 'task', 'habit'}
    for key in value.keys():
        if key not in allowed_top:
            raise serializers.ValidationError(f'Invalid onboarding_questionnaire key: {key}')

    if value.get('v') is not None and value.get('v') != 1:
        raise serializers.ValidationError('onboarding_questionnaire v must be 1')

    branch = value.get('branch')
    if branch is not None and branch not in _ONBOARDING_BRANCHES:
        raise serializers.ValidationError('onboarding_questionnaire branch must be habit or task')

    completed_at = value.get('completed_at')
    if completed_at is not None and not isinstance(completed_at, str):
        raise serializers.ValidationError('onboarding_questionnaire completed_at must be a string')

    task = value.get('task')
    if task is not None:
        if not isinstance(task, dict):
            raise serializers.ValidationError('onboarding_questionnaire task must be an object or null')
        task_keys = {'title', 'completed', 'event_time', 'duration_minutes'}
        for key in task.keys():
            if key not in task_keys:
                raise serializers.ValidationError(f'Invalid onboarding_questionnaire task key: {key}')
        if not isinstance(task.get('title', ''), str):
            raise serializers.ValidationError('task title must be a string')
        if not isinstance(task.get('completed', False), bool):
            raise serializers.ValidationError('task completed must be a boolean')
        if not isinstance(task.get('event_time', ''), str):
            raise serializers.ValidationError('task event_time must be a string')
        duration = task.get('duration_minutes', 0)
        if not isinstance(duration, int) or duration < 0:
            raise serializers.ValidationError('task duration_minutes must be a non-negative integer')

    habit = value.get('habit')
    if habit is not None:
        if not isinstance(habit, dict):
            raise serializers.ValidationError('onboarding_questionnaire habit must be an object or null')
        habit_keys = {'goal_title', 'frequency_id'}
        for key in habit.keys():
            if key not in habit_keys:
                raise serializers.ValidationError(f'Invalid onboarding_questionnaire habit key: {key}')
        if not isinstance(habit.get('goal_title', ''), str):
            raise serializers.ValidationError('habit goal_title must be a string')
        frequency_id = habit.get('frequency_id')
        if frequency_id is not None and frequency_id not in _ONBOARDING_HABIT_FREQUENCIES:
            raise serializers.ValidationError('habit frequency_id must be daily, weekly, or weekends')


class UserProfileSerializer(serializers.ModelSerializer):
    """
    serializer for user profile data (read-only, safe fields)
    used for displaying user information in API responses
    """

    # create new json fields for the serializer
    full_name = serializers.SerializerMethodField()
    display_name = serializers.SerializerMethodField()
    is_social_user = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomUser
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name', 
            'display_name', 'avatar_url', 'auth_provider', 'is_email_verified',
            'is_social_user', 'preferences', 'created_at', 'last_login'
        ]
        read_only_fields = [
            'id', 'email', 'auth_provider', 'is_email_verified', 
            'created_at', 'last_login'
        ]
    
    # these methods are used to return the contents for the new json fields
    def get_full_name(self, obj):
        """return the user's full name"""
        return obj.get_full_name()
    
    def get_display_name(self, obj):
        """return the user's display name"""
        return obj.get_display_name()
    
    def get_is_social_user(self, obj):
        """return whether user is a social auth user"""
        return obj.is_social_user()


class UserUpdateSerializer(serializers.ModelSerializer):
    """
    serializer for updating user profile information
    allows users to update their profile data
    """
    
    class Meta:
        model = CustomUser
        fields = [
            'first_name', 'last_name', 'avatar_url', 'preferences'
        ]

    def update(self, instance, validated_data):
        """
        PATCH may send partial `preferences`; merge into existing JSON instead of overwriting the whole blob.
        """
        prefs_patch = validated_data.pop('preferences', None)
        user = super().update(instance, validated_data)
        if prefs_patch is not None:
            current = dict(user.preferences or {})
            nested_notifications = prefs_patch.pop('notifications', None)
            if nested_notifications is not None and isinstance(nested_notifications, dict):
                n = dict(current.get('notifications') or {})
                n.update(nested_notifications)
                current['notifications'] = n
            nested_display = prefs_patch.pop('display_preferences', None)
            if nested_display is not None and isinstance(nested_display, dict):
                dp = dict(current.get('display_preferences') or {})
                for tab_key in ('today', 'planner'):
                    if tab_key in nested_display and isinstance(nested_display[tab_key], dict):
                        tab = dict(dp.get(tab_key) or {})
                        tab.update(nested_display[tab_key])
                        dp[tab_key] = tab
                for key, val in nested_display.items():
                    if key not in ('today', 'planner'):
                        dp[key] = val
                current['display_preferences'] = dp
            nested_navigation = prefs_patch.pop('navigation_preferences', None)
            if nested_navigation is not None and isinstance(nested_navigation, dict):
                nav = dict(current.get('navigation_preferences') or {})
                nav.update(nested_navigation)
                current['navigation_preferences'] = nav
            nested_onboarding = prefs_patch.pop('onboarding_questionnaire', None)
            if nested_onboarding is not None and isinstance(nested_onboarding, dict):
                o = dict(current.get('onboarding_questionnaire') or {})
                for nested_key in ('task', 'habit'):
                    if nested_key in nested_onboarding:
                        nested_val = nested_onboarding[nested_key]
                        if nested_val is None:
                            o[nested_key] = None
                        elif isinstance(nested_val, dict):
                            sub = dict(o.get(nested_key) or {})
                            sub.update(nested_val)
                            o[nested_key] = sub
                        else:
                            o[nested_key] = nested_val
                for key, val in nested_onboarding.items():
                    if key not in ('task', 'habit'):
                        o[key] = val
                current['onboarding_questionnaire'] = o
            current.update(prefs_patch)
            user.preferences = current
            user.save(update_fields=['preferences', 'updated_at'])
        return user
    
    def validate_preferences(self, value):
        """validate user preferences structure"""
        if not isinstance(value, dict):
            raise serializers.ValidationError("Preferences must be a valid JSON object")
        
        # validate specific preference keys
        allowed_keys = {
            'theme', 'notifications', 'default_priority', 'default_color',
            'default_list_view', 'timezone', 'date_format', 'time_format',
            'wake_time', 'sleep_time',
            'onboarding_completed',
            'onboarding_questionnaire',
            'auto_archive_completed',
            'show_completed_tasks',
            'sort_tasks_by',
            'display_preferences',
            'navigation_preferences',
            'analytics_enabled',
            'crash_reporting_enabled',
        }
        
        for key in value.keys():
            if key not in allowed_keys:
                raise serializers.ValidationError(f"Invalid preference key: {key}")
        
        # validate notifications structure
        if 'notifications' in value:
            notifications = value['notifications']
            if not isinstance(notifications, dict):
                raise serializers.ValidationError("Notifications must be a valid JSON object")
            
            allowed_notification_keys = {
                'enabled', 'due_date_reminders', 'routine_reminders', 'push_notifications',
                'email_notifications',
            }
            
            for key in notifications.keys():
                if key not in allowed_notification_keys:
                    raise serializers.ValidationError(f"Invalid notification key: {key}")

        if 'wake_time' in value:
            _validate_hh_mm_string(value.get('wake_time'))
        if 'sleep_time' in value:
            _validate_hh_mm_string(value.get('sleep_time'))

        if 'onboarding_questionnaire' in value:
            _validate_onboarding_questionnaire(value.get('onboarding_questionnaire'))

        if 'display_preferences' in value:
            _validate_display_preferences(value.get('display_preferences'))

        if 'navigation_preferences' in value:
            _validate_navigation_preferences(value.get('navigation_preferences'))
        
        return value


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    serializer for user registration (email/password)
    """
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True, required=True)
    # names optional — mobile onboarding can omit; model allows blank=True
    first_name = serializers.CharField(required=False, allow_blank=True, default='')
    last_name = serializers.CharField(required=False, allow_blank=True, default='')

    class Meta:
        model = CustomUser
        fields = [
            'email', 'password', 'password_confirm', 'first_name', 'last_name'
        ]
    
    def validate(self, attrs):
        """validate registration data"""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords do not match")
        
        # check if email already exists
        if CustomUser.objects.filter(email=attrs['email']).exists():
            raise serializers.ValidationError("A user with this email already exists")
        
        return attrs
    
    def create(self, validated_data):
        """create new user account"""
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        
        user = CustomUser.objects.create(
            email=validated_data['email'],
            username=validated_data['email'],  # use email as username
            auth_provider='email',
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
        )
        
        user.set_password(password)
        user.save()
        
        return user


class SocialAuthSerializer(serializers.Serializer):
    """
    incoming shape for POST /accounts/auth/social/

    id_token is the raw jwt string from google/apple — identity must come from server-side verification,
    not from a client-supplied dict (removed user_info — that was a trust boundary bug).
    """
    provider = serializers.ChoiceField(choices=['google', 'apple'])
    id_token = serializers.CharField(required=True)
    # apple only sends full name on first sign-in; client forwards these when present
    first_name = serializers.CharField(required=False, allow_blank=True, default='')
    last_name = serializers.CharField(required=False, allow_blank=True, default='')


class UserLoginSerializer(serializers.Serializer):
    """
    serializer for user login (email/password)
    """
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True)
    
    def validate(self, attrs):
        """validate login credentials"""
        email = attrs.get('email')
        password = attrs.get('password')
        
        if email and password:
            # try to authenticate with email as username
            user = authenticate(username=email, password=password)
            
            if not user:
                raise serializers.ValidationError("Invalid email or password")
            
            if not user.is_active:
                raise serializers.ValidationError("User account is disabled")
            
            if user.soft_deleted:
                raise serializers.ValidationError("User account has been deleted")
            
            attrs['user'] = user
            return attrs
        else:
            raise serializers.ValidationError("Must include email and password")


class PasswordChangeSerializer(serializers.Serializer):
    """
    serializer for password change
    """
    old_password = serializers.CharField(write_only=True, required=True)
    new_password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(write_only=True, required=True)
    
    def validate(self, attrs):
        """validate password change data"""
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError("New passwords do not match")
        return attrs
    
    def validate_old_password(self, value):
        """validate old password"""
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is incorrect")
        return value


class PasswordResetRequestSerializer(serializers.Serializer):
    """
    serializer for password reset request
    """
    email = serializers.EmailField(required=True)
    
    def validate_email(self, value):
        """validate email exists"""
        if not CustomUser.objects.filter(email=value, auth_provider='email').exists():
            raise serializers.ValidationError("No account found with this email address")
        return value


class PasswordResetConfirmSerializer(serializers.Serializer):
    """
    serializer for password reset confirmation
    """
    token = serializers.CharField(required=True)
    new_password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(write_only=True, required=True)
    
    def validate(self, attrs):
        """validate password reset data"""
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError("Passwords do not match")
        return attrs


class UserListSerializer(serializers.ModelSerializer):
    """
    serializer for listing users (admin use)
    """
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomUser
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'auth_provider', 'is_email_verified', 'is_active', 'soft_deleted',
            'created_at', 'last_login'
        ]
    
    def get_full_name(self, obj):
        """return the user's full name"""
        return obj.get_full_name()