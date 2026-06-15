/** notification body copy for habit local reminders */
export function formatHabitReminderBody(habitTitle: string): string {
  const title = habitTitle.trim() || 'your habit';
  return `${title} — time for your habit`;
}
