/**
 * weekday indices + short labels for WeekdayCirclePicker — 0 = Monday … 6 = Sunday (matches habit API).
 */

export const WEEKDAY_VALUES_MON_FIRST = [0, 1, 2, 3, 4, 5, 6] as const;

/** single-letter labels in Mon→Sun order (T twice for Tue/Thu, S twice for Sat/Sun) */
export const WEEKDAY_SHORT_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;

export const WEEKDAY_FULL_LABELS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

export type WeekdayValue = (typeof WEEKDAY_VALUES_MON_FIRST)[number];
