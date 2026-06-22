/**
 * shared habit form helpers — frequency config + reminder time validation for create/edit.
 */

import type { CreateHabitInput, HabitFrequencyType, HabitTrackingType } from '@/types/api/habits';
import { HABIT_FREQUENCIES, HABIT_WEEKDAYS } from './habitFormConstants';

/** min/max for the completions-per-day stepper in create/edit forms */
export const MIN_HABIT_COMPLETIONS_PER_DAY = 1;
export const MAX_HABIT_COMPLETIONS_PER_DAY = 99;

/** read stored habit → single completions-per-day number for the form stepper */
export function completionsPerDayFromHabit(
  trackingType: HabitTrackingType,
  targetValue: number | null | undefined,
): number {
  if (trackingType === 'numeric' && targetValue != null && targetValue > 1) {
    return Math.min(MAX_HABIT_COMPLETIONS_PER_DAY, Math.max(MIN_HABIT_COMPLETIONS_PER_DAY, Math.round(targetValue)));
  }
  return MIN_HABIT_COMPLETIONS_PER_DAY;
}

/** map stepper value → django trackingType + targetValue (1 = binary checkbox, 2+ = numeric count) */
export function habitTrackingFromCompletionsPerDay(count: number): {
  trackingType: HabitTrackingType;
  targetValue: number | null;
} {
  const safe = Math.min(
    MAX_HABIT_COMPLETIONS_PER_DAY,
    Math.max(MIN_HABIT_COMPLETIONS_PER_DAY, Math.round(count)),
  );
  if (safe <= 1) {
    return { trackingType: 'binary', targetValue: null };
  }
  return { trackingType: 'numeric', targetValue: safe };
}

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

const WEEKDAY_SHORT_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

/** human-readable schedule copy for habit detail / read-only grouped-list rows */
export function getHabitFrequencyDisplayLabel(
  frequencyType: HabitFrequencyType,
  frequencyConfig?: Record<string, unknown>,
): string {
  const config = frequencyConfig ?? {};
  const preset = HABIT_FREQUENCIES.find((entry) => entry.id === frequencyType);

  if (frequencyType === 'weekly') {
    const days = scheduleDaysFromHabit(frequencyType, config);
    const weekday = HABIT_WEEKDAYS.find((entry) => entry.value === days[0]);
    return weekday ? `Every ${weekday.label}` : (preset?.label ?? 'Once a week');
  }

  if (frequencyType === 'custom') {
    const days = scheduleDaysFromHabit(frequencyType, config);
    if (days.length === 0) return 'Custom days';
    if (days.length === 7) return 'Every day';
    return [...days]
      .sort((a, b) => a - b)
      .map((day) => WEEKDAY_SHORT_LABELS[day])
      .join(', ');
  }

  if (frequencyType === 'times_per_week') {
    const raw = config.targetCount ?? config.target_count ?? 0;
    const count = typeof raw === 'number' ? raw : parseInt(String(raw), 10);
    if (Number.isFinite(count) && count > 0) {
      return `${count} ${count === 1 ? 'time' : 'times'} per week`;
    }
    return preset?.label ?? 'X times per week';
  }

  return preset?.label ?? frequencyType;
}

/** bell pill on habit detail — same copy pattern as task FormDetailSection alertsMainLabel */
export function getHabitAlertPillLabel(reminderTime: string | undefined | null): string {
  const trimmed = (reminderTime ?? '').trim();
  if (!trimmed) return 'No Alerts';
  return '1 Alert';
}
