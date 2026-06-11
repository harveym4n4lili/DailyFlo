from django.contrib import admin

from apps.habits.models import Habit, HabitCompletion


@admin.register(Habit)
class HabitAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'frequency_type', 'tracking_type', 'is_active', 'soft_deleted')
    list_filter = ('frequency_type', 'tracking_type', 'is_active', 'soft_deleted')


@admin.register(HabitCompletion)
class HabitCompletionAdmin(admin.ModelAdmin):
    list_display = ('habit', 'completion_date', 'logged_value', 'is_complete')
