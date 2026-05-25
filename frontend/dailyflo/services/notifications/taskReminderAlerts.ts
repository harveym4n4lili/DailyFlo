/**
 * resolves which alert options to schedule and when they fire — ties picker ids to os notifications.
 */

import { ALERT_OPTIONS } from '@/components/features/tasks/TaskScreen/modals/alertOptions';
import type { Task } from '@/types';

import { MANDATORY_TASK_REMINDER_ALERT_ID } from './taskReminderConstants';
import { formatTaskReminderBody } from './taskReminderCopy';
import { getReminderFireDate } from './taskReminderDateMath';

/** saved reminders on task — empty means mandatory 15-min default per notification plan */
export function getEffectiveAlertIdsForTask(task: Task): string[] {
  const fromMetadata = (task.metadata?.reminders ?? [])
    .filter((r) => r?.isEnabled !== false && typeof r.id === 'string')
    .map((r) => r.id);

  const known = fromMetadata.filter((id) => ALERT_OPTIONS.some((o) => o.id === id));
  if (known.length === 0) {
    return [MANDATORY_TASK_REMINDER_ALERT_ID];
  }
  return known;
}

/** when each selected alert should fire — null when invalid (e.g. end alert with no duration) */
export function getFireDateForAlert(
  alertId: string,
  taskStart: Date,
  durationMinutes: number,
): Date | null {
  const option = ALERT_OPTIONS.find((o) => o.id === alertId);
  if (!option) return null;

  if (option.value === -1) {
    if (!durationMinutes || durationMinutes <= 0) return null;
    return new Date(taskStart.getTime() + durationMinutes * 60_000);
  }

  if (option.value <= 0) {
    return taskStart;
  }

  return getReminderFireDate(taskStart, option.value);
}

/** banner body copy — start/before-start use mins-until-start; end uses ending copy */
export function formatNotificationBodyForAlert(
  alertId: string,
  taskTitle: string,
  taskStart: Date,
  fireAt: Date,
): string {
  const title = taskTitle.trim() || 'Your task';

  if (alertId === 'end') {
    return `${title} ending now`;
  }

  return formatTaskReminderBody(taskTitle, taskStart, fireAt);
}
