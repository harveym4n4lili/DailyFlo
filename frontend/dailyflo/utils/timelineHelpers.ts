/**
 * Timeline Helpers
 * 
 * Utility functions for timeline-specific operations, including task sorting,
 * time formatting, and time range calculations for the planner timeline view.
 */

import { Task } from '@/types';

/**
 * Calculates the time difference in minutes between two tasks
 * 
 * @param task1 - First task (earlier task)
 * @param task2 - Second task (later task)
 * @returns Time difference in minutes, or null if either task doesn't have a time
 */
export function calculateTimeDifference(task1: Task, task2: Task): number | null {
  // both tasks need to have a time field
  if (!task1.time || !task2.time) return null;
  
  // parse times (HH:MM format)
  const [hours1, minutes1] = task1.time.split(':').map(Number);
  const [hours2, minutes2] = task2.time.split(':').map(Number);
  
  // create date objects with the times (using today's date as base)
  const date1 = new Date();
  date1.setHours(hours1, minutes1, 0, 0);
  
  const date2 = new Date();
  date2.setHours(hours2, minutes2, 0, 0);
  
  // calculate difference in minutes
  const diffMs = date2.getTime() - date1.getTime();
  const diffMinutes = Math.round(diffMs / (1000 * 60));
  
  return diffMinutes;
}

/**
 * Filters tasks that have a time field
 * 
 * @param tasks - Array of tasks to filter
 * @returns Array of tasks with time field
 */
export function getTasksWithTime(tasks: Task[]): Task[] {
  // filter tasks that have a time value (not null, undefined, or empty string)
  return tasks.filter(task => task.time && task.time.trim() !== '');
}

/**
 * Filters tasks that don't have a time field
 * 
 * @param tasks - Array of tasks to filter
 * @returns Array of tasks without time field
 */
export function getTasksWithoutTime(tasks: Task[]): Task[] {
  // filter tasks that don't have a time value (null, undefined, or empty string)
  return tasks.filter(task => !task.time || task.time.trim() === '');
}

/**
 * Formats a time string (HH:MM format) to 12-hour format with AM/PM
 * 
 * @param time - Time string in HH:MM format (e.g., "14:30")
 * @returns Formatted time string (e.g., "2:30 PM")
 */
export function formatTimeForDisplay(time: string): string {
  if (!time) return '';
  
  // parse time string (HH:MM format)
  const [hours, minutes] = time.split(':').map(Number);
  
  // determine if it's AM or PM
  const period = hours >= 12 ? 'PM' : 'AM';
  // convert to 12-hour format
  const displayHours = hours % 12 || 12;
  
  // format with minutes (always 2 digits)
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Calculates the end time from a start time and duration
 * 
 * @param time - Start time string in HH:MM format (e.g., "08:45")
 * @param duration - Duration in minutes
 * @returns End time string in HH:MM format (e.g., "09:15")
 */
export function calculateEndTime(time: string, duration: number): string {
  if (!time || duration <= 0) return '';
  
  // parse start time (HH:MM format)
  const [hours, minutes] = time.split(':').map(Number);
  
  // create date object with the time (using today's date as base)
  const startDate = new Date();
  startDate.setHours(hours, minutes, 0, 0);
  
  // add duration in minutes
  const endDate = new Date(startDate.getTime() + duration * 60 * 1000);
  
  // format end time as HH:MM
  const endHours = endDate.getHours();
  const endMinutes = endDate.getMinutes();
  
  return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
}

/**
 * Formats a time range string (e.g., "8:45 - 9:15 AM")
 * 
 * @param time - Start time string in HH:MM format
 * @param duration - Duration in minutes
 * @returns Formatted time range string (e.g., "8:45 - 9:15 AM")
 */
export function formatTimeRange(time: string, duration: number): string {
  if (!time) return '';
  
  // format start time
  const startTime = formatTimeForDisplay(time);
  
  // if no duration, just return start time
  if (!duration || duration <= 0) {
    return startTime;
  }
  
  // calculate and format end time
  const endTime = calculateEndTime(time, duration);
  const formattedEndTime = formatTimeForDisplay(endTime);
  
  // return time range (e.g., "8:45 - 9:15 AM")
  return `${startTime} - ${formattedEndTime}`;
}

/**
 * Sorts tasks for timeline display:
 * - Tasks with time first, sorted by time ascending
 * - Tasks without time second, sorted by dueDate ascending
 * 
 * @param tasks - Array of tasks to sort
 * @returns Sorted array of tasks for timeline display
 */
export function sortTasksForTimeline(tasks: Task[]): Task[] {
  // split tasks into two groups: with time and without time
  const tasksWithTime = getTasksWithTime(tasks);
  const tasksWithoutTime = getTasksWithoutTime(tasks);
  
  // sort tasks with time by time field (ascending - earlier times first)
  const sortedTasksWithTime = [...tasksWithTime].sort((a, b) => {
    // compare time strings (HH:MM format sorts correctly as strings)
    if (a.time && b.time) {
      return a.time.localeCompare(b.time);
    }
    return 0;
  });
  
  // sort tasks without time by dueDate (ascending - earlier dates first)
  const sortedTasksWithoutTime = [...tasksWithoutTime].sort((a, b) => {
    // handle null/undefined dueDate cases
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1; // tasks without dueDate go to end
    if (!b.dueDate) return -1; // tasks without dueDate go to end
    
    // compare dates (earlier dates first)
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });
  
  // combine: tasks with time first, then tasks without time
  return [...sortedTasksWithTime, ...sortedTasksWithoutTime];
}

/**
 * Gets the task height based on duration
 * 
 * @param duration - Duration in minutes
 * @returns Height in pixels
 * - Duration < 30 min: 80px (short)
 * - Duration >= 30 min and < 1 hr: 120px (medium)
 * - Duration >= 1 hr: 160px (tall)
 */
export function getTaskHeightForDuration(duration: number): number {
  if (!duration || duration <= 0) {
    return 80; // default short height for tasks without duration
  }
  
  if (duration < 30) {
    return 80; // short height for < 30 min
  } else if (duration < 60) {
    return 120; // medium height for >= 30 min and < 1 hr
  } else {
    return 160; // tall height for >= 1 hr
  }
}

/**
 * Gets the separator height based on time difference between tasks
 * 
 * @param timeDiffMinutes - Time difference in minutes, or null if tasks don't have times
 * @returns Height in pixels
 * - Time difference < 30 min: 24px (short)
 * - Time difference >= 30 min and < 1 hr: 48px (medium)
 * - Time difference >= 1 hr: 72px (tall)
 */
export function getSeparatorHeightForTimeDifference(timeDiffMinutes: number | null): number {
  if (timeDiffMinutes === null || timeDiffMinutes <= 0) {
    return 24; // default short height
  }
  
  if (timeDiffMinutes < 30) {
    return 24; // short height for < 30 min
  } else if (timeDiffMinutes < 60) {
    return 48; // medium height for >= 30 min and < 1 hr
  } else {
    return 72; // tall height for >= 1 hr
  }
}

