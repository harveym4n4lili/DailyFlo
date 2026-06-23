/**
 * default color ids for ColorCirclePicker — matches TASK_HABIT_COLOR_OPTIONS in ColorPalette.ts.
 */

import { TASK_HABIT_COLOR_OPTIONS } from '@/constants/ColorPalette';
import type { TaskColor } from '@/types';

export const DEFAULT_COLOR_CIRCLE_PICKER_COLORS: readonly TaskColor[] = TASK_HABIT_COLOR_OPTIONS;

/** capitalize color id for accessibility labels (e.g. "green" → "Green") */
export function colorCirclePickerLabel(color: string): string {
  if (!color) return '';
  return color.charAt(0).toUpperCase() + color.slice(1);
}
