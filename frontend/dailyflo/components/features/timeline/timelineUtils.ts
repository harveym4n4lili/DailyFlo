/**
 * Timeline Utilities
 * 
 * Helper functions for timeline calculations including:
 * - Converting time strings to pixel positions
 * - Generating time slots for labels
 * - Calculating task positions on the timeline
 * - Snapping times to intervals
 */

/**
 * Converts a time string (HH:MM) to minutes from midnight
 * 
 * @param time - Time string in HH:MM format
 * @returns Minutes from midnight (0-1439)
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Converts minutes from midnight to a time string (HH:MM)
 * 
 * @param minutes - Minutes from midnight
 * @returns Time string in HH:MM format
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60) % 24;
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/**
 * Calculates the Y position (in pixels) for a task on the timeline
 * 
 * @param time - Time string in HH:MM format
 * @param startHour - Starting hour of the timeline (e.g., 6 for 6 AM)
 * @param pixelsPerMinute - How many pixels represent one minute (default: 0.5)
 * @returns Y position in pixels from the top
 */
export function calculateTaskPosition(
  time: string,
  startHour: number = 6,
  pixelsPerMinute: number = 0.5
): number {
  const taskMinutes = timeToMinutes(time);
  const startMinutes = startHour * 60;
  const minutesFromStart = taskMinutes - startMinutes;
  
  // if task is before start hour, position at top
  if (minutesFromStart < 0) {
    return 0;
  }
  
  return minutesFromStart * pixelsPerMinute;
}

/**
 * Generates an array of time strings for timeline labels
 * 
 * @param startHour - Starting hour (e.g., 6 for 6 AM)
 * @param endHour - Ending hour (e.g., 23 for 11 PM)
 * @param intervalMinutes - Interval between labels in minutes (default: 60)
 * @returns Array of time strings in HH:MM format
 */
export function generateTimeSlots(
  startHour: number = 6,
  endHour: number = 23,
  intervalMinutes: number = 60
): string[] {
  const slots: string[] = [];
  const startMinutes = startHour * 60;
  const endMinutes = endHour * 60;
  
  // generate time slots at specified intervals
  for (let minutes = startMinutes; minutes <= endMinutes; minutes += intervalMinutes) {
    slots.push(minutesToTime(minutes));
  }
  
  return slots;
}

/**
 * Snaps a time to the nearest interval
 * 
 * @param time - Time string in HH:MM format
 * @param intervalMinutes - Interval to snap to in minutes (default: 15)
 * @returns Snapped time string in HH:MM format
 */
export function snapToNearestTime(time: string, intervalMinutes: number = 15): string {
  const minutes = timeToMinutes(time);
  const snappedMinutes = Math.round(minutes / intervalMinutes) * intervalMinutes;
  return minutesToTime(snappedMinutes);
}

/**
 * Calculates the height (in pixels) for a task based on its duration
 * 
 * @param durationMinutes - Duration in minutes
 * @param pixelsPerMinute - How many pixels represent one minute (default: 0.5)
 * @returns Height in pixels
 */
export function calculateTaskHeight(
  durationMinutes: number,
  pixelsPerMinute: number = 0.5
): number {
  // increased minimum height of 80 pixels for better visibility
  const minHeight = 80;
  const calculatedHeight = durationMinutes * pixelsPerMinute;
  return Math.max(minHeight, calculatedHeight);
}

/**
 * Formats time range for display (e.g., "9:00 AM - 10:30 AM")
 * 
 * @param startTime - Start time in HH:MM format
 * @param durationMinutes - Duration in minutes
 * @returns Formatted time range string
 */
export function formatTimeRange(startTime: string, durationMinutes: number): string {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = startMinutes + durationMinutes;
  const endTime = minutesToTime(endMinutes);
  
  // format times for display (convert 24h to 12h with AM/PM)
  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
  };
  
  if (durationMinutes > 0) {
    return `${formatTime(startTime)} - ${formatTime(endTime)}`;
  }
  
  return formatTime(startTime);
}

/**
 * Converts a Y position (in pixels) back to a time string
 * This is the inverse of calculateTaskPosition
 * 
 * @param yPosition - Y position in pixels from the top
 * @param startHour - Starting hour of the timeline (e.g., 6 for 6 AM)
 * @param pixelsPerMinute - How many pixels represent one minute (default: 0.5)
 * @returns Time string in HH:MM format
 */
export function positionToTime(
  yPosition: number,
  startHour: number = 6,
  pixelsPerMinute: number = 0.5
): string {
  // ensure position is not negative
  const clampedY = Math.max(0, yPosition);
  
  // calculate minutes from start
  const minutesFromStart = clampedY / pixelsPerMinute;
  
  // calculate total minutes from midnight
  const startMinutes = startHour * 60;
  const totalMinutes = startMinutes + minutesFromStart;
  
  // convert to time string
  return minutesToTime(Math.round(totalMinutes));
}

/**
 * Formats a time string for display (e.g., "9:00 AM")
 * 
 * @param time - Time string in HH:MM format
 * @returns Formatted time string with AM/PM
 */
export function formatTimeForDisplay(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
}

