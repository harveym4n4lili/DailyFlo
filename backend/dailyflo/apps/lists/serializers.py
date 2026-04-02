from django.db.models import Max
from rest_framework import serializers
from .models import List


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
            'id', 'user', 'name', 'description', 'color', 'icon',
            'is_default', 'sort_order', 'metadata', 'soft_deleted',
            'task_count', 'completed_task_count', 'pending_task_count',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'user', 'created_at', 'updated_at', 'soft_deleted', 'is_default',
            'metadata',
            'task_count', 'completed_task_count', 'pending_task_count',
        ]
    
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
        fields = ['name', 'description', 'color', 'icon', 'sort_order', 'metadata']
    
    def create(self, validated_data):
        """create new list with current user; default sort_order to max+1 when omitted"""
        user = self.context['request'].user
        if 'sort_order' not in validated_data:
            agg = List.objects.filter(user=user, soft_deleted=False).aggregate(m=Max('sort_order'))
            max_so = agg['m']
            validated_data['sort_order'] = (max_so if max_so is not None else -1) + 1
        validated_data['user'] = user
        return super().create(validated_data)

class ListUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating existing lists
    """
    
    class Meta:
        model = List
        fields = ['name', 'description', 'color', 'icon', 'sort_order', 'metadata']
        # Note: No 'is_default' field - users shouldn't be able to change this
    
    def validate_name(self, value):
        """validate unique list name per user"""
        user = self.context['request'].user
        instance = self.instance  # Current list being updated
        
        # Check if another list with this name exists (excluding current list)
        if List.objects.filter(
            user=user, 
            name=value, 
            soft_deleted=False
        ).exclude(id=instance.id).exists():
            raise serializers.ValidationError("A list with this name already exists.")
        
        return value

class ListDeleteSerializer(serializers.Serializer):
    """
    Serializer for confirming list deletion
    """
    confirm_delete = serializers.BooleanField(required=True)
    move_tasks_to_inbox = serializers.BooleanField(default=True)
    
    def validate_confirm_delete(self, value):
        if not value:
            raise serializers.ValidationError("You must confirm the deletion.")
        return value