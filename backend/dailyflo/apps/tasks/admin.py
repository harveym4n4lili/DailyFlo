from django.contrib import admin
from .models import Task

# Registers models in admin panel

class TaskAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'is_completed', 'due_date', 'priority_level']
    list_filter = ['is_completed', 'priority_level', 'color', 'routine_type']
    search_fields = ['title', 'description']
    readonly_fields = ['id', 'created_at', 'updated_at']


admin.site.register(Task, TaskAdmin)