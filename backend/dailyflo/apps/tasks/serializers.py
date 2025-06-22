from rest_framework import serializers
from .models import Task, RecurringTask

class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = [
            'id',
            'user_id',
            'recurring_task_id',
            'title',
            'description',
            'due_date',
            'is_completed',
            'priority_level',
            'created_at',
            'updated_at',
            'completed_at',
            'metadata',
            'soft_deleted'
        ]
        read_only_fields = [
            'created_at',
            'updated_at'
        ]

        #  Validators and extended methods to be written here.
        
class RecurringTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = [
            'id',
            'user_id',
            'title',
            'description',
            'day_of_week',
            'due_date',
            'is_active',
            'priority_level',
            'created_at',
            'updated_at',
            'completed_at',
            'metadata',
            'soft_deleted'
        ]
        read_only_fields = [
            'created_at',
            'updated_at'
        ]
    
    #  Validators and extended methods to be written here.
