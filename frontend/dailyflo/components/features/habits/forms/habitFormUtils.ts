/**
 * shared habit form helpers — frequency config + reminder time validation for create/edit.
 */

import type { CreateHabitInput, HabitFrequencyType } from '@/types/api/habits';

const HHMM_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

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
