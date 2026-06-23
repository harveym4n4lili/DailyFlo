"""
Validate and normalise LLM proposals before returning them to the app.

Untrusted model output — drop invalid rows instead of failing the whole request.
"""

from __future__ import annotations

import uuid
from typing import Any

from apps.llm.services.duration_utils import parse_duration_minutes
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
    if payload.get('time'):
        normalised['time'] = str(payload['time'])[:5]
    if payload.get('duration') is not None:
        minutes = parse_duration_minutes(payload.get('duration'))
        if minutes is not None:
            normalised['duration'] = minutes
    if payload.get('icon'):
        normalised['icon'] = str(payload['icon'])[:50]

    return normalised


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
        cleaned['time'] = str(updates['time'])[:5]
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
