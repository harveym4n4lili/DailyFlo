/**
 * default color ids for ColorCirclePicker — matches habit + task color choices.
 */

import type { TaskColor } from '@/types';

/** same order as HABIT_COLORS in habit forms */
export const DEFAULT_COLOR_CIRCLE_PICKER_COLORS: readonly TaskColor[] = [
  'green',
  'blue',
  'teal',
  'purple',
  'orange',
  'yellow',
  'red',
];

/** capitalize color id for accessibility labels (e.g. "green" → "Green") */
export function colorCirclePickerLabel(color: string): string {
  if (!color) return '';
  return color.charAt(0).toUpperCase() + color.slice(1);
}
