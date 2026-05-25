/**
 * notification body copy — "{title} scheduled in {x} mins" per notification plan v1.
 */

/** whole minutes from `from` until `taskStart` (clamped ≥ 0) */
export function minutesUntilTaskStart(taskStart: Date, from: Date): number {
  const diffMs = taskStart.getTime() - from.getTime();
  return Math.max(0, Math.round(diffMs / 60_000));
}

/** body shown on the os notification banner */
export function formatTaskReminderBody(taskTitle: string, taskStart: Date, fireAt: Date): string {
  const title = taskTitle.trim() || 'Your task';
  const mins = minutesUntilTaskStart(taskStart, fireAt);
  if (mins === 0) {
    return `${title} starting now`;
  }
  return `${title} scheduled in ${mins} mins`;
}
