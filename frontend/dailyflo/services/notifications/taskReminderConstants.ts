/** v1 mandatory alert — matches `ALERT_OPTIONS` id `15-min` (15 minutes before task start) */
export const MANDATORY_TASK_REMINDER_ALERT_ID = '15-min';

/** minutes before task start for the mandatory v1 reminder */
export const MANDATORY_TASK_REMINDER_OFFSET_MINUTES = 15;

/** pre-selected in alert picker when creating a new task */
export const DEFAULT_NEW_TASK_ALERT_IDS: readonly string[] = [MANDATORY_TASK_REMINDER_ALERT_ID];

/** expo notification identifier prefix — used for cancel-all on logout */
export const TASK_REMINDER_NOTIFICATION_ID_PREFIX = 'dailyflo-task-';

export function buildTaskReminderNotificationId(taskId: string, alertId: string): string {
  return `${TASK_REMINDER_NOTIFICATION_ID_PREFIX}${taskId}-${alertId}`;
}
