/**
 * shared pickers for habit create + edit forms.
 */

import type { HabitColor, HabitFrequencyType } from '@/types/api/habits';

export const HABIT_FREQUENCIES: { id: HabitFrequencyType; label: string }[] = [
  { id: 'daily', label: 'Every day' },
  { id: 'weekdays', label: 'Weekdays' },
  { id: 'weekends', label: 'Weekends' },
  { id: 'weekly', label: 'Once a week' },
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

export const HABIT_COLORS: HabitColor[] = ['green', 'blue', 'teal', 'purple', 'orange', 'yellow', 'red'];
