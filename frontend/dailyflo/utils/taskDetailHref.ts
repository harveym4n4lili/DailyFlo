/**
 * builds the expo-router href for opening a task (same params as router.push from today/planner).
 * used by TaskCard’s ios Link + AppleZoom so the transition matches programmatic navigation.
 */

import type { Href } from 'expo-router';

import type { Task } from '@/types';
import { getBaseTaskId, getOccurrenceDateFromId, isExpandedRecurrenceId } from '@/utils/recurrenceUtils';

export function taskDetailHref(task: Task): Href {
  const baseId = isExpandedRecurrenceId(task.id) ? getBaseTaskId(task.id) : task.id;
  const occurrenceDate = isExpandedRecurrenceId(task.id)
    ? getOccurrenceDateFromId(task.id) ?? undefined
    : undefined;

  return {
    pathname: '/task/[taskId]',
    params: { taskId: baseId, ...(occurrenceDate ? { occurrenceDate } : {}) },
  } as Href;
}
