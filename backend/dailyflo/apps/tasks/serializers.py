from rest_framework import serializers
from .models import Task
from apps.lists.models import List


class TaskListSerializer(serializers.ModelSerializer):
    """
    Serializer for listing tasks (minimal data)
    """
    list_name = serializers.SerializerMethodField()
    list_color = serializers.SerializerMethodField()
    
    def get_list_name(self, obj):
        """safely get list name, handling null lists"""
        return obj.list.name if obj.list else None
    
    def get_list_color(self, obj):
        """safely get list color, handling null lists"""
        return obj.list.color if obj.list else None
    
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    is_overdue = serializers.SerializerMethodField()
    
    def get_is_overdue(self, obj):
        """get overdue status from model method"""
        return obj.is_overdue()
    
    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'icon', 'time', 'duration', 'due_date', 'is_completed',
            'completed_at', 'priority_level', 'priority_display', 'color',
            'routine_type', 'list', 'list_name', 'list_color', 'is_overdue',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'completed_at']


class TaskDetailSerializer(serializers.ModelSerializer):
    """
    Serializer for detailed task view (includes subtasks and reminders)
    """
    list_name = serializers.SerializerMethodField()
    list_color = serializers.SerializerMethodField()
    
    def get_list_name(self, obj):
        """safely get list name, handling null lists"""
        return obj.list.name if obj.list else None
    
    def get_list_color(self, obj):
        """safely get list color, handling null lists"""
        return obj.list.color if obj.list else None
    
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    is_overdue = serializers.SerializerMethodField()
    subtasks_count = serializers.SerializerMethodField()
    completed_subtasks_count = serializers.SerializerMethodField()
    
    def get_is_overdue(self, obj):
        """get overdue status from model method"""
        return obj.is_overdue()
    
    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'icon', 'time', 'duration', 'due_date', 'is_completed',
            'completed_at', 'priority_level', 'priority_display', 'color',
            'routine_type', 'sort_order', 'list', 'list_name', 'list_color',
            'is_overdue', 'subtasks_count', 'completed_subtasks_count',
            'metadata', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'completed_at']
    
    def get_subtasks_count(self, obj):
        return obj.get_total_subtasks_count()
    
    def get_completed_subtasks_count(self, obj):
        return obj.get_completed_subtasks_count()


class TaskCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new tasks
    """
    
    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'icon', 'time', 'duration', 'due_date', 'priority_level',
            'color', 'routine_type', 'list', 'sort_order', 'metadata', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']  # These are auto-generated, read-only
    
    def validate_list(self, value):
        """validate that the list belongs to the current user"""
        user = self.context['request'].user
        
        # TEMPORARY: Handle AnonymousUser for testing without login feature
        # If user is not authenticated, get or create a default test user
        if not user.is_authenticated:
            from apps.accounts.models import CustomUser
            test_user, _ = CustomUser.objects.get_or_create(
                email='test@dailyflo.com',
                defaults={
                    'first_name': 'Test',
                    'last_name': 'User',
                    'is_active': True,
                }
            )
            user = test_user
        
        if value and value.user != user:
            raise serializers.ValidationError("You can only assign tasks to your own lists.")
        return value
    
    def validate_due_date(self, value):
        """validate due date is not in the past"""
        if value:
            from django.utils import timezone
            if value < timezone.now():
                raise serializers.ValidationError("Due date cannot be in the past.")
        return value
    
    def create(self, validated_data):
        """create new task with current user"""
        user = self.context['request'].user
        
        # TEMPORARY: Handle AnonymousUser for testing without login feature
        # If user is not authenticated, get or create a default test user
        if not user.is_authenticated:
            from apps.accounts.models import CustomUser
            # Get or create a default test user for unauthenticated requests
            # This allows testing without login feature
            test_user, created = CustomUser.objects.get_or_create(
                email='test@dailyflo.com',
                defaults={
                    'first_name': 'Test',
                    'last_name': 'User',
                    'is_active': True,
                }
            )
            user = test_user
        
        validated_data['user'] = user
        return super().create(validated_data)


class TaskUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating existing tasks
    """
    
    class Meta:
        model = Task
        fields = [
            'title', 'description', 'icon', 'time', 'duration', 'due_date', 'priority_level',
            'color', 'routine_type', 'list', 'sort_order', 'metadata'
        ]
    
    def validate_list(self, value):
        """validate that the list belongs to the current user"""
        if value and value.user != self.context['request'].user:
            raise serializers.ValidationError("You can only assign tasks to your own lists.")
        return value
    
    def validate_due_date(self, value):
        """validate due date is not in the past"""
        if value:
            from django.utils import timezone
            if value < timezone.now():
                raise serializers.ValidationError("Due date cannot be in the past.")
        return value


class TaskCompleteSerializer(serializers.ModelSerializer):
    """
    Serializer for marking tasks as complete/incomplete
    """
    
    class Meta:
        model = Task
        fields = ['is_completed']
    
    def update(self, instance, validated_data):
        """update task completion status"""
        is_completed = validated_data.get('is_completed', instance.is_completed)
        
        if is_completed and not instance.is_completed:
            instance.mark_completed()
        elif not is_completed and instance.is_completed:
            instance.mark_incomplete()
        
        return instance


class ListSerializer(serializers.ModelSerializer):
    """
    Serializer for task lists
    """
    task_count = serializers.SerializerMethodField()
    completed_task_count = serializers.SerializerMethodField()
    pending_task_count = serializers.SerializerMethodField()
    
    class Meta:
        model = List
        fields = [
            'id', 'name', 'description', 'color', 'icon',
            'is_default', 'sort_order', 'task_count',
            'completed_task_count', 'pending_task_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_task_count(self, obj):
        return obj.get_task_count()
    
    def get_completed_task_count(self, obj):
        return obj.get_completed_task_count()
    
    def get_pending_task_count(self, obj):
        return obj.get_pending_task_count()
    
    def create(self, validated_data):
        """create new list with current user"""
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class ListCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new lists
    """
    
    class Meta:
        model = List
        fields = ['name', 'description', 'color', 'icon', 'sort_order']
    
    def create(self, validated_data):
        """create new list with current user"""
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
