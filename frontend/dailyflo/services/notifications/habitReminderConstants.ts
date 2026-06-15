/** expo notification identifier prefix — used for cancel-all on logout */
export const HABIT_REMINDER_NOTIFICATION_ID_PREFIX = 'dailyflo-habit-';

export function buildHabitReminderNotificationId(habitId: string): string {
  return `${HABIT_REMINDER_NOTIFICATION_ID_PREFIX}${habitId}`;
}
