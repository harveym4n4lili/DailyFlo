"""
per-habit streak stats, heatmap dates, and rolling trend series.
"""

from datetime import date, timedelta

from apps.gamification.services.stats import _current_streak, _longest_streak, get_user_timezone
from apps.habits.models import HabitCompletion
from apps.habits.services.habit_schedule import habit_is_due

HEATMAP_DAYS = 365
TREND_WINDOW_DAYS = 30


def _completion_dates_for_habit(habit) -> set[date]:
    return set(
        HabitCompletion.objects.filter(habit=habit, is_complete=True).values_list('completion_date', flat=True)
    )


def habit_streaks(habit, today: date) -> dict:
    dates = _completion_dates_for_habit(habit)
    return {
        'currentStreak': _current_streak(dates, today),
        'longestStreak': _longest_streak(dates),
    }


def habit_heatmap(habit, today: date) -> dict:
    """last 365 calendar days — dates where habit was marked complete."""
    start = today - timedelta(days=HEATMAP_DAYS - 1)
    dates = _completion_dates_for_habit(habit)
    completed = sorted(d for d in dates if start <= d <= today)
    return {
        'startDate': start.isoformat(),
        'days': HEATMAP_DAYS,
        'completedDates': [d.isoformat() for d in completed],
    }


def _rolling7_day_rate(habit, anchor: date, completed_dates: set[date]) -> float:
    """fraction of scheduled days in trailing 7 days (inclusive) that were completed."""
    trail_start = anchor - timedelta(days=6)
    scheduled = 0
    done = 0
    cur = trail_start
    while cur <= anchor:
        if habit_is_due(habit, cur):
            scheduled += 1
            if cur in completed_dates:
                done += 1
        cur += timedelta(days=1)
    if scheduled <= 0:
        return 0.0
    return round(done / scheduled, 4)


def habit_trend(habit, today: date) -> dict:
    """30-day window — one rolling 7-day completion rate per calendar day."""
    completed = _completion_dates_for_habit(habit)
    window_start = today - timedelta(days=TREND_WINDOW_DAYS - 1)
    points = []
    for offset in range(TREND_WINDOW_DAYS):
        d = window_start + timedelta(days=offset)
        points.append({
            'date': d.isoformat(),
            'rolling7DayRate': _rolling7_day_rate(habit, d, completed),
        })
    return {'windowDays': TREND_WINDOW_DAYS, 'points': points}


def habit_full_stats(habit, today: date) -> dict:
    """response shape for GET /habits/{id}/stats/."""
    streaks = habit_streaks(habit, today)
    return {
        **streaks,
        'heatmap': habit_heatmap(habit, today),
        'trend': habit_trend(habit, today),
    }


def user_today_from_prefs(user):
    from django.utils import timezone as django_tz

    user_tz = get_user_timezone(user)
    return django_tz.now().astimezone(user_tz).date()
