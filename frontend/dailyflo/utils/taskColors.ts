/**
 * Task & Habit Color Utilities
 * 
 * Helper functions for resolving user-selected task/habit accent colors
 * from the palette section in ColorPalette.ts (4 shades per color).
 */

import { getTaskHabitColor, TASK_HABIT_COLOR_OPTIONS, type TaskHabitColorName, type TaskHabitColorShade } from '@/constants/ColorPalette';
import { TaskColor } from '@/types';

/**
 * Gets the hex for a task or habit color id.
 * Defaults to shade 500 (picker swatch) and blue if the id is unknown.
 */
export function getTaskColorValue(
  color: string,
  shade: TaskHabitColorShade = 500,
): string {
  // resolve through palette helper — unknown ids fall back to blue
  if ((TASK_HABIT_COLOR_OPTIONS as readonly string[]).includes(color)) {
    return getTaskHabitColor(color as TaskHabitColorName, shade);
  }
  return getTaskHabitColor('blue', shade);
}

/** habit card / list title — task & habit palette shade 100 */
export function getTaskHabitTitleColor(color: string): string {
  return getTaskColorValue(color, 100);
}

