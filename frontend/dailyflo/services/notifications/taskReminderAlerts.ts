/**
 * resolves which alert options to schedule and when they fire — ties picker ids to os notifications.
 */

import {
  getMinutesBeforeStart,
  isEndAlertId,
  isKnownAlertId,
  withoutEndAlertUnlessDuration,
} from '@/components/features/tasks/TaskScreen/modals/alertOptions';
import type { Task } from '@/types';

import { MANDATORY_TASK_REMINDER_ALERT_ID } from './taskReminderConstants';
import { formatTaskReminderBody } from './taskReminderCopy';
import { getReminderFireDate } from './taskReminderDateMath';

/** saved reminders on task — missing metadata defaults to mandatory 15-min; explicit empty array = no alerts */
export function getEffectiveAlertIdsForTask(task: Task): string[] {
  if (!task.dueDate || !task.time?.trim()) {
    return [];
  }

  const reminders = task.metadata?.reminders;

  if (reminders === undefined || reminders === null) {
    return [MANDATORY_TASK_REMINDER_ALERT_ID];
  }

  if (reminders.length === 0) {
    return [];
  }

  const fromMetadata = reminders
    .filter((r) => r?.isEnabled !== false && typeof r.id === 'string')
    .map((r) => r.id);

  const known = fromMetadata.filter((id) => isKnownAlertId(id));
  const filtered = withoutEndAlertUnlessDuration(known, task.duration);
  return filtered;
}

/** when each selected alert should fire — null when invalid (e.g. end alert with no duration) */
export function getFireDateForAlert(
  alertId: string,
  taskStart: Date,
  durationMinutes: number,
): Date | null {
  if (isEndAlertId(alertId)) {
    if (!durationMinutes || durationMinutes <= 0) return null;
    return new Date(taskStart.getTime() + durationMinutes * 60_000);
  }

  const minutesBefore = getMinutesBeforeStart(alertId);
  if (minutesBefore === null) return null;

  if (minutesBefore <= 0) {
    return taskStart;
  }

  return getReminderFireDate(taskStart, minutesBefore);
}

/** banner body copy — start/before-start use mins-until-start; end uses ending copy */
export function formatNotificationBodyForAlert(
  alertId: string,
  taskTitle: string,
  taskStart: Date,
  fireAt: Date,
): string {
  const title = taskTitle.trim() || 'Your task';

  if (isEndAlertId(alertId)) {
    return `${title} ending now`;
  }

  return formatTaskReminderBody(taskTitle, taskStart, fireAt);
}
