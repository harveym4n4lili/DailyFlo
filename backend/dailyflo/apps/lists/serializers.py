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
