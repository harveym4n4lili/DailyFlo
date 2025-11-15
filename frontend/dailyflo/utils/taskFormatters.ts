/**
 * Task Formatting Utilities
 * 
 * This file contains helper functions for formatting task-related data,
 * such as dates, times, and durations. These utilities are extracted
 * from TaskCard to improve reusability and testability.
 */

/**
 * Formats a due date string into a human-readable format
 * Returns "Today", "Tomorrow", "X days ago" for overdue, or formatted date
 * 
 * @param dueDate - ISO date string or null
 * @returns Formatted date string
 */
export function formatDueDate(dueDate: string | null): string {
  if (!dueDate) return 'No due date';
  
  const date = new Date(dueDate);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // set time to start of day for accurate comparison
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  
  // format date based on how close it is
  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow';
  } else if (date < today) {
    // calculate days ago for overdue tasks
    const daysDiff = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    return `${daysDiff} day${daysDiff === 1 ? '' : 's'} ago`;
  } else {
    return date.toLocaleDateString();
  }
}

/**
 * Formats date with time and duration tags
 * Format: "Today • XX:XX • XX min" or variations based on what's available
 * 
 * @param dueDate - ISO date string or null
 * @param time - Optional time string (format: "HH:MM")
 * @param duration - Optional duration in minutes
 * @returns Formatted string with date, time, and duration joined by bullet points
 */
export function formatDateWithTags(
  dueDate: string | null, 
  time?: string, 
  duration?: number
): string {
  const dateText = formatDueDate(dueDate);
  const parts: string[] = [dateText];
  
  // add time if available (format: XX:XX)
  if (time) {
    parts.push(time);
  }
  
  // add duration if available (format: XX min)
  if (duration && duration > 0) {
    parts.push(`${duration} min`);
  }
  
  // join parts with bullet points
  return parts.join(' • ');
}

/**
 * Determines if a date is overdue
 * 
 * @param dueDate - ISO date string or null
 * @returns True if the date is before today, false otherwise
 */
export function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  
  const date = new Date(dueDate);
  const today = new Date();
  
  // set time to start of day for accurate comparison
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  
  return date < today;
}

