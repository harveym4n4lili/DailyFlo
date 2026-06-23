"""
Build a schedule snapshot so the LLM can place tasks without overlapping the user.

Uses the same ideas as the planner timeline: wake/sleep bounds, timed blocks, free gaps.
"""

from __future__ import annotations

from datetime import date, timedelta
from typing import Any

from django.utils import timezone

from apps.tasks.models import Task

# how many calendar days ahead to scan for conflicts / open slots
SCHEDULE_LOOKAHEAD_DAYS = 14

# always include at least this many days (today + future) even when empty
MIN_SCHEDULE_DAYS_SHOWN = 7

# gaps shorter than this are not listed as usable free slots
MIN_FREE_SLOT_MINUTES = 15

# when duration is 0 on a task, treat it as this long for overlap math
DEFAULT_BLOCK_MINUTES = 30

DEFAULT_WAKE_TIME = '06:00'
DEFAULT_SLEEP_TIME = '23:00'


def _time_to_minutes(hhmm: str) -> int:
    hours, minutes = hhmm.split(':')
    return int(hours) * 60 + int(minutes)


def _minutes_to_time(minutes: int) -> str:
    clamped = max(0, min(minutes, 24 * 60 - 1))
    return f'{clamped // 60:02d}:{clamped % 60:02d}'


def _coerce_hhmm(value: str | None, fallback: str) -> str:
    if not value or not isinstance(value, str):
        return fallback
    parts = value.strip().split(':')
    if len(parts) != 2:
        return fallback
    try:
        hours = int(parts[0])
        minutes = int(parts[1])
    except ValueError:
        return fallback
    if not (0 <= hours <= 23 and 0 <= minutes <= 59):
        return fallback
    return f'{hours:02d}:{minutes:02d}'


def _read_schedule_preferences(user) -> dict[str, str]:
    """Wake/sleep window from user.preferences (matches mobile app keys)."""
    prefs = user.preferences or {}
    wake = prefs.get('wake_time') or prefs.get('wakeTime') or DEFAULT_WAKE_TIME
    sleep = prefs.get('sleep_time') or prefs.get('sleepTime') or DEFAULT_SLEEP_TIME
    tz_name = prefs.get('timezone') or 'UTC'
    return {
        'wakeTime': _coerce_hhmm(wake, DEFAULT_WAKE_TIME),
        'sleepTime': _coerce_hhmm(sleep, DEFAULT_SLEEP_TIME),
        'timezone': str(tz_name),
    }


def _block_end_minutes(start_minutes: int, duration_minutes: int) -> int:
    block_len = duration_minutes if duration_minutes > 0 else DEFAULT_BLOCK_MINUTES
    return start_minutes + block_len


def _merge_intervals(intervals: list[tuple[int, int]]) -> list[tuple[int, int]]:
    if not intervals:
        return []
    sorted_intervals = sorted(intervals, key=lambda item: item[0])
    merged = [sorted_intervals[0]]
    for start, end in sorted_intervals[1:]:
        last_start, last_end = merged[-1]
        if start <= last_end:
            merged[-1] = (last_start, max(last_end, end))
        else:
            merged.append((start, end))
    return merged


def _free_slots_for_day(
    *,
    blocks: list[tuple[int, int]],
    day_start: int,
    day_end: int,
    earliest_start: int,
) -> list[dict[str, Any]]:
    """Return open windows between wake and sleep, skipping past time on today."""
    window_start = max(day_start, earliest_start)
    if window_start >= day_end:
        return []

    busy = _merge_intervals(blocks)
    slots: list[dict[str, Any]] = []
    cursor = window_start

    for busy_start, busy_end in busy:
        clipped_start = max(busy_start, day_start)
        clipped_end = min(busy_end, day_end)
        if clipped_end <= window_start:
            continue
        if clipped_start > cursor:
            gap = clipped_start - cursor
            if gap >= MIN_FREE_SLOT_MINUTES:
                slots.append(
                    {
                        'start': _minutes_to_time(cursor),
                        'end': _minutes_to_time(clipped_start),
                        'durationMinutes': gap,
                    }
                )
        cursor = max(cursor, clipped_end)

    if cursor < day_end:
        gap = day_end - cursor
        if gap >= MIN_FREE_SLOT_MINUTES:
            slots.append(
                {
                    'start': _minutes_to_time(cursor),
                    'end': _minutes_to_time(day_end),
                    'durationMinutes': gap,
                }
            )

    return slots


def build_schedule_context(*, user) -> dict[str, Any]:
    """
    Per-day timed blocks + free slots for incomplete tasks in the near future.

    The model uses this to pick dueDate/time/duration that fit the user's day plan.
    """
    prefs = _read_schedule_preferences(user)
    wake_minutes = _time_to_minutes(prefs['wakeTime'])
    sleep_minutes = _time_to_minutes(prefs['sleepTime'])
    if sleep_minutes <= wake_minutes:
        sleep_minutes = _time_to_minutes(DEFAULT_SLEEP_TIME)

    today = timezone.localdate()
    now_local = timezone.localtime()
    current_time = now_local.strftime('%H:%M')
    range_end = today + timedelta(days=SCHEDULE_LOOKAHEAD_DAYS)

    timed_tasks = (
        Task.objects.filter(
            user=user,
            soft_deleted=False,
            is_completed=False,
            due_date__isnull=False,
            due_date__date__gte=today,
            due_date__date__lte=range_end,
            time__isnull=False,
        )
        .order_by('due_date', 'time')
        .values('id', 'title', 'due_date', 'time', 'duration')
    )

    all_day_tasks = (
        Task.objects.filter(
            user=user,
            soft_deleted=False,
            is_completed=False,
            due_date__isnull=False,
            due_date__date__gte=today,
            due_date__date__lte=range_end,
            time__isnull=True,
        )
        .order_by('due_date', 'title')
        .values('id', 'title', 'due_date')
    )

    days: dict[date, dict[str, Any]] = {}

    def ensure_day(day: date) -> dict[str, Any]:
        if day not in days:
            days[day] = {
                'date': day.isoformat(),
                'timedBlocks': [],
                'allDayTasks': [],
                'freeSlots': [],
            }
        return days[day]

    block_minutes_by_day: dict[date, list[tuple[int, int]]] = {}

    for row in timed_tasks:
        day = row['due_date'].date()
        day_row = ensure_day(day)
        start_minutes = row['time'].hour * 60 + row['time'].minute
        duration = row['duration'] or 0
        end_minutes = _block_end_minutes(start_minutes, duration)
        day_row['timedBlocks'].append(
            {
                'taskId': str(row['id']),
                'title': row['title'],
                'start': row['time'].strftime('%H:%M'),
                'end': _minutes_to_time(end_minutes),
                'durationMinutes': duration if duration > 0 else DEFAULT_BLOCK_MINUTES,
            }
        )
        block_minutes_by_day.setdefault(day, []).append((start_minutes, end_minutes))

    for row in all_day_tasks:
        day = row['due_date'].date()
        ensure_day(day)['allDayTasks'].append(
            {
                'taskId': str(row['id']),
                'title': row['title'],
            }
        )

    # always surface today + upcoming empty days so the model can propose new times
    for offset in range(MIN_SCHEDULE_DAYS_SHOWN):
        ensure_day(today + timedelta(days=offset))

    for day, day_row in days.items():
        earliest = wake_minutes
        if day == today:
            earliest = max(wake_minutes, _time_to_minutes(current_time))
        day_row['freeSlots'] = _free_slots_for_day(
            blocks=block_minutes_by_day.get(day, []),
            day_start=wake_minutes,
            day_end=sleep_minutes,
            earliest_start=earliest,
        )

    schedule_days = [days[key] for key in sorted(days.keys()) if key <= range_end]

    return {
        'schedulePreferences': prefs,
        'currentLocalTime': current_time,
        'scheduleDays': schedule_days,
    }
