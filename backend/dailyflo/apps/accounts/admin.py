from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import CustomUser

# Registers models in admin panel

class CustomUserAdmin(BaseUserAdmin):
    list_display = ['email', 'first_name', 'last_name', 'auth_provider', 'is_email_verified', 'is_active', 'created_at']
    list_filter = ['auth_provider', 'is_email_verified', 'is_active', 'soft_deleted', 'created_at']
    search_fields = ['email', 'first_name', 'last_name', 'username']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Authentication', {
            'fields': ('email', 'password', 'auth_provider', 'auth_provider_id')
        }),
        ('Personal Information', {
            'fields': ('first_name', 'last_name', 'avatar_url')
        }),
        ('Account Status', {
            'fields': ('is_active', 'is_email_verified', 'soft_deleted', 'last_login')
        }),
        ('Preferences', {
            'fields': ('preferences',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    add_fieldsets = (
        ('Create New User', {
            'classes': ('wide',),
            'fields': ('email', 'first_name', 'last_name', 'password1', 'password2', 'auth_provider'),
        }),
    )
    
    readonly_fields = ['id', 'created_at', 'updated_at', 'last_login']
    
    def get_queryset(self, request):
        """Filter out soft deleted users by default"""
        return super().get_queryset(request).filter(soft_deleted=False)


admin.site.register(CustomUser, CustomUserAdmin)