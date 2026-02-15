/**
 * Recurrence Utilities
 *
 * Handles expansion of recurring tasks (routineType: daily, weekly, monthly, yearly)
 * into virtual "occurrences" for display. Each occurrence is a copy of the task
 * with an effective due date. Completion is tracked per-occurrence via
 * metadata.recurrence_completions (array of YYYY-MM-DD strings).
 *
 * Flow:
 * - taskOccursOnDate: checks if a task's recurrence pattern includes a given date
 * - expandTasksForDates: given tasks and target dates, returns flat array of tasks
 *   (one-off tasks pass through; recurring tasks generate one virtual task per matching date)
 * - Expanded task ids use format: ${baseId}__${dateStr} for recurring occurrences
 * - getBaseTaskId: extracts original task id from expanded id for API updates
 */

import type { Task, RoutineType } from '@/types';

/** separator used in expanded task ids: baseId + __ + dateStr */
export const RECURRENCE_ID_SEPARATOR = '__';

/** max overdue days to expand recurring tasks (avoids hundreds of occurrences for old daily tasks) */
const MAX_OVERDUE_RECURRENCE_DAYS = 14;

/**
 * format date to YYYY-MM-DD for comparison and storage
 */
function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * check if a task occurs on a given date based on routineType
 * dueDate on the task is the "anchor" / first occurrence date
 */
export function taskOccursOnDate(task: Task, dateStr: string): boolean {
  if (!task.dueDate) return false;

  const anchor = new Date(task.dueDate);
  const anchorStr = toDateStr(anchor);
  const target = new Date(dateStr + 'T12:00:00');

  if (task.routineType === 'once') {
    return anchorStr === dateStr;
  }

  // target must be on or after anchor (recurrence starts at anchor date)
  if (anchor > target) return false;

  switch (task.routineType) {
    case 'daily':
      return true; // every day from anchor onward
    case 'weekly':
      return anchor.getDay() === target.getDay();
    case 'monthly':
      return anchor.getDate() === target.getDate();
    case 'yearly':
      return anchor.getMonth() === target.getMonth() && anchor.getDate() === target.getDate();
    default:
      return false;
  }
}

/**
 * get list of dates this recurring task has been completed (from metadata)
 */
export function getRecurrenceCompletionDates(task: Task): string[] {
  const completions = (task.metadata as any)?.recurrence_completions;
  return Array.isArray(completions) ? completions : [];
}

/**
 * check if a specific occurrence of a recurring task is completed
 */
export function isRecurrenceOccurrenceCompleted(task: Task, dateStr: string): boolean {
  return getRecurrenceCompletionDates(task).includes(dateStr);
}

/**
 * check if task is recurring (not one-off)
 */
export function isRecurringTask(task: Task): boolean {
  return task.routineType !== 'once' && !!task.routineType;
}

/**
 * check if task id is an expanded recurring occurrence id
 */
export function isExpandedRecurrenceId(id: string): boolean {
  return id.includes(RECURRENCE_ID_SEPARATOR);
}

/**
 * extract base task id from expanded id (e.g. "abc-123__2026-02-12" -> "abc-123")
 * returns original id if not an expanded id
 */
export function getBaseTaskId(expandedId: string): string {
  const idx = expandedId.indexOf(RECURRENCE_ID_SEPARATOR);
  return idx >= 0 ? expandedId.slice(0, idx) : expandedId;
}

/**
 * extract occurrence date from expanded id (e.g. "abc-123__2026-02-12" -> "2026-02-12")
 * returns null if not an expanded id
 */
export function getOccurrenceDateFromId(expandedId: string): string | null {
  const idx = expandedId.indexOf(RECURRENCE_ID_SEPARATOR);
  return idx >= 0 ? expandedId.slice(idx + RECURRENCE_ID_SEPARATOR.length) : null;
}

/**
 * generate target dates for expansion (today - lookback to today)
 * used for today screen to get overdue + today occurrences
 */
export function getTargetDatesForTodayScreen(): string[] {
  const today = new Date();
  const dates: string[] = [];
  for (let i = MAX_OVERDUE_RECURRENCE_DAYS; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(toDateStr(d));
  }
  return dates;
}

export interface ExpandTasksOptions {
  /** when true, also include one-off tasks with dueDate before min(targetDates) (e.g. old overdue) */
  includeOneOffBeforeRange?: boolean;
}

/**
 * expand tasks for display: one-off tasks pass through; recurring tasks generate
 * virtual occurrences for each target date where they occur.
 * each recurring occurrence gets: id = baseId__dateStr, dueDate = dateStr (with time), isCompleted from recurrence_completions
 */
export function expandTasksForDates(
  tasks: Task[],
  targetDates: string[],
  options?: ExpandTasksOptions
): Task[] {
  const result: Task[] = [];
  const dateSet = new Set(targetDates);
  const minDate = targetDates.length > 0 ? targetDates[0] : '';

  for (const task of tasks) {
    if (task.routineType === 'once' || !task.routineType) {
      // one-off: include if due date in target range, or (if option) before range (old overdue)
      if (!task.dueDate) continue;
      const taskDateStr = toDateStr(new Date(task.dueDate));
      const inRange = dateSet.has(taskDateStr);
      const beforeRange = options?.includeOneOffBeforeRange && taskDateStr < minDate;
      if (inRange || beforeRange) {
        result.push(task);
      }
      continue;
    }

    // recurring: generate one occurrence per matching target date
    for (const dateStr of targetDates) {
      if (!taskOccursOnDate(task, dateStr)) continue;

      const completions = getRecurrenceCompletionDates(task);
      const occurrenceCompleted = completions.includes(dateStr);

      // build effective dueDate: dateStr with task's time if any
      let effectiveDueDate: string;
      if (task.time) {
        const [h, m] = task.time.split(':').map(Number);
        const d = new Date(dateStr + 'T12:00:00');
        d.setHours(h, m ?? 0, 0, 0);
        effectiveDueDate = d.toISOString();
      } else {
        effectiveDueDate = dateStr + 'T12:00:00.000Z'; // noon UTC as default
      }

      const expandedTask: Task = {
        ...task,
        id: `${task.id}${RECURRENCE_ID_SEPARATOR}${dateStr}`,
        dueDate: effectiveDueDate,
        isCompleted: occurrenceCompleted,
        completedAt: occurrenceCompleted ? effectiveDueDate : null,
      };
      result.push(expandedTask);
    }
  }

  return result;
}
