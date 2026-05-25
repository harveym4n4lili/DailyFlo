/**
 * maps ui alert picker ids ↔ django `metadata.reminders` on tasks.
 * reminders are stored on the server; local os notifications read them back when scheduling.
 */

import type { Task, TaskReminder } from '@/types';

/** alert ids from picker → metadata rows for create/update api payloads */
export function mapAlertIdsToTaskReminders(alertIds: string[] | undefined | null): TaskReminder[] {
  if (!alertIds?.length) return [];
  return alertIds.map((id) => ({
    id,
    type: 'custom',
    scheduledTime: new Date(),
    isEnabled: true,
  }));
}

/** read saved alert ids from a task for edit forms + alert picker prefill */
export function getAlertIdsFromTask(task: Pick<Task, 'metadata'> | null | undefined): string[] {
  const reminders = task?.metadata?.reminders;
  if (!Array.isArray(reminders)) return [];
  return reminders
    .filter((r) => r && r.isEnabled !== false && typeof r.id === 'string')
    .map((r) => r.id);
}
