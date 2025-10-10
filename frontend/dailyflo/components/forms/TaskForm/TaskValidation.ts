/**
 * task form validation helpers
 * 
 * this module provides small, composable validators for the task form.
 * keep logic here pure and reusable across native/web.
 */

import { CreateTaskInput, PriorityLevel, RoutineType } from '@/types';
import { TaskCategoryColorName } from '@/constants/ColorPalette';

export type ValidationErrors = Partial<Record<keyof CreateTaskInput | 'title', string>>;

// constants-backed constraints
const TITLE_MIN = 1;
const TITLE_MAX = 120;
const DESCRIPTION_MAX = 1000;

export interface TaskFormValues {
  title: string;
  description?: string;
  dueDate?: string;
  priorityLevel?: PriorityLevel;
  color?: TaskCategoryColorName;
  routineType?: RoutineType;
  listId?: string;
}

/** validate a single field and return error string or undefined */
export function validateField<K extends keyof TaskFormValues>(
  key: K,
  value: TaskFormValues[K]
): string | undefined {
  if (key === 'title') {
    const v = (value || '').toString().trim();
    if (v.length < TITLE_MIN) return 'title is required';
    if (v.length > TITLE_MAX) return `title must be ≤ ${TITLE_MAX} chars`;
  }

  if (key === 'description') {
    const v = (value || '').toString();
    if (v.length > DESCRIPTION_MAX) return `description must be ≤ ${DESCRIPTION_MAX} chars`;
  }

  if (key === 'priorityLevel') {
    const v = value as PriorityLevel | undefined;
    if (v !== undefined && (v < 1 || v > 5)) return 'priority must be between 1 and 5';
  }

  if (key === 'routineType') {
    const allowed: RoutineType[] = ['once', 'daily', 'weekly', 'monthly'];
    if (value && !allowed.includes(value as RoutineType)) return 'invalid routine type';
  }

  if (key === 'color') {
    const allowed: TaskCategoryColorName[] = ['red', 'blue', 'green', 'yellow', 'purple', 'teal', 'orange'];
    if (value && !allowed.includes(value as TaskCategoryColorName)) return 'invalid color';
  }

  if (key === 'dueDate') {
    const v = value as string | undefined;
    if (v && Number.isNaN(Date.parse(v))) return 'invalid date';
  }

  return undefined;
}

/** validate all fields; returns an object with error messages per field */
export function validateAll(values: TaskFormValues): ValidationErrors {
  const errors: ValidationErrors = {};

  (Object.keys(values) as (keyof TaskFormValues)[]).forEach((k) => {
    const err = validateField(k, values[k]);
    if (err) errors[k as keyof CreateTaskInput] = err;
  });

  // enforce requireds
  if (!values.title || values.title.trim().length === 0) {
    errors.title = 'title is required';
  }

  return errors;
}

export default {
  validateField,
  validateAll,
};


