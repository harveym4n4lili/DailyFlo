/**
 * combines task `dueDate` (calendar day) + `time` (HH:MM) into one local start instant.
 * reuses the same hh:mm parsing approach as timeline + task formatters.
 */

import { timeToMinutes } from '@/components/features/timeline/timelineUtils';
import type { Task } from '@/types';
import { normalizeTimeToHHMM } from '@/utils/taskFormatters';

/** local start datetime for a timed task — null when date/time missing or invalid */
export function getTaskLocalStartDate(task: Pick<Task, 'dueDate' | 'time'>): Date | null {
  if (!task.dueDate || !task.time) return null;

  const hhmm = normalizeTimeToHHMM(task.time);
  if (!hhmm) return null;

  const due = new Date(task.dueDate);
  if (Number.isNaN(due.getTime())) return null;

  const minutes = timeToMinutes(hhmm);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  // build from local calendar day — avoids utc-midnight due_date shifting to the wrong day
  const start = new Date(due.getFullYear(), due.getMonth(), due.getDate(), hours, mins, 0, 0);
  return start;
}

/** fire instant = task start minus offset minutes (v1 default 15) */
export function getReminderFireDate(taskStart: Date, offsetMinutes: number): Date {
  return new Date(taskStart.getTime() - offsetMinutes * 60_000);
}
