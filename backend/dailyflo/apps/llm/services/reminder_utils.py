"""Normalise LLM reminder output into DailyFlo task metadata.reminders rows."""

from __future__ import annotations

import re
from typing import Any

_FIXED_ALERT_IDS = frozenset({'start', 'end', '15-min'})
_BEFORE_ALERT_PATTERN = re.compile(r'^before-(\d+)$')
_MAX_BEFORE_MINUTES = 23 * 60 + 55


def is_valid_alert_id(alert_id: str) -> bool:
    if alert_id in _FIXED_ALERT_IDS:
        return True
    match = _BEFORE_ALERT_PATTERN.match(alert_id)
    if not match:
        return False
    try:
        minutes = int(match.group(1))
    except ValueError:
        return False
    return 0 <= minutes <= _MAX_BEFORE_MINUTES


def normalise_alert_ids(
    raw_ids: Any,
    *,
    duration: int = 0,
    has_scheduled_time: bool,
) -> list[str] | None:
    """
    Parse alertIds from model output.

    Returns None when the field was not provided (app default reminders apply on timed creates).
    Returns [] when reminders were explicitly cleared or the task cannot have alerts.
    """
    if raw_ids is None:
        return None
    if not isinstance(raw_ids, list):
        return []

    if not has_scheduled_time:
        return []

    seen: set[str] = set()
    result: list[str] = []
    for item in raw_ids:
        if not isinstance(item, str):
            continue
        alert_id = item.strip()
        if not alert_id or not is_valid_alert_id(alert_id):
            continue
        if alert_id == 'end' and duration <= 0:
            continue
        if alert_id in seen:
            continue
        seen.add(alert_id)
        result.append(alert_id)

    return result


def reminders_from_alert_ids(alert_ids: list[str]) -> list[dict[str, Any]]:
    """Shape stored on task.metadata.reminders — scheduledTime is a placeholder; client computes fire time."""
    return [
        {
            'id': alert_id,
            'type': 'custom',
            'scheduledTime': '1970-01-01T00:00:00Z',
            'isEnabled': True,
        }
        for alert_id in alert_ids
    ]


def extract_alert_ids_from_metadata(metadata: Any) -> list[str]:
    if not isinstance(metadata, dict):
        return []
    reminders = metadata.get('reminders')
    if not isinstance(reminders, list):
        return []
    ids: list[str] = []
    for row in reminders:
        if not isinstance(row, dict):
            continue
        if row.get('isEnabled') is False:
            continue
        alert_id = row.get('id')
        if isinstance(alert_id, str) and alert_id.strip():
            ids.append(alert_id.strip())
    return ids
