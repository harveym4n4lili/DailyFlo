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
  // format time to HH:MM (remove seconds if present, e.g., "09:00:00" -> "09:00")
  if (time) {
    // if time includes seconds (HH:MM:SS format), remove them to show only HH:MM
    const formattedTime = time.includes(':') && time.split(':').length === 3
      ? time.substring(0, 5) // take first 5 characters (HH:MM)
      : time; // already in HH:MM format, use as-is
    parts.push(formattedTime);
  }
  
  // add duration if available (format: XX min)
  if (duration && duration > 0) {
    parts.push(`${duration} min`);
  }
  
  // join parts with bullet points
  return parts.join(' • ');
}

/**
 * Formats time and duration as a time range: "09:00 - 09:30"
 * Calculates end time from start time + duration.
 * 
 * @param time - Start time string (format: "HH:MM" or "HH:MM:SS")
 * @param duration - Duration in minutes
 * @returns Formatted string like "09:00 - 09:30", or just "09:00" if no duration
 */
export function formatTimeRange(time: string | null | undefined, duration?: number): string {
  if (!time) {
    // no start time: if we have duration only, show "XX min" as fallback
    if (duration && duration > 0) {
      return `${duration} min`;
    }
    return '';
  }
  // format time to HH:MM (remove seconds if present)
  const startTime = time.includes(':') && time.split(':').length === 3
    ? time.substring(0, 5)
    : time.length >= 5 ? time.substring(0, 5) : time;
  
  // if no duration, return just the start time
  if (!duration || duration <= 0) {
    return startTime;
  }
  
  // parse start time: "09:00" -> hours=9, minutes=0
  const [hoursStr, minutesStr] = startTime.split(':');
  let hours = parseInt(hoursStr || '0', 10);
  let minutes = parseInt(minutesStr || '0', 10);
  
  // add duration to get end time
  minutes += duration;
  hours += Math.floor(minutes / 60);
  minutes = minutes % 60;
  hours = hours % 24; // wrap around if past midnight
  
  const endTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  return `${startTime} - ${endTime}`;
}

/**
 * Formats metadata for today screen: time range only, no date.
 * Uses "09:00 - 09:30" format instead of "09:00 • 30 min".
 * For overdue tasks, still shows the date (e.g. "2 days ago • 09:00 - 09:30").
 * 
 * @param dueDate - ISO date string or null
 * @param time - Optional time string (format: "HH:MM")
 * @param duration - Optional duration in minutes
 * @returns Formatted string - time range only when due today, date + time range for overdue
 */
export function formatMetadataForToday(
  dueDate: string | null,
  time?: string,
  duration?: number
): string {
  const timeRange = formatTimeRange(time, duration);
  const dateText = formatDueDate(dueDate);
  
  // if due today, show only time range (no "Today" prefix)
  const today = new Date();
  const date = dueDate ? new Date(dueDate) : null;
  today.setHours(0, 0, 0, 0);
  if (date) {
    date.setHours(0, 0, 0, 0);
    if (date.toDateString() === today.toDateString()) {
      return timeRange; // today: just "09:00 - 09:30"
    }
  }
  
  // overdue or other: show date + time range
  const parts = [dateText];
  if (timeRange) parts.push(timeRange);
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

