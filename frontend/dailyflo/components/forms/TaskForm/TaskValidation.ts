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

// interface for task form values that user can input
// this defines what fields are available in the task creation/editing form
export interface TaskFormValues {
  title: string;                      // task title (required field)
  description?: string;               // optional task description with more details
  icon?: string;                      // optional icon name (e.g., 'briefcase', 'home') to visually identify the task
  time?: string;                      // optional specific time in HH:MM format (e.g., '14:30') for when task should be done
  duration?: number;                  // optional duration in minutes (can be 0, used for time tracking/estimation)
  dueDate?: string;                   // optional due date in ISO string format
  priorityLevel?: PriorityLevel;      // optional priority from 1-5 (3 is default/medium)
  color?: TaskCategoryColorName;      // optional color for visual organization
  routineType?: RoutineType;          // optional routine type (once, daily, weekly, monthly)
  listId?: string;                    // optional list ID to organize task into a list
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

  // validate icon field - basic validation for icon names
  // icon should be a non-empty string if provided
  if (key === 'icon') {
    const v = (value || '').toString();
    if (v.length > 50) return 'icon name must be ≤ 50 chars';
  }

  // validate time field - must be in HH:MM format
  // time is optional but if provided should match HH:MM pattern (e.g., '14:30', '09:00')
  if (key === 'time') {
    const v = value as string | undefined;
    if (v) {
      // regex pattern: HH:MM where HH is 00-23 and MM is 00-59
      const timePattern = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timePattern.test(v)) return 'time must be in HH:MM format (e.g., 14:30)';
    }
  }

  // validate duration field - must be a non-negative number
  // duration represents minutes, so 0 is valid (no duration), can be any positive integer
  if (key === 'duration') {
    const v = value as number | undefined;
    if (v !== undefined) {
      // check if it's a valid number
      if (isNaN(v)) return 'duration must be a number';
      // check if it's non-negative (0 or greater)
      if (v < 0) return 'duration must be 0 or greater';
      // optional: check for reasonable maximum (e.g., 24 hours = 1440 minutes)
      if (v > 1440) return 'duration must be less than 24 hours (1440 minutes)';
    }
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


