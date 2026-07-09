"""
Build a minimal task + list snapshot for the LLM system context.

The model needs real task ids to propose updates/deletes — but we only send
fields required for matching, not full descriptions or metadata blobs.
"""

from __future__ import annotations

import json
from typing import Any

from django.utils import timezone

from apps.llm.services.reminder_utils import extract_alert_ids_from_metadata
from apps.llm.services.schedule_context import build_schedule_context
from apps.lists.models import List
from apps.tasks.models import Task

# cap how many tasks we inject — keeps prompts smaller and cheaper
MAX_TASKS_IN_CONTEXT = 80


def build_task_context(*, user) -> dict[str, Any]:
    """Return JSON-serialisable context for the logged-in user."""
    lists_qs = (
        List.objects.filter(user=user, soft_deleted=False)
        .order_by('sort_order', 'name')
        .values('id', 'name')[:50]
    )
    user_lists = [
        {'id': str(row['id']), 'name': row['name']}
        for row in lists_qs
    ]

    tasks_qs = (
        Task.objects.filter(user=user, soft_deleted=False)
        .select_related('list')
        .order_by('-updated_at')
        .values(
            'id',
            'title',
            'due_date',
            'time',
            'duration',
            'routine_type',
            'metadata',
            'is_completed',
            'list_id',
            'list__name',
        )[:MAX_TASKS_IN_CONTEXT]
    )

    user_tasks = []
    for row in tasks_qs:
        due_date = row['due_date']
        time_value = row['time']
        user_tasks.append(
            {
                'id': str(row['id']),
                'title': row['title'],
                'dueDate': due_date.isoformat() if due_date else None,
                'time': time_value.strftime('%H:%M') if time_value else None,
                'duration': row['duration'] or 0,
                'routineType': row['routine_type'] or 'once',
                'alertIds': extract_alert_ids_from_metadata(row.get('metadata')),
                'isCompleted': row['is_completed'],
                'listId': str(row['list_id']) if row['list_id'] else None,
                'listName': row['list__name'],
            }
        )

    return {
        'todayDate': timezone.localdate().isoformat(),
        'userLists': user_lists,
        'userTasks': user_tasks,
        'schedule': build_schedule_context(user=user),
    }


def format_context_block(context: dict[str, Any]) -> str:
    """Turn context dict into a text block appended to the user prompt."""
    schedule = context.get('schedule') or {}
    return (
        'USER_LISTS (JSON):\n'
        f'{json.dumps(context["userLists"], ensure_ascii=False)}\n\n'
        'USER_TASKS (JSON):\n'
        f'{json.dumps(context["userTasks"], ensure_ascii=False)}\n\n'
        'USER_SCHEDULE (JSON — use this to pick dueDate/time without overlaps):\n'
        f'{json.dumps(schedule, ensure_ascii=False)}\n\n'
        f"Today's date: {context['todayDate']}"
    )
