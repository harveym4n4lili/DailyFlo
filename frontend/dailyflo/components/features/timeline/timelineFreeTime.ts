/**
 * copy + helpers for free-time gap rows on `TimelineView` — shared with onboarding preview so break messages stay aligned.
 */

/** short break lines for 30 min–2 h gaps (matches planner rotation) */
export const FREE_TIME_BREAK_MESSAGES = [
  'Take a moment to breathe.',
  'You deserve a little rest.',
  'Enjoy this pocket of calm.',
  'Stretch and unwind a bit.',
  'Step outside for fresh air.',
  'Grab a drink and relax.',
  'Let your mind wander free.',
  'Quick recharge before what\'s next.',
  'Sit back and take it in.',
  'A brief pause does wonders.',
  'Ease into this quiet moment.',
  'Reset before the next task.',
  'Savor this small slice of time.',
  'Unplug for a few minutes.',
  'Allow yourself to slow down.',
  'A short break, well earned.',
  'Breathe deep and feel ease.',
  'Enjoy the empty space.',
  'Nice little pocket of peace.',
  'Pause and appreciate the quiet.',
] as const;

/** "Xh Ym" for long-break banner */
export function formatMinutesToDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}
