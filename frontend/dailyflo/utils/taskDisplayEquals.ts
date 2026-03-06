/**
 * Task display equality - compare tasks by display-relevant fields, not reference.
 *
 * When Redux updates (e.g. task 1's backend sync completes), the entire tasks array
 * gets new object references (Immer). Task 2's object is new but its content is unchanged.
 * Using reference equality (prev.task !== next.task) causes unnecessary re-renders of
 * sibling TaskCards/TimelineItems, which can interrupt animations and cause jank.
 *
 * This compares by value so we skip re-renders when a task's display data hasn't changed.
 */

import type { Task, Subtask } from '@/types';

/** fields that affect how a task card/timeline item is displayed */
const DISPLAY_FIELDS: (keyof Task)[] = [
  'id',
  'title',
  'isCompleted',
  'color',
  'icon',
  'dueDate',
  'time',
  'duration',
  'listId',
  'routineType',
  'softDeleted',
];

/** compare subtasks by id + isCompleted (what the subtask counter displays) */
function subtasksEqual(a: Subtask[] | undefined, b: Subtask[] | undefined): boolean {
  if (a === b) return true;
  if (!a || !b || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].id !== b[i].id || a[i].isCompleted !== b[i].isCompleted) return false;
  }
  return true;
}

export function taskDisplayEquals(a: Task, b: Task): boolean {
  if (a === b) return true;
  if (a.id !== b.id) return false;
  for (const key of DISPLAY_FIELDS) {
    const va = a[key];
    const vb = b[key];
    if (va !== vb) return false;
  }
  // subtask counter depends on metadata.subtasks - must re-render when subtask completion changes
  if (!subtasksEqual(a.metadata?.subtasks, b.metadata?.subtasks)) return false;
  return true;
}
