from django.contrib import admin

from .models import AchievementDefinition, UserAchievement, UserGoal


@admin.register(AchievementDefinition)
class AchievementDefinitionAdmin(admin.ModelAdmin):
    list_display = ('code', 'title', 'sort_order')


@admin.register(UserAchievement)
class UserAchievementAdmin(admin.ModelAdmin):
    list_display = ('user', 'achievement', 'unlocked_at')


@admin.register(UserGoal)
class UserGoalAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'goal_type', 'period', 'target_count', 'is_active')
