/**
 * finds the next recurring (or one-off) occurrence that still has a future local reminder to schedule.
 * recurring tasks in redux keep an anchor dueDate — os notifications always target the next eligible day.
 */

import type { Task } from '@/types';
import {
  isRecurrenceOccurrenceCompleted,
  isRecurringTask,
  taskOccursOnDate,
  toLocalCalendarDayString,
} from '@/utils/recurrenceUtils';

import { getEffectiveAlertIdsForTask, getFireDateForAlert } from './taskReminderAlerts';
import { getTaskLocalStartDate } from './taskReminderDateMath';

/** scan up to one year ahead for yearly routines */
const MAX_OCCURRENCE_SCAN_DAYS = 366;

export type TaskReminderSchedulingTarget = {
  /** same base task id, dueDate shifted to the occurrence calendar day */
  task: Task;
  /** YYYY-MM-DD for recurring deep links; null for one-off tasks */
  occurrenceDate: string | null;
};

function getRecurrenceExceptionDates(task: Task): Set<string> {
  const exceptions = task.metadata?.recurrence_exceptions;
  return new Set(Array.isArray(exceptions) ? exceptions : []);
}

/** build a task copy whose dueDate matches one recurrence calendar day + saved clock time */
function buildOccurrenceTask(base: Task, dateStr: string): Task {
  if (base.time) {
    const [h, m] = base.time.split(':').map(Number);
    const d = new Date(`${dateStr}T12:00:00`);
    d.setHours(h, m ?? 0, 0, 0);
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return { ...base, dueDate: `${y}-${mo}-${day}T${hh}:${mm}:00` };
  }
  return { ...base, dueDate: `${dateStr}T12:00:00` };
}

/** true when at least one saved alert would still fire in the future for this occurrence */
function hasFutureReminderFire(task: Task, nowMs: number): boolean {
  const taskStart = getTaskLocalStartDate(task);
  if (!taskStart) return false;

  const alertIds = getEffectiveAlertIdsForTask(task);
  const durationMinutes = task.duration ?? 0;

  return alertIds.some((alertId) => {
    const fireDate = getFireDateForAlert(alertId, taskStart, durationMinutes);
    return fireDate != null && fireDate.getTime() > nowMs;
  });
}

/**
 * resolve which occurrence to schedule for local reminders — null when nothing upcoming.
 * one-off: returns the base task when its alerts are still in the future.
 */
export function resolveTaskReminderSchedulingTarget(
  baseTask: Task,
  now: Date = new Date(),
): TaskReminderSchedulingTarget | null {
  if (baseTask.softDeleted) return null;
  if (!baseTask.dueDate || !baseTask.time?.trim()) return null;

  const nowMs = now.getTime();

  if (!isRecurringTask(baseTask)) {
    if (baseTask.isCompleted) return null;
    if (!hasFutureReminderFire(baseTask, nowMs)) return null;
    return { task: baseTask, occurrenceDate: null };
  }

  if (baseTask.isCompleted) return null;

  const exceptions = getRecurrenceExceptionDates(baseTask);
  const scanStart = new Date(now);
  scanStart.setHours(0, 0, 0, 0);

  for (let dayOffset = 0; dayOffset <= MAX_OCCURRENCE_SCAN_DAYS; dayOffset += 1) {
    const day = new Date(scanStart);
    day.setDate(scanStart.getDate() + dayOffset);
    const dateStr = toLocalCalendarDayString(day);

    if (exceptions.has(dateStr)) continue;
    if (!taskOccursOnDate(baseTask, dateStr)) continue;
    if (isRecurrenceOccurrenceCompleted(baseTask, dateStr)) continue;

    const occurrenceTask = buildOccurrenceTask(baseTask, dateStr);
    if (hasFutureReminderFire(occurrenceTask, nowMs)) {
      return { task: occurrenceTask, occurrenceDate: dateStr };
    }
  }

  return null;
}
