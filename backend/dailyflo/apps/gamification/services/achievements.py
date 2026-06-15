"""
on-read achievement evaluator — unlocks UserAchievement when criteria met.
"""

from datetime import date, timedelta

from django.utils import timezone as django_tz

from apps.gamification.models import AchievementDefinition, UserAchievement
from apps.gamification.services.stats import _current_streak, _longest_streak, _week_start, effective_completion_date, get_user_timezone


def _count_logs(logs) -> int:
    return logs.count() if hasattr(logs, 'count') else len(logs)


def _logs_with_action(logs, action_type: str):
    """filter activity logs by action_type — works on queryset or materialized list."""
    if hasattr(logs, 'filter'):
        return logs.filter(action_type=action_type)
    return [log for log in logs if getattr(log, 'action_type', None) == action_type]


def _lifetime_completion_count(logs, action_type: str = 'completed') -> int:
    """count completion events — task achievements use 'completed'; habits use 'habit_completed'."""
    return _count_logs(_logs_with_action(logs, action_type))


def _criteria_met(criteria: dict, user, completion_dates: set, logs) -> bool:
    ctype = criteria.get('type')
    user_tz = get_user_timezone(user)
    today = django_tz.now().astimezone(user_tz).date()

    if ctype == 'streak':
        min_days = criteria.get('min_days', 1)
        return _current_streak(completion_dates, today) >= min_days

    if ctype == 'longest_streak':
        return _longest_streak(completion_dates) >= criteria.get('min_days', 1)

    if ctype == 'completion_count':
        period = criteria.get('period', 'all_time')
        min_count = criteria.get('min', 1)
        task_logs = _logs_with_action(logs, 'completed')
        if period == 'all_time':
            return _count_logs(task_logs) >= min_count
        if period == 'week':
            week_start = _week_start(today)
            count = sum(
                1 for log in task_logs
                if effective_completion_date(log, user_tz) >= week_start
            )
            return count >= min_count
        return False

    if ctype == 'habit_completion_count':
        min_count = criteria.get('min', 1)
        return _lifetime_completion_count(logs, 'habit_completed') >= min_count

    if ctype == 'perfect_week':
        week_start = _week_start(today)
        days_in_week = {week_start + timedelta(days=i) for i in range(7)}
        return days_in_week.issubset(completion_dates)

    if ctype == 'first_goal_met':
        from apps.gamification.services.goals import list_user_goals
        return any(g['isMet'] for g in list_user_goals(user))

    return False


def evaluate_and_unlock_achievements(user, completion_dates: set, logs):
    """create UserAchievement rows for newly satisfied definitions."""
    definitions = AchievementDefinition.objects.all()
    existing_ids = set(
        UserAchievement.objects.filter(user=user).values_list('achievement_id', flat=True)
    )
    for definition in definitions:
        if definition.id in existing_ids:
            continue
        if _criteria_met(definition.criteria or {}, user, completion_dates, logs):
            UserAchievement.objects.create(user=user, achievement=definition)


def list_achievements_for_user(user, completion_dates: set, logs):
    """catalog with unlock state and progress hints for locked achievements."""
    evaluate_and_unlock_achievements(user, completion_dates, logs)
    user_tz = get_user_timezone(user)
    today = django_tz.now().astimezone(user_tz).date()
    unlock_map = {
        str(ua.achievement_id): ua.unlocked_at.isoformat()
        for ua in UserAchievement.objects.filter(user=user).select_related('achievement')
    }

    result = []
    for definition in AchievementDefinition.objects.all():
        criteria = definition.criteria or {}
        unlocked_at = unlock_map.get(str(definition.id))
        progress = _progress_hint(criteria, user, completion_dates, logs, today, user_tz)
        result.append({
            'id': str(definition.id),
            'code': definition.code,
            'title': definition.title,
            'description': definition.description,
            'iconKey': definition.icon_key,
            'sortOrder': definition.sort_order,
            'unlockedAt': unlocked_at if unlocked_at else None,
            'progressLabel': progress,
        })
    return result


def _progress_hint(criteria, user, completion_dates, logs, today, user_tz):
    if criteria.get('type') == 'streak':
        target = criteria.get('min_days', 1)
        current = _current_streak(completion_dates, today)
        return f'{min(current, target)}/{target} days'
    if criteria.get('type') == 'completion_count' and criteria.get('period') == 'all_time':
        target = criteria.get('min', 1)
        current = _lifetime_completion_count(logs, 'completed')
        return f'{min(current, target)}/{target}'
    if criteria.get('type') == 'habit_completion_count':
        target = criteria.get('min', 1)
        current = _lifetime_completion_count(logs, 'habit_completed')
        return f'{min(current, target)}/{target}'
    return None


def unlocked_achievement_count(user) -> int:
    return UserAchievement.objects.filter(user=user).count()
