"""
Validate and normalise LLM proposals before returning them to the app.

Untrusted model output — drop invalid rows instead of failing the whole request.
"""

from __future__ import annotations

import uuid
from typing import Any

from apps.llm.services.duration_utils import parse_duration_minutes
from apps.llm.services.reminder_utils import (
    normalise_alert_ids,
    reminders_from_alert_ids,
)
from apps.lists.models import List
from apps.tasks.models import Task

VALID_COLORS = {choice[0] for choice in Task.COLOR_CHOICES}
VALID_ROUTINES = {choice[0] for choice in Task.ROUTINE_TYPE_CHOICES}
VALID_PRIORITIES = {1, 2, 3, 4, 5}
VALID_TYPES = {'create', 'update', 'delete'}


def _user_task_ids(user) -> set[str]:
    return {
        str(task_id)
        for task_id in Task.objects.filter(user=user, soft_deleted=False).values_list('id', flat=True)
    }


def _user_list_ids(user) -> set[str]:
    return {
        str(list_id)
        for list_id in List.objects.filter(user=user, soft_deleted=False).values_list('id', flat=True)
    }


def _normalise_time_value(value: Any) -> str | None:
    if value is None or value == '':
        return None
    text = str(value).strip()
    if not text or text.lower() == 'none':
        return None
    return text[:5]


def _apply_alert_ids_to_payload(
    target: dict[str, Any],
    *,
    alert_ids_raw: Any,
    duration: int,
    has_scheduled_time: bool,
) -> None:
    normalised_ids = normalise_alert_ids(
        alert_ids_raw,
        duration=duration,
        has_scheduled_time=has_scheduled_time,
    )
    if normalised_ids is None:
        return
    target['metadata'] = {'reminders': reminders_from_alert_ids(normalised_ids)}


def _normalise_create_payload(payload: dict[str, Any], user) -> dict[str, Any] | None:
    title = (payload.get('title') or '').strip()
    if not title:
        return None

    list_id = payload.get('listId')
    if list_id is not None and list_id != '':
        list_id_str = str(list_id)
        if list_id_str not in _user_list_ids(user):
            list_id = None
        else:
            list_id = list_id_str
    else:
        list_id = None

    color = payload.get('color') or 'blue'
    if color not in VALID_COLORS:
        color = 'blue'

    routine_type = payload.get('routineType') or 'once'
    if routine_type not in VALID_ROUTINES:
        routine_type = 'once'

    priority = payload.get('priorityLevel', 3)
    try:
        priority = int(priority)
    except (TypeError, ValueError):
        priority = 3
    if priority not in VALID_PRIORITIES:
        priority = 3

    normalised: dict[str, Any] = {
        'title': title[:255],
        'listId': list_id,
        'color': color,
        'routineType': routine_type,
        'priorityLevel': priority,
    }

    if payload.get('description'):
        normalised['description'] = str(payload['description'])[:5000]
    if payload.get('dueDate'):
        normalised['dueDate'] = str(payload['dueDate'])
    time_value = _normalise_time_value(payload.get('time')) if 'time' in payload else None
    if time_value:
        normalised['time'] = time_value
    if payload.get('duration') is not None:
        minutes = parse_duration_minutes(payload.get('duration'))
        if minutes is not None:
            normalised['duration'] = minutes
    if payload.get('icon'):
        normalised['icon'] = str(payload['icon'])[:50]

    duration_minutes = normalised.get('duration', 0)
    has_scheduled_time = bool(normalised.get('dueDate') and normalised.get('time'))
    _apply_alert_ids_to_payload(
        normalised,
        alert_ids_raw=payload.get('alertIds'),
        duration=duration_minutes,
        has_scheduled_time=has_scheduled_time,
    )

    return normalised


def _task_schedule_snapshot(user, task_id: str) -> dict[str, Any] | None:
    row = (
        Task.objects.filter(user=user, id=task_id, soft_deleted=False)
        .values('due_date', 'time', 'duration')
        .first()
    )
    return row


def _effective_schedule_for_update(
    *,
    task_row: dict[str, Any] | None,
    cleaned: dict[str, Any],
) -> tuple[bool, int]:
    due_date = cleaned['dueDate'] if 'dueDate' in cleaned else task_row.get('due_date') if task_row else None
    if 'time' in cleaned:
        time_value = cleaned['time']
    elif task_row and task_row.get('time'):
        time_value = task_row['time'].strftime('%H:%M')
    else:
        time_value = None

    if 'duration' in cleaned and cleaned['duration'] is not None:
        duration = cleaned['duration']
    elif task_row:
        duration = task_row.get('duration') or 0
    else:
        duration = 0

    has_scheduled_time = bool(due_date and time_value)
    return has_scheduled_time, duration


def _normalise_update_payload(payload: dict[str, Any], user, valid_task_ids: set[str]) -> dict[str, Any] | None:
    task_id = str(payload.get('taskId') or '')
    if not task_id or task_id not in valid_task_ids:
        return None

    updates = payload.get('updates') or {}
    if not isinstance(updates, dict) or not updates:
        return None

    cleaned: dict[str, Any] = {}
    if 'title' in updates and updates['title']:
        cleaned['title'] = str(updates['title'])[:255]
    if 'description' in updates:
        cleaned['description'] = str(updates['description'])[:5000]
    if 'dueDate' in updates:
        cleaned['dueDate'] = updates['dueDate']
    if 'time' in updates:
        cleaned['time'] = _normalise_time_value(updates['time'])
    if 'listId' in updates:
        lid = updates['listId']
        if lid is None or lid == '':
            cleaned['listId'] = None
        elif str(lid) in _user_list_ids(user):
            cleaned['listId'] = str(lid)
    if 'priorityLevel' in updates:
        try:
            p = int(updates['priorityLevel'])
            if p in VALID_PRIORITIES:
                cleaned['priorityLevel'] = p
        except (TypeError, ValueError):
            pass
    if 'color' in updates and updates['color'] in VALID_COLORS:
        cleaned['color'] = updates['color']
    if 'routineType' in updates and updates['routineType'] in VALID_ROUTINES:
        cleaned['routineType'] = updates['routineType']
    if 'duration' in updates:
        minutes = parse_duration_minutes(updates['duration'])
        if minutes is not None:
            cleaned['duration'] = minutes
    if 'isCompleted' in updates:
        cleaned['isCompleted'] = bool(updates['isCompleted'])

    if 'alertIds' in updates:
        task_row = _task_schedule_snapshot(user, task_id)
        has_scheduled_time, duration_minutes = _effective_schedule_for_update(
            task_row=task_row,
            cleaned=cleaned,
        )
        _apply_alert_ids_to_payload(
            cleaned,
            alert_ids_raw=updates.get('alertIds'),
            duration=duration_minutes,
            has_scheduled_time=has_scheduled_time,
        )

    if not cleaned:
        return None

    return {'taskId': task_id, 'updates': cleaned}


def _normalise_delete_payload(payload: dict[str, Any], valid_task_ids: set[str]) -> dict[str, Any] | None:
    task_id = str(payload.get('taskId') or '')
    if not task_id or task_id not in valid_task_ids:
        return None
    return {'taskId': task_id}


def validate_proposals(raw_proposals: Any, user) -> list[dict[str, Any]]:
    """Filter and normalise proposals; assign ids when missing."""
    if not isinstance(raw_proposals, list):
        return []

    valid_task_ids = _user_task_ids(user)
    validated: list[dict[str, Any]] = []

    for item in raw_proposals:
        if not isinstance(item, dict):
            continue

        proposal_type = item.get('type')
        if proposal_type not in VALID_TYPES:
            continue

        payload = item.get('payload')
        if not isinstance(payload, dict):
            continue

        if proposal_type == 'create':
            normalised_payload = _normalise_create_payload(payload, user)
        elif proposal_type == 'update':
            normalised_payload = _normalise_update_payload(payload, user, valid_task_ids)
        else:
            normalised_payload = _normalise_delete_payload(payload, valid_task_ids)

        if not normalised_payload:
            continue

        proposal_id = item.get('id') or str(uuid.uuid4())
        summary = (item.get('summary') or '').strip() or f'{proposal_type} task'

        validated.append(
            {
                'id': str(proposal_id),
                'type': proposal_type,
                'summary': summary[:500],
                'payload': normalised_payload,
            }
        )

    return validated
