from django.contrib import admin
from .models import List

# Registers models in admin panel

class ListAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'color', 'is_default', 'task_count', 'completed_task_count', 'pending_task_count']
    list_filter = ['color', 'is_default', 'soft_deleted', 'created_at']
    search_fields = ['name', 'description', 'user__email', 'user__first_name', 'user__last_name']
    readonly_fields = ['id', 'created_at', 'updated_at', 'task_count', 'completed_task_count', 'pending_task_count']
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'user')
        }),
        ('Visual Organization', {
            'fields': ('color', 'icon', 'sort_order')
        }),
        ('Properties', {
            'fields': ('is_default', 'soft_deleted')
        }),
        ('Statistics', {
            'fields': ('task_count', 'completed_task_count', 'pending_task_count'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def task_count(self, obj):
        return obj.get_task_count()
    task_count.short_description = 'Total Tasks'
    
    def completed_task_count(self, obj):
        return obj.get_completed_task_count()
    completed_task_count.short_description = 'Completed'
    
    def pending_task_count(self, obj):
        return obj.get_pending_task_count()
    pending_task_count.short_description = 'Pending'


admin.site.register(List, ListAdmin)