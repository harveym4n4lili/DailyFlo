"""
aggregate completion stats from activity logs for gamification summary.
streak uses distinct calendar days (user timezone); period counts count completion events.
"""

from datetime import date, timedelta
from zoneinfo import ZoneInfo

from django.utils import timezone as django_tz

from apps.tasks.models import ActivityLog


def get_user_timezone(user):
    """read timezone string from user preferences json; fallback utc."""
    prefs = user.preferences if isinstance(user.preferences, dict) else {}
    tz_name = prefs.get('timezone') or 'UTC'
    try:
        return ZoneInfo(tz_name)
    except Exception:
        return ZoneInfo('UTC')


def effective_completion_date(log, user_tz):
    """
    calendar day that counts for streaks and period windows.
    recurring completions use occurrence_date; others use created_at in user tz.
    """
    if log.occurrence_date:
        return log.occurrence_date
    return log.created_at.astimezone(user_tz).date()


def _week_start(d: date) -> date:
    """monday-based week start in local calendar."""
    return d - timedelta(days=d.weekday())


def _current_streak(completion_dates: set[date], today: date) -> int:
    if not completion_dates:
        return 0
    if today in completion_dates:
        anchor = today
    elif (today - timedelta(days=1)) in completion_dates:
        anchor = today - timedelta(days=1)
    else:
        return 0
    streak = 0
    d = anchor
    while d in completion_dates:
        streak += 1
        d -= timedelta(days=1)
    return streak


def _longest_streak(completion_dates: set[date]) -> int:
    if not completion_dates:
        return 0
    sorted_dates = sorted(completion_dates)
    longest = 1
    current = 1
    for i in range(1, len(sorted_dates)):
        if (sorted_dates[i] - sorted_dates[i - 1]).days == 1:
            current += 1
            longest = max(longest, current)
        else:
            current = 1
    return longest


def compute_gamification_summary(user):
    """
    build summary dict for GET /gamification/summary/.
    evaluates achievements on read (side effect: may create UserAchievement rows).
    """
    from apps.gamification.services.achievements import (
        evaluate_and_unlock_achievements,
        unlocked_achievement_count,
    )
    from apps.gamification.services.goals import compute_goals_progress_summary

    user_tz = get_user_timezone(user)
    now_local = django_tz.now().astimezone(user_tz)
    today = now_local.date()
    week_start = _week_start(today)
    month_start = today.replace(day=1)

    logs = ActivityLog.objects.filter(
        user=user,
        action_type__in=['completed', 'habit_completed'],
    ).only('occurrence_date', 'created_at', 'task_id')

    completion_dates: set[date] = set()
    completions_today = 0
    completions_this_week = 0
    completions_this_month = 0
    last_completion_date = None

    for log in logs:
        ed = effective_completion_date(log, user_tz)
        completion_dates.add(ed)
        if last_completion_date is None or ed > last_completion_date:
            last_completion_date = ed
        if ed == today:
            completions_today += 1
        if ed >= week_start:
            completions_this_week += 1
        if ed >= month_start:
            completions_this_month += 1

    evaluate_and_unlock_achievements(user, completion_dates, logs)

    goals_summary = compute_goals_progress_summary(user, user_tz, today)

    return {
        'completionsToday': completions_today,
        'completionsThisWeek': completions_this_week,
        'completionsThisMonth': completions_this_month,
        'currentStreak': _current_streak(completion_dates, today),
        'longestStreak': _longest_streak(completion_dates),
        'lastCompletionDate': last_completion_date.isoformat() if last_completion_date else None,
        'goalsOnTrack': goals_summary['goalsOnTrack'],
        'goalsTotal': goals_summary['goalsTotal'],
        'unlockedAchievementCount': unlocked_achievement_count(user),
    }
