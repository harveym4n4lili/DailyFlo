/**
 * maps ui alert picker ids ↔ django `metadata.reminders` on tasks.
 * reminders are stored on the server; local os notifications read them back when scheduling.
 */

import { withoutEndAlertUnlessDuration } from '@/components/features/tasks/TaskScreen/modals/alertOptions';
import { canTaskHaveAlertReminders } from '@/services/notifications/taskReminderEligibility';
import type { Task, TaskReminder } from '@/types';

/** alert ids from picker → metadata rows for create/update api payloads */
export function mapAlertIdsToTaskReminders(
  alertIds: string[] | undefined | null,
  taskSchedule?: { dueDate?: string | null; time?: string | null },
): TaskReminder[] {
  if (taskSchedule && !canTaskHaveAlertReminders(taskSchedule.dueDate, taskSchedule.time)) {
    return [];
  }
  if (!alertIds?.length) return [];
  return alertIds.map((id) => ({
    id,
    type: 'custom',
    scheduledTime: new Date(),
    isEnabled: true,
  }));
}

/** read saved alert ids from a task for edit forms + alert picker prefill */
export function getAlertIdsFromTask(
  task: Pick<Task, 'metadata' | 'duration'> | null | undefined,
): string[] {
  const reminders = task?.metadata?.reminders;
  if (!Array.isArray(reminders)) return [];
  const ids = reminders
    .filter((r) => r && r.isEnabled !== false && typeof r.id === 'string')
    .map((r) => r.id);
  return withoutEndAlertUnlessDuration(ids, task?.duration);
}

/** pill/chip label count — dateless or all-day drafts show zero even if draft still holds ids */
export function getConfigurableAlertsCount(
  alerts: string[] | undefined | null,
  dueDate?: string | null,
  time?: string | null,
): number {
  if (!canTaskHaveAlertReminders(dueDate, time)) return 0;
  return alerts?.length ?? 0;
}
