/**
 * Task Color Utilities
 * 
 * This file contains helper functions for working with task colors,
 * including getting task colors from the color palette system.
 */

import { getTaskCategoryColor } from '@/constants/ColorPalette';
import { TaskColor } from '@/types';

/**
 * Gets the color value for a task using the color palette system
 * Defaults to blue if color is not found in the palette
 * 
 * @param color - Task color name (e.g., 'red', 'blue', 'green')
 * @param shade - Color shade to use (default: 500)
 * @returns Color hex value
 */
export function getTaskColorValue(color: string, shade: keyof ReturnType<typeof getTaskCategoryColor> = 500): string {
  // use the color palette system for consistent task colors
  // default to blue if color is not found in the palette
  try {
    return getTaskCategoryColor(color as TaskColor, shade);
  } catch {
    return getTaskCategoryColor('blue', shade);
  }
}

