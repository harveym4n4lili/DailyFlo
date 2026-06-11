"""
per-habit streak stats — reuses gamification calendar-day streak helpers.
"""

from datetime import date

from apps.gamification.services.stats import _current_streak, _longest_streak, get_user_timezone
from apps.habits.models import HabitCompletion


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


def user_today_from_prefs(user):
    from django.utils import timezone as django_tz

    user_tz = get_user_timezone(user)
    return django_tz.now().astimezone(user_tz).date()
