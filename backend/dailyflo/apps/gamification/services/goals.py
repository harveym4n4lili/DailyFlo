"""
goal period windows and progress from completed activity logs.
"""

from datetime import date, timedelta

from apps.gamification.models import UserGoal
from apps.gamification.services.stats import effective_completion_date, get_user_timezone, _week_start
from apps.tasks.models import ActivityLog

MAX_ACTIVE_GOALS = 5


def period_window(period: str, today: date):
    """return (start_date inclusive, end_date inclusive) for the current period."""
    if period == 'daily':
        return today, today
    if period == 'weekly':
        return _week_start(today), today
    # monthly
    return today.replace(day=1), today


def period_label(period: str) -> str:
    labels = {'daily': 'Today', 'weekly': 'This week', 'monthly': 'This month'}
    return labels.get(period, period)


def count_completions_in_window(user, user_tz, start: date, end: date, linked_task_id=None):
    """count completed logs whose effective date falls in [start, end]."""
    logs = ActivityLog.objects.filter(user=user, action_type='completed')
    if linked_task_id:
        logs = logs.filter(task_id=linked_task_id)
    count = 0
    for log in logs.only('occurrence_date', 'created_at', 'task_id'):
        ed = effective_completion_date(log, user_tz)
        if start <= ed <= end:
            count += 1
    return count


def enrich_goal(goal, user, user_tz, today: date):
    start, end = period_window(goal.period, today)
    linked_id = str(goal.linked_task_id) if goal.linked_task_id else None
    if goal.goal_type == 'linked_task' and not linked_id:
        current_count = 0
    else:
        current_count = count_completions_in_window(
            user,
            user_tz,
            start,
            end,
            linked_task_id=goal.linked_task_id if goal.goal_type == 'linked_task' else None,
        )
    target = goal.target_count
    is_met = current_count >= target
    return {
        'id': str(goal.id),
        'title': goal.title,
        'goalType': goal.goal_type,
        'targetCount': target,
        'currentCount': current_count,
        'period': goal.period,
        'periodLabel': period_label(goal.period),
        'linkedTaskId': linked_id,
        'isActive': goal.is_active,
        'isMet': is_met,
        'createdAt': goal.created_at.isoformat(),
        'updatedAt': goal.updated_at.isoformat(),
    }


def compute_goals_progress_summary(user, user_tz, today: date):
    """counts for browse summary card — on track = met or has progress toward target."""
    active = UserGoal.objects.filter(user=user, is_active=True)
    total = active.count()
    on_track = 0
    for goal in active:
        data = enrich_goal(goal, user, user_tz, today)
        if data['isMet']:
            on_track += 1
        elif data['targetCount'] > 0 and data['currentCount'] > 0:
            on_track += 1
    return {'goalsOnTrack': on_track, 'goalsTotal': total}


def list_user_goals(user):
    from django.utils import timezone as django_tz

    user_tz = get_user_timezone(user)
    today = django_tz.now().astimezone(user_tz).date()
    goals = UserGoal.objects.filter(user=user, is_active=True)
    return [enrich_goal(g, user, user_tz, today) for g in goals]
