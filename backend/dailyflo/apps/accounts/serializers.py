from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import CustomUser


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
    
    def validate_preferences(self, value):
        """validate user preferences structure"""
        if not isinstance(value, dict):
            raise serializers.ValidationError("Preferences must be a valid JSON object")
        
        # validate specific preference keys
        allowed_keys = {
            'theme', 'notifications', 'default_priority', 'default_color',
            'default_list_view', 'timezone', 'date_format', 'time_format'
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
                'enabled', 'due_date_reminders', 'routine_reminders', 'push_notifications'
            }
            
            for key in notifications.keys():
                if key not in allowed_notification_keys:
                    raise serializers.ValidationError(f"Invalid notification key: {key}")
        
        return value


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    serializer for user registration (email/password)
    """
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True, required=True)
    
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
    serializer for social authentication
    """
    provider = serializers.ChoiceField(choices=['google', 'apple', 'facebook'])
    access_token = serializers.CharField(required=True)
    user_info = serializers.DictField(required=False)
    
    def validate_provider(self, value):
        """validate social auth provider"""
        allowed_providers = ['google', 'apple', 'facebook']
        if value not in allowed_providers:
            raise serializers.ValidationError(f"Invalid provider: {value}")
        return value


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