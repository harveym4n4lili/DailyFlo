/**
 * Timeline Utilities
 * 
 * Helper functions for timeline calculations including:
 * - Converting time strings to pixel positions
 * - Generating time slots for labels
 * - Calculating task positions on the timeline
 * - Snapping times to intervals
 * - Drag handling for timeline tasks
 */

import { useState, useCallback, useRef } from 'react';

/**
 * Task Card Height Constants
 * 
 * defines the base heights for different task card types.
 * these values are used by both the timeline spacing logic and the card
 * rendering logic so that visual height and spacing stay in sync.
 */
export const TASK_CARD_HEIGHTS = {
  // base height for tasks without duration
  NO_DURATION: 60,
  
  // base height for tasks with duration
  WITH_DURATION: 60,
} as const;

/**
 * Calculates the appropriate task card height based on duration
 * 
 * @param duration - Task duration in minutes (0 if no duration)
 * @returns Height in pixels for the task card
 */
export function getTaskCardHeight(duration: number): number {
  return duration > 0 ? TASK_CARD_HEIGHTS.WITH_DURATION : TASK_CARD_HEIGHTS.NO_DURATION;
}

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
  
  // format times for display (24-hour format)
  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(':').map(Number);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
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
 * Formats a time string for display (24-hour format, e.g., "09:00")
 * 
 * @param time - Time string in HH:MM format
 * @returns Formatted time string in 24-hour format
 */
export function formatTimeForDisplay(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Position Conversion Utilities
 * 
 * these helpers keep our math clear when we need to work with the card center
 * instead of the top edge. for the drag "aim" behaviour we now anchor times to
 * the top edge of the task card, but these helpers are still useful for spacing.
 */

/**
 * Converts center position to top position
 * Used when rendering tasks - center position is converted to top for absolute positioning
 * 
 * @param centerPosition - Center position of the card in pixels
 * @param cardHeight - Height of the card in pixels
 * @returns Top position of the card in pixels
 */
export function centerToTopPosition(centerPosition: number, cardHeight: number): number {
  return centerPosition - (cardHeight / 2);
}

/**
 * Converts top position to center position
 * Used during drag operations - top position from TimelineItem is converted to center for time calculations
 * 
 * @param topPosition - Top position of the card in pixels
 * @param cardHeight - Height of the card in pixels
 * @returns Center position of the card in pixels
 */
export function topToCenterPosition(topPosition: number, cardHeight: number): number {
  return topPosition + (cardHeight / 2);
}

/**
 * Task Render Properties
 * 
 * Calculates all properties needed to render a task on the timeline.
 * This unifies the calculation logic used across all three states:
 * - After drag and drop
 * - After updating a task
 * - After initially loading
 */

export interface TaskRenderProperties {
  // top position for rendering (absolute positioning)
  position: number;
  // center position (used for calculations)
  centerPosition: number;
  // height to use for spacing calculations (always fallback)
  spacingHeight: number;
  // actual measured height (for rendering and drag)
  measuredHeight: number;
  // pixels per minute for this task
  pixelsPerMinute: number;
}

/**
 * Calculates render properties for a task
 * This function centralizes the position calculation logic used in all states
 * 
 * @param taskId - ID of the task
 * @param equalSpacingPosition - Center position from equal spacing calculations
 * @param spacingHeight - Fallback height used for spacing (always 56px)
 * @param measuredHeight - Actual measured height of the card (or fallback if not measured)
 * @param taskPixelsPerMinute - Pixels per minute for this task
 * @returns TaskRenderProperties object with all render properties
 */
export function calculateTaskRenderProperties(
  taskId: string,
  equalSpacingPosition: number,
  spacingHeight: number,
  measuredHeight: number,
  taskPixelsPerMinute: number
): TaskRenderProperties {
  // convert center position to top position for rendering
  // this is the same calculation used in all three states
  const position = centerToTopPosition(equalSpacingPosition, spacingHeight);
  
  return {
    position,
    centerPosition: equalSpacingPosition,
    spacingHeight,
    measuredHeight,
    pixelsPerMinute: taskPixelsPerMinute,
  };
}

/**
 * Timeline Drag Hook
 * 
 * Handles drag operations for timeline tasks.
 * Provides unified drag handling logic that works across all states:
 * - During drag: shows visual feedback and converts positions
 * - After drag: updates task time and triggers recalculation
 * 
 * This hook modularizes the drag-specific logic that was previously
 * duplicated in TimelineView.
 */

export interface DragState {
  taskId: string; // track which task is being dragged for z-index management
  yPosition: number; // current Y position of the drag (where the overlay should be)
  time: string; // calculated time at the current drag position
  task: Task; // the task object being dragged (needed for overlay rendering)
  cardHeight: number; // height of the task card (needed for overlay sizing)
  cardWidth?: number; // width of the task card (optional, can be calculated from container)
}

export interface UseTimelineDragOptions {
  // function to convert a card's TOP Y position to a time string
  // this keeps the "aim" anchored to the top edge of the task card
  positionToTime: (topY: number) => string;
  // callback when drag ends and task time should be updated
  onTaskTimeChange?: (taskId: string, newTime: string) => void;
}

export interface UseTimelineDragReturn {
  // current drag state (null when not dragging)
  dragState: DragState | null;
  // handler for drag start (with initial position and task info)
  handleDragStart: (taskId: string, topY: number, measuredHeight: number, task: Task) => void;
  // handler for drag position change (during drag)
  handleDragPositionChange: (taskId: string, topY: number, measuredHeight: number) => void;
  // handler for drag end
  handleDragEnd: (taskId: string, topY: number, measuredHeight: number) => void;
}

/**
 * Hook for handling timeline drag operations
 * 
 * Provides unified drag handling that:
 * - Shows visual feedback during drag (drag label)
 * - Converts top position to center position using measured height
 * - Converts center position to time for display and updates
 * - Clears drag state when drag ends
 * 
 * @param options - Configuration options for drag handling
 * @returns Drag state and handlers
 */
export function useTimelineDrag({
  positionToTime,
  onTaskTimeChange,
}: UseTimelineDragOptions): UseTimelineDragReturn {
  // track drag state for showing time label during drag
  const [dragState, setDragState] = useState<DragState | null>(null);
  // keep an immediate ref of the latest drag state so drag end can use the exact time
  // this avoids any tiny re-calculation differences between the aim label and saved time
  const dragStateRef = useRef<DragState | null>(null);

  // handle drag start - initialize drag state with initial position and task info
  // sets initial drag state so drag label and overlay appear immediately
  // also tracks which task is being dragged for z-index management
  const handleDragStart = useCallback(
    (taskId: string, topY: number, measuredHeight: number, task: Task) => {
      // for drag "aim" we anchor the time to the TOP edge of the task card
      // so moving one card's top to another card's top gives the same time
      const time = positionToTime(topY);
      
      // set initial drag state for visual feedback and overlay rendering
      // include task object and card height so overlay can render correctly
      const nextState: DragState = { 
        taskId, 
        yPosition: topY, 
        time,
        task,
        cardHeight: measuredHeight,
      };
      dragStateRef.current = nextState;
      setDragState(nextState);
    },
    [positionToTime]
  );

  // handle drag position change - update visual feedback
  // converts top position to center position using measured height
  // then converts center position to time for display
  const handleDragPositionChange = useCallback(
    (taskId: string, topY: number, measuredHeight: number) => {
      // during drag we keep using the TOP edge as the anchor for time
      // this keeps the aim label stuck to the top of the card
      const time = positionToTime(topY);
      
      // update drag state for visual feedback
      // preserve taskId, task, and cardHeight from current drag state or use the ones passed in
      const currentTaskId = dragStateRef.current?.taskId || taskId;
      const currentTask = dragStateRef.current?.task;
      const currentCardHeight = dragStateRef.current?.cardHeight || measuredHeight;
      
      // ensure we have a task object - if not, we can't render the overlay
      if (!currentTask) {
        console.warn('Drag position change called but no task in drag state');
        return;
      }
      
      const nextState: DragState = { 
        taskId: currentTaskId, 
        yPosition: topY, 
        time,
        task: currentTask, // preserve task object from drag start
        cardHeight: currentCardHeight, // preserve card height from drag start
      };
      dragStateRef.current = nextState;
      setDragState(nextState);
    },
    [positionToTime]
  );

  // handle drag end - update task time and clear drag state
  // converts top position to center position, then to time, then updates task
  const handleDragEnd = useCallback(
    (taskId: string, topY: number, measuredHeight: number) => {
      // prefer the last computed drag state time so saved time matches the aim label exactly
      // this ensures the user sees the same time during drag and after release
      let newTime: string;
      if (dragStateRef.current) {
        newTime = dragStateRef.current.time;
      } else {
        // fallback: convert from the TOP edge position if we have no drag state
        newTime = positionToTime(topY);
      }
      
      // update task time via callback
      onTaskTimeChange?.(taskId, newTime);
      
      // clear drag state
      setDragState(null);
      dragStateRef.current = null;
    },
    [positionToTime, onTaskTimeChange]
  );

  return {
    dragState,
    handleDragStart,
    handleDragPositionChange,
    handleDragEnd,
  };
}

