/**
 * shared habit form helpers — frequency config + reminder time validation for create/edit.
 */

import type { CreateHabitInput, HabitFrequencyType } from '@/types/api/habits';

const HHMM_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** mon=0 … sun=6 — matches WeekdayCirclePicker and django habit_schedule */
const ALL_WEEKDAYS = [0, 1, 2, 3, 4, 5, 6] as const;
const WEEKDAY_ONLY = [0, 1, 2, 3, 4] as const;
const WEEKEND_ONLY = [5, 6] as const;

/** default create form to every day so the habit is due today and shows in the list right away */
export function getDefaultScheduleDays(): number[] {
  return [...ALL_WEEKDAYS];
}

function sortedDayKey(days: number[]): string {
  return [...days].sort((a, b) => a - b).join(',');
}

/** map circle-picker selection → django frequencyType + config fields for buildHabitFrequencyConfig */
export function deriveFrequencyFromScheduleDays(days: number[]): {
  frequencyType: HabitFrequencyType;
  dayOfWeek: number;
  customDays: number[];
} {
  const sorted = [...days].sort((a, b) => a - b);
  const key = sortedDayKey(sorted);

  if (sorted.length === 0) {
    return { frequencyType: 'custom', dayOfWeek: 0, customDays: [] };
  }
  if (key === sortedDayKey([...ALL_WEEKDAYS])) {
    return { frequencyType: 'daily', dayOfWeek: 0, customDays: sorted };
  }
  if (key === sortedDayKey([...WEEKDAY_ONLY])) {
    return { frequencyType: 'weekdays', dayOfWeek: 0, customDays: sorted };
  }
  if (key === sortedDayKey([...WEEKEND_ONLY])) {
    return { frequencyType: 'weekends', dayOfWeek: 0, customDays: sorted };
  }
  if (sorted.length === 1) {
    return { frequencyType: 'weekly', dayOfWeek: sorted[0], customDays: sorted };
  }
  return { frequencyType: 'custom', dayOfWeek: sorted[0], customDays: sorted };
}

/** hydrate circle-picker from stored habit — times_per_week falls back to all days until user picks a fixed pattern */
export function scheduleDaysFromHabit(
  frequencyType: HabitFrequencyType,
  config: Record<string, unknown> | undefined,
): number[] {
  if (frequencyType === 'daily') return [...ALL_WEEKDAYS];
  if (frequencyType === 'weekdays') return [...WEEKDAY_ONLY];
  if (frequencyType === 'weekends') return [...WEEKEND_ONLY];
  if (frequencyType === 'weekly') {
    const raw = config?.dayOfWeek ?? config?.day_of_week ?? 0;
    const day = typeof raw === 'number' ? raw : parseInt(String(raw), 10);
    return Number.isFinite(day) && day >= 0 && day <= 6 ? [day] : [0];
  }
  if (frequencyType === 'custom') {
    const days = readCustomDaysFromConfig(config);
    return days.length > 0 ? days : [...ALL_WEEKDAYS];
  }
  return [...ALL_WEEKDAYS];
}

/** normalize user-typed reminder to HH:MM or empty when disabled */
export function normalizeHabitReminderTime(enabled: boolean, raw: string): string {
  if (!enabled) return '';
  const trimmed = raw.trim();
  if (!trimmed) return '09:00';
  if (HHMM_RE.test(trimmed)) return trimmed;
  return '';
}

export function isValidHabitReminderTime(value: string): boolean {
  return HHMM_RE.test(value.trim());
}

/** build frequencyConfig from form state before POST/PATCH */
export function buildHabitFrequencyConfig(
  frequencyType: HabitFrequencyType,
  dayOfWeek: number,
  timesPerWeek: string,
  customDays: number[],
): CreateHabitInput['frequencyConfig'] {
  if (frequencyType === 'weekly') {
    return { dayOfWeek };
  }
  if (frequencyType === 'times_per_week') {
    return { targetCount: parseInt(timesPerWeek, 10) };
  }
  if (frequencyType === 'custom') {
    return { days: [...customDays].sort((a, b) => a - b) };
  }
  return {};
}

/** read custom days from stored habit config (supports snake or camel keys) */
export function readCustomDaysFromConfig(config: Record<string, unknown> | undefined): number[] {
  const raw = config?.days;
  if (!Array.isArray(raw)) return [];
  return raw.filter((d): d is number => typeof d === 'number' && d >= 0 && d <= 6);
}
