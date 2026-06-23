"""
determine whether a habit is scheduled on a calendar day — used by GET /habits/today/.
"""

from datetime import date, timedelta

from apps.gamification.services.stats import _week_start


def _python_weekday(d: date) -> int:
    """monday=0 … sunday=6 (python convention)."""
    return d.weekday()


def _completions_this_iso_week(habit, target_date: date) -> int:
    week_start = _week_start(target_date)
    week_end = week_start + timedelta(days=6)
    return habit.completions.filter(
        completion_date__gte=week_start,
        completion_date__lte=week_end,
        is_complete=True,
    ).count()


def habit_is_due(habit, target_date: date) -> bool:
    """return true when the habit should appear on today's list."""
    freq = habit.frequency_type
    config = habit.frequency_config or {}
    wd = _python_weekday(target_date)

    if freq == 'daily':
        return True

    if freq == 'weekly':
        configured = config.get('day_of_week', config.get('dayOfWeek', 0))
        try:
            return wd == int(configured)
        except (TypeError, ValueError):
            return False

    if freq == 'weekdays':
        return wd <= 4

    if freq == 'weekends':
        return wd >= 5

    if freq == 'custom':
        days = config.get('days') or []
        try:
            return wd in {int(d) for d in days}
        except (TypeError, ValueError):
            return False

    if freq == 'times_per_week':
        target_count = config.get('target_count', config.get('targetCount', 1))
        try:
            target_count = int(target_count)
        except (TypeError, ValueError):
            target_count = 1
        if target_count <= 0:
            return False
        if target_count > 7:
            return True
        completed = _completions_this_iso_week(habit, target_date)
        if completed >= target_count:
            return False
        week_start = _week_start(target_date)
        days_left_including_today = (week_start + timedelta(days=6) - target_date).days + 1
        remaining = target_count - completed
        return remaining > 0 and days_left_including_today >= remaining

    return False
