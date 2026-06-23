/**
 * shared pickers for habit create + edit forms.
 */

import { TASK_HABIT_COLOR_OPTIONS } from '@/constants/ColorPalette';
import type { HabitColor, HabitFrequencyType } from '@/types/api/habits';

export const HABIT_FREQUENCIES: { id: HabitFrequencyType; label: string }[] = [
  { id: 'daily', label: 'Every day' },
  { id: 'weekdays', label: 'Weekdays' },
  { id: 'weekends', label: 'Weekends' },
  { id: 'weekly', label: 'Once a week' },
  { id: 'custom', label: 'Custom days' },
  { id: 'times_per_week', label: 'X times per week' },
];

export const HABIT_WEEKDAYS = [
  { value: 0, label: 'Monday' },
  { value: 1, label: 'Tuesday' },
  { value: 2, label: 'Wednesday' },
  { value: 3, label: 'Thursday' },
  { value: 4, label: 'Friday' },
  { value: 5, label: 'Saturday' },
  { value: 6, label: 'Sunday' },
];

/** same order as TASK_HABIT_COLOR_OPTIONS in ColorPalette.ts */
export const HABIT_COLORS: HabitColor[] = [...TASK_HABIT_COLOR_OPTIONS];
