/**
 * TimelineView Component
 * 
 * Displays tasks in a timeline format with time labels on the left side.
 * Tasks are positioned at their scheduled times and can be dragged to change times.
 * Shows connecting lines between tasks and displays icons in circular containers.
 * 
 * This component is used by the Planner screen to show tasks in a timeline view.
 */

import React, { useMemo, useState, useCallback, useRef } from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { Task } from '@/types';
import TimelineItem from './TimelineItem';
import TimeLabel from './TimeLabel';
import { calculateTaskPosition, generateTimeSlots, snapToNearestTime, timeToMinutes, minutesToTime, calculateTaskHeight } from './timelineUtils';

interface TimelineViewProps {
  // array of tasks to display on the timeline
  tasks: Task[];
  // callback when a task's time is changed via dragging
  onTaskTimeChange?: (taskId: string, newTime: string, newDuration?: number) => void;
  // callback when a task is pressed
  onTaskPress?: (task: Task) => void;
  // start hour for the timeline (default: 6 AM)
  startHour?: number;
  // end hour for the timeline (default: 23 = 11 PM)
  endHour?: number;
  // interval between time labels in minutes (default: 60)
  timeInterval?: number;
}

/**
 * TimelineView Component
 * 
 * Renders a vertical timeline with time labels on the left and tasks positioned
 * at their scheduled times. Tasks can be dragged to change their time.
 */
export default function TimelineView({
  tasks,
  onTaskTimeChange,
  onTaskPress,
  startHour = 6,
  endHour = 23,
  timeInterval = 60,
}: TimelineViewProps) {
  const themeColors = useThemeColors();
  const typography = useTypography();

  // track drag state for showing time label on left timeline
  const [dragState, setDragState] = useState<{
    yPosition: number;
    time: string;
  } | null>(null);

  // track actual card heights measured from TimelineItem components
  const [taskCardHeights, setTaskCardHeights] = useState<Map<string, number>>(new Map());
  

  // format drag time for display (24-hour format)
  const formatDragTime = useCallback((time: string): string => {
    const [hours, minutes] = time.split(':').map(Number);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }, []);

  // create dynamic styles using theme colors and typography
  const styles = useMemo(() => createStyles(themeColors, typography), [themeColors, typography]);

  // filter tasks that have a time set (required for timeline positioning)
  // tasks without time won't appear on the timeline
  const tasksWithTime = useMemo(() => {
    return tasks.filter(task => task.time && task.dueDate);
  }, [tasks]);

  // calculate dynamic start time - use earliest task time or fallback to startHour
  // round down to the hour and subtract 1 hour for buffer to allow scrolling up
  const dynamicStartHour = useMemo(() => {
    if (tasksWithTime.length === 0) return startHour;
    
    const earliestTask = tasksWithTime.reduce((earliest, task) => {
      if (!task.time) return earliest;
      if (!earliest) return task;
      
      const taskMinutes = timeToMinutes(task.time);
      const earliestMinutes = timeToMinutes(earliest.time!);
      
      return taskMinutes < earliestMinutes ? task : earliest;
    }, null as Task | null);
    
    if (!earliestTask?.time) return startHour;
    
    // get the hour of the earliest task, rounding down to the hour
    const earliestMinutes = timeToMinutes(earliestTask.time);
    const earliestHour = Math.floor(earliestMinutes / 60);
    // subtract 1 hour for buffer to allow scrolling up to see earlier times
    return Math.max(0, earliestHour - 1);
  }, [tasksWithTime, startHour]);

  // generate time slots for the timeline (e.g., 6:00, 7:00, 8:00, etc.)
  // these are used to display time labels on the left side
  // use dynamic start hour once tasks are loaded, otherwise use default startHour
  const timeSlots = useMemo(() => {
    // calculate effective end hour based on latest task or default endHour
    let effectiveEndHour = endHour;
    if (tasksWithTime.length > 0) {
      const latestTask = tasksWithTime.reduce((latest, task) => {
        if (!task.time) return latest;
        if (!latest) return task;
        
        const taskMinutes = timeToMinutes(task.time);
        const latestMinutes = timeToMinutes(latest.time!);
        
        const taskEndMinutes = taskMinutes + (task.duration || 0);
        const latestEndMinutes = latestMinutes + (latest.duration || 0);
        
        return taskEndMinutes > latestEndMinutes ? task : latest;
      }, null as Task | null);
      
      if (latestTask?.time) {
        const latestMinutes = timeToMinutes(latestTask.time);
        const latestEndMinutes = latestMinutes + (latestTask.duration || 0);
        const latestHour = Math.ceil(latestEndMinutes / 60);
        effectiveEndHour = Math.max(latestHour + 1, endHour); // add 1 hour buffer
      }
    }
    
    const effectiveStartHour = tasksWithTime.length > 0 ? dynamicStartHour : startHour;
    return generateTimeSlots(effectiveStartHour, effectiveEndHour, timeInterval);
  }, [dynamicStartHour, startHour, endHour, timeInterval, tasksWithTime]);

  // spacing constants - adjust these values to change spacing between tasks
  const SPACING_LESS_THAN_30_MIN = 25; // spacing for time differences less than 30 minutes
  const SPACING_30_MIN_TO_1_HOUR = 75; // spacing for time differences between 30 minutes and 1 hour
  const SPACING_MORE_THAN_1_HOUR = 75; // spacing for time differences more than 1 hour
  
  // time thresholds for spacing (in minutes)
  const THRESHOLD_30_MINUTES = 30; // threshold for less than 30 minutes spacing
  const THRESHOLD_1_HOUR = 60; // threshold for 30 minutes to 1 hour spacing
  
  // dynamic spacing between tasks based on time difference
  const getTaskSpacing = (timeDifferenceMinutes: number): number => {
    if (timeDifferenceMinutes < THRESHOLD_30_MINUTES) {
      return SPACING_LESS_THAN_30_MIN;
    } else if (timeDifferenceMinutes <= THRESHOLD_1_HOUR) {
      return SPACING_30_MIN_TO_1_HOUR;
    } else {
      return SPACING_MORE_THAN_1_HOUR;
    }
  };

  // sort tasks by time to calculate equal spacing positions
  const sortedTasks = useMemo(() => {
    return [...tasksWithTime].sort((a, b) => {
      if (!a.time || !b.time) return 0;
      return timeToMinutes(a.time) - timeToMinutes(b.time);
    });
  }, [tasksWithTime]);

  // calculate equal spacing positions for tasks with dynamic spacing based on time differences
  // returns a map of taskId -> { equalSpacingPosition, cardHeight }
  const equalSpacingPositions = useMemo(() => {
    const positions = new Map<string, { equalSpacingPosition: number; cardHeight: number }>();
    
    if (sortedTasks.length === 0) return positions;
    
    // start position for first task
    let currentPosition = 0;
    
    sortedTasks.forEach((task, index) => {
      if (!task.time) return;
      
      const duration = task.duration || 0;
      // cardHeight: height of the task card
      // for tasks with duration: this is the visual height of the task card
      // for tasks without duration: this is just the card's content height
      const measuredHeight = taskCardHeights.get(task.id);
      const fallbackHeight = 56; // same fallback height for all tasks (with or without duration)
      const cardHeight = measuredHeight || fallbackHeight;
      
      // check if tasks overlap in time
      // if overlapping, use time-based positioning (natural positioning)
      // if not overlapping, use spacing constants
      let isOverlapping = false;
      let gapSpacing = 200; // default gap spacing between tasks
      if (index < sortedTasks.length - 1) {
        const nextTask = sortedTasks[index + 1];
        if (nextTask.time) {
          const taskMinutes = timeToMinutes(task.time);
          const taskEndMinutes = taskMinutes + duration;
          const nextTaskMinutes = timeToMinutes(nextTask.time);
          const nextTaskDuration = nextTask.duration || 0;
          const nextTaskEndMinutes = nextTaskMinutes + nextTaskDuration;
          
          // check if tasks overlap in time
          isOverlapping = taskEndMinutes > nextTaskMinutes || 
            taskMinutes === nextTaskMinutes ||
            taskMinutes === nextTaskEndMinutes ||
            nextTaskMinutes === taskEndMinutes;
          
          if (!isOverlapping) {
            // tasks don't overlap - use spacing constants
            const timeDifference = nextTaskMinutes - taskEndMinutes;
            gapSpacing = getTaskSpacing(timeDifference);
          }
          // if overlapping, gapSpacing stays 0 (will use time-based positioning)
        }
      }
      
      // calculate task position - ALWAYS use CENTER position for all tasks
      // equalSpacingPosition is always the CENTER of the card (for both duration and no duration)
      // this ensures labels can be positioned at the center
      const taskPosition = currentPosition; // currentPosition is always the center
      
      positions.set(task.id, { equalSpacingPosition: taskPosition, cardHeight });
      
      // calculate next task's position
      // if tasks overlap in time: use time-based positioning (natural positioning)
      // if tasks don't overlap: use spacing constants
      if (index < sortedTasks.length - 1) {
        const nextTask = sortedTasks[index + 1];
        const nextDuration = nextTask.duration || 0;
        const nextCardHeight = taskCardHeights.get(nextTask.id) || 56;
        
        if (isOverlapping && nextTask.time) {
          // tasks overlap in time - use time-based positioning (natural positioning)
          // calculate position based on time difference from current task
          const nextTaskMinutes = timeToMinutes(nextTask.time);
          const currentTaskMinutes = timeToMinutes(task.time);
          const timeDifference = nextTaskMinutes - currentTaskMinutes;
          
          // use base pixels per minute for time-based positioning
          const basePixelsPerMinute = 0.3;
          const timeBasedOffset = timeDifference * basePixelsPerMinute;
          
          // position next task center relative to current task center
          // currentPosition is always the center, so next center = current center + time offset
          currentPosition = currentPosition + timeBasedOffset;
        } else {
          // tasks don't overlap - use spacing constants
          // calculate spacing from top edge to top edge (since labels are at top edges)
          const storedPosition = positions.get(task.id);
          if (!storedPosition) {
            // fallback (shouldn't happen, but safety check)
            // current task top edge = center - half height
            const currentTaskTopEdge = taskPosition - (cardHeight / 2);
            // next task top edge = current top edge + current card height + gap spacing
            // this ensures gapSpacing is the gap between card bottom and next card top
            const nextTaskTopEdge = currentTaskTopEdge + cardHeight + gapSpacing;
            // next task center = top edge + half height
            currentPosition = nextTaskTopEdge + (nextCardHeight / 2);
          } else {
            // use stored values for consistency
            // equalSpacingPosition is always the CENTER
            const taskCenterPosition = storedPosition.equalSpacingPosition;
            const taskCardHeight = storedPosition.cardHeight;
            // current task top edge = center - half height (where label is positioned)
            const currentTaskTopEdge = taskCenterPosition - (taskCardHeight / 2);
            
            // calculate next task's top edge: current top + current height + gap spacing
            // gapSpacing represents the gap between bottom of current card and top of next card
            // this ensures labels (at top edges) align with spacing calculation
            const nextTaskTopEdge = currentTaskTopEdge + taskCardHeight + gapSpacing;
            
            // next task center = top edge + half height (for all task types)
            currentPosition = nextTaskTopEdge + (nextCardHeight / 2);
          }
        }
      }
    });
    
    return positions;
  }, [sortedTasks, taskCardHeights]);

  // calculate dynamic pixelsPerMinute for each segment between tasks
  // returns a map of segment index -> pixelsPerMinute
  const segmentPixelsPerMinute = useMemo(() => {
    const segments = new Map<number, number>();
    
    if (sortedTasks.length < 2) return segments;
    
    // calculate pixelsPerMinute for each segment between consecutive tasks
    for (let i = 0; i < sortedTasks.length - 1; i++) {
      const currentTask = sortedTasks[i];
      const nextTask = sortedTasks[i + 1];
      
      if (!currentTask.time || !nextTask.time) continue;
      
      const currentMinutes = timeToMinutes(currentTask.time);
      const currentDuration = currentTask.duration || 0;
      const currentEndMinutes = currentMinutes + currentDuration;
      const nextMinutes = timeToMinutes(nextTask.time);
      const timeDifference = nextMinutes - currentEndMinutes;
      
      // if time difference is 0 or negative, skip
      if (timeDifference <= 0) continue;
      
      // get dynamic spacing for this time difference
      const spacing = getTaskSpacing(timeDifference);
      
      // pixelsPerMinute = spacing / timeDifferenceInMinutes
      const pixelsPerMin = spacing / timeDifference;
      segments.set(i, pixelsPerMin);
    }
    
    return segments;
  }, [sortedTasks]);

  // calculate pixelsPerMinute for each task based on its allocated space
  // this ensures consistency between tasks with duration and tasks without duration
  // returns a map of taskId -> pixelsPerMinute
  const taskPixelsPerMinute = useMemo(() => {
    const taskPpm = new Map<string, number>();
    
    sortedTasks.forEach((task) => {
      if (!task.time) return;
      
      const duration = task.duration || 0;
      const equalSpacing = equalSpacingPositions.get(task.id);
      if (!equalSpacing) return;
      
      if (duration > 0) {
        // for tasks with duration, calculate pixelsPerMinute based on allocated card height
        // this ensures the task's internal pixelsPerMinute matches its visual space
        const allocatedHeight = equalSpacing.cardHeight;
        const pixelsPerMin = allocatedHeight / duration;
        taskPpm.set(task.id, pixelsPerMin);
      } else {
        // for tasks without duration, use a default pixelsPerMinute
        // since they don't have duration-based height, use average segment pixelsPerMinute
        const taskIndex = sortedTasks.findIndex(t => t.id === task.id);
        const segmentPpm = segmentPixelsPerMinute.get(taskIndex) || 0.3;
        taskPpm.set(task.id, segmentPpm);
      }
    });
    
    return taskPpm;
  }, [sortedTasks, equalSpacingPositions, segmentPixelsPerMinute]);

  // detect task time ranges and their required heights
  // uses actual card heights measured from TimelineItem components via onLayout
  // tracks ALL tasks (with and without duration) to properly position labels
  const taskTimeRanges = useMemo(() => {
    const ranges = new Map<string, { startMinutes: number; endMinutes: number; requiredHeight: number }>();
    
    tasksWithTime.forEach((task) => {
      if (!task.time) return;
      const startMinutes = timeToMinutes(task.time);
      const duration = task.duration || 0;
      const endMinutes = startMinutes + duration;
      
      // use actual measured height from TimelineItem (via onLayout)
      // this height includes padding and all content (subtasks, etc.)
      const measuredHeight = taskCardHeights.get(task.id);
      
      if (measuredHeight) {
        // use measured height - this is the actual rendered height including padding
        ranges.set(task.id, { startMinutes, endMinutes, requiredHeight: measuredHeight });
      } else {
        // fallback to estimated height if not yet measured
        // same estimated height for all tasks (with or without duration)
        const estimatedHeight = 56;
        ranges.set(task.id, { startMinutes, endMinutes, requiredHeight: estimatedHeight });
      }
    });
    
    return ranges;
  }, [tasksWithTime, taskCardHeights]);

  // helper function to calculate position for a time using dynamic pixelsPerMinute per segment
  // tasks are positioned with dynamic spacing (100px/200px/300px based on time difference), time labels use dynamic scaling
  const calculatePositionWithOffsets = useCallback((time: string): number => {
    const timeMinutes = timeToMinutes(time);
    
    // if no tasks, return 0
    if (sortedTasks.length === 0) return 0;
    
    // find which segment this time falls into
    for (let i = 0; i < sortedTasks.length; i++) {
      const task = sortedTasks[i];
      if (!task.time) continue;
      
      const taskMinutes = timeToMinutes(task.time);
      const duration = task.duration || 0;
      const taskEndMinutes = taskMinutes + duration;
      
      // check if time is within this task's duration range
      if (timeMinutes >= taskMinutes && timeMinutes <= taskEndMinutes) {
        const equalSpacing = equalSpacingPositions.get(task.id);
        if (!equalSpacing) continue;
        
        // if task has duration, calculate position proportionally within the task
        // equalSpacingPosition is the CENTER, so start from center - half height
        if (duration > 0) {
          const minutesIntoTask = timeMinutes - taskMinutes;
          const proportion = minutesIntoTask / duration;
          const taskTop = equalSpacing.equalSpacingPosition - (equalSpacing.cardHeight / 2);
          return taskTop + (proportion * equalSpacing.cardHeight);
        } else {
          // task without duration - time is at the center
          return equalSpacing.equalSpacingPosition;
        }
      }
      
      // check if time is between this task and the next task
      if (i < sortedTasks.length - 1) {
        const nextTask = sortedTasks[i + 1];
        if (!nextTask.time) continue;
        
        const nextTaskMinutes = timeToMinutes(nextTask.time);
        
        // if time is between this task's end and next task's start
        if (timeMinutes > taskEndMinutes && timeMinutes < nextTaskMinutes) {
          const equalSpacing = equalSpacingPositions.get(task.id);
          const nextEqualSpacing = equalSpacingPositions.get(nextTask.id);
          if (!equalSpacing || !nextEqualSpacing) continue;
          
          // get the segment pixelsPerMinute
          const segmentPpm = segmentPixelsPerMinute.get(i);
          if (!segmentPpm) continue;
          
          // calculate position in the segment
          // equalSpacingPosition is the CENTER, so end position = center + half height
          const taskEndPosition = equalSpacing.equalSpacingPosition + (equalSpacing.cardHeight / 2);
          
          // next task start position is also at center, so start = center - half height
          const nextTaskStartPosition = nextEqualSpacing.equalSpacingPosition - (nextEqualSpacing.cardHeight / 2);
          
          // calculate how many minutes into the segment this time is
          const minutesIntoSegment = timeMinutes - taskEndMinutes;
          
          // calculate position using segment pixelsPerMinute
          return taskEndPosition + (minutesIntoSegment * segmentPpm);
        }
      }
    }
    
    // time is before first task or after last task
    // use the first/last task's position as reference
    if (timeMinutes < timeToMinutes(sortedTasks[0].time!)) {
      // before first task - use first task's position minus spacing
      const firstEqualSpacing = equalSpacingPositions.get(sortedTasks[0].id);
      if (firstEqualSpacing) {
        const firstTaskMinutes = timeToMinutes(sortedTasks[0].time!);
        const minutesBefore = firstTaskMinutes - timeMinutes;
        // use a default pixelsPerMinute for before first task
        const defaultPpm = 0.3;
        return firstEqualSpacing.equalSpacingPosition - (minutesBefore * defaultPpm);
      }
    } else {
      // after last task - use last task's position plus spacing
      const lastTask = sortedTasks[sortedTasks.length - 1];
      const lastEqualSpacing = equalSpacingPositions.get(lastTask.id!);
      if (lastEqualSpacing && lastTask.time) {
        const lastTaskMinutes = timeToMinutes(lastTask.time);
        const lastTaskDuration = lastTask.duration || 0;
        const lastTaskEndMinutes = lastTaskMinutes + lastTaskDuration;
        const minutesAfter = timeMinutes - lastTaskEndMinutes;
        // use a default pixelsPerMinute for after last task
        const defaultPpm = 0.3;
        // equalSpacingPosition is the CENTER, so end position = center + half height
        const lastTaskEndPosition = lastEqualSpacing.equalSpacingPosition + (lastEqualSpacing.cardHeight / 2);
        return lastTaskEndPosition + (minutesAfter * defaultPpm);
      }
    }
    
    return 0;
  }, [sortedTasks, equalSpacingPositions, segmentPixelsPerMinute]);

  // calculate total height of timeline using equal spacing
  // height is based on number of tasks and spacing between them
  const timelineHeight = useMemo(() => {
    if (sortedTasks.length === 0) {
      return 200; // minimum height when no tasks
    }
    
    // calculate height based on equal spacing positions
    // get the last task's position and add its height plus some padding
    const lastTask = sortedTasks[sortedTasks.length - 1];
    const lastEqualSpacing = equalSpacingPositions.get(lastTask.id);
    
    if (lastEqualSpacing) {
      // equalSpacingPosition is the CENTER, so end position = center + half height
      const lastTaskEndPosition = lastEqualSpacing.equalSpacingPosition + (lastEqualSpacing.cardHeight / 2);
      
      // add padding at the bottom
      return lastTaskEndPosition + 100;
    }
    
    return 200;
  }, [sortedTasks, equalSpacingPositions]);

  // calculate timeline line start and end positions (between first and last task)
  // uses equal spacing positions
  const timelineLineBounds = useMemo(() => {
    if (sortedTasks.length === 0) {
      return { top: 0, height: timelineHeight };
    }
    
    const firstTask = sortedTasks[0];
    const lastTask = sortedTasks[sortedTasks.length - 1];
    
    if (!firstTask?.time || !lastTask?.time) {
      return { top: 0, height: timelineHeight };
    }
    
    const firstEqualSpacing = equalSpacingPositions.get(firstTask.id);
    const lastEqualSpacing = equalSpacingPositions.get(lastTask.id);
    
    if (!firstEqualSpacing || !lastEqualSpacing) {
      return { top: 0, height: timelineHeight };
    }
    
    // equalSpacingPosition is the CENTER, so:
    // start position = center - half height
    const firstTaskStartPosition = firstEqualSpacing.equalSpacingPosition - (firstEqualSpacing.cardHeight / 2);
    
    // end position = center + half height
    const lastTaskEndPosition = lastEqualSpacing.equalSpacingPosition + (lastEqualSpacing.cardHeight / 2);
    
    return {
      top: firstTaskStartPosition,
      height: lastTaskEndPosition - firstTaskStartPosition,
    };
  }, [sortedTasks, equalSpacingPositions, timelineHeight]);

  // generate time labels - show start times for all tasks, and end times for tasks with duration
  // hide regular time labels that fall within a task's duration range
  const allTimeLabels = useMemo(() => {
    const labels: Array<{ time: string; position: number; isEndTime: boolean; taskId: string; endTime?: string; endPosition?: number }> = [];
    const seenTimes = new Set<string>();

    // find the first task's start position to hide labels before it
    // use equalSpacingPosition for consistency with label positioning
    let firstTaskStartPosition: number | null = null;
    if (sortedTasks.length > 0) {
      const firstTask = sortedTasks[0];
      if (firstTask?.time) {
        const firstEqualSpacing = equalSpacingPositions.get(firstTask.id);
        if (firstEqualSpacing) {
          // use the top edge of the first task (same as label positioning)
          const firstCardHeight = firstEqualSpacing.cardHeight;
          const firstCardCenter = firstEqualSpacing.equalSpacingPosition;
          firstTaskStartPosition = firstCardCenter - (firstCardHeight / 2);
        }
      }
    }

    // find the last task's end position to hide labels after it
    let lastTaskEndPosition: number | null = null;
    if (sortedTasks.length > 0) {
      const lastTask = sortedTasks[sortedTasks.length - 1];
      if (lastTask?.time) {
        const lastTaskMinutes = timeToMinutes(lastTask.time);
        const lastTaskEndMinutes = lastTaskMinutes + (lastTask.duration || 0);
        const lastTaskEndTime = minutesToTime(lastTaskEndMinutes);
        lastTaskEndPosition = calculatePositionWithOffsets(lastTaskEndTime);
      }
    }

    // create a set of time ranges for tasks (to check if a time falls within a task)
    const taskTimeRanges = tasksWithTime.map((task) => {
      if (!task.time) return null;
      const startMinutes = timeToMinutes(task.time);
      const endMinutes = task.duration ? startMinutes + task.duration : startMinutes;
      return { start: startMinutes, end: endMinutes, startTime: task.time };
    }).filter(Boolean) as Array<{ start: number; end: number; startTime: string }>;

    // helper function to check if a time falls within any task's duration range
    // returns true if the time is NOT within any task range (so we should show it)
    const shouldShowRegularLabel = (time: string): boolean => {
      const timeMinutes = timeToMinutes(time);
      
      // check if this time is exactly a task start time
      for (const range of taskTimeRanges) {
        if (range.startTime === time) return false; // it's a task start, will be added separately
      }
      
      // check if this time falls within any task's duration range
      for (const range of taskTimeRanges) {
        // if time is between start (exclusive) and end (exclusive), hide it
        if (timeMinutes > range.start && timeMinutes < range.end) {
          return false;
        }
      }
      
      return true; // show regular label if it's not within any task range
    };

    // hide all regular time slot labels - only show task start time labels
    // timeSlots.forEach((time) => {
    //   if (shouldShowRegularLabel(time)) {
    //     const position = calculatePositionWithOffsets(time);
    //     
    //     // hide if before the first task
    //     if (firstTaskStartPosition !== null && position < firstTaskStartPosition) {
    //       return;
    //     }
    //     
    //     // hide if past the last task
    //     if (lastTaskEndPosition !== null && position > lastTaskEndPosition) {
    //       return;
    //     }
    //     
    //     labels.push({ time, position, isEndTime: false });
    //     seenTimes.add(time);
    //   }
    // });

    // add time labels for all tasks - positioned at the top edge of each card
    // use equalSpacingPosition which is always the CENTER of the card
    tasksWithTime.forEach((task) => {
      if (!task.time) return;
      
      // get the task's equal spacing position (always the CENTER of the card)
      const equalSpacing = equalSpacingPositions.get(task.id);
      if (!equalSpacing) return;
      
      // position label at the top edge of the card
      // equalSpacingPosition is the center of the card
      // top edge = center - half card height
      const cardHeight = equalSpacing.cardHeight;
      const cardCenter = equalSpacing.equalSpacingPosition;
      const cardTop = cardCenter - (cardHeight / 2);
      const labelPosition = cardTop;
      
      // check if task has duration - if so, calculate end time and position
      // end position is calculated independently from timeline scales, purely based on card height
      const duration = task.duration || 0;
      let endTime: string | undefined;
      let endPosition: number | undefined;
      
      if (duration > 0) {
        // calculate end time: task start time + duration
        const startMinutes = timeToMinutes(task.time);
        const endMinutes = startMinutes + duration;
        endTime = minutesToTime(endMinutes);
        
        // calculate end position: top edge + card height - bottom padding
        // this positions the end time label at the content bottom edge (inside padding)
        // this is independent of timeline scales - purely based on measured card height
        const bottomPadding = 16; // matches combinedContainer paddingBottom in TimelineItem
        endPosition = cardTop + cardHeight;
      }
      
      // hide if before the first task (but always show the first task's label)
      if (firstTaskStartPosition !== null && labelPosition < firstTaskStartPosition && task.id !== sortedTasks[0]?.id) {
        return;
      }
      
      // hide if past the last task
      if (lastTaskEndPosition !== null && labelPosition > lastTaskEndPosition) {
        return;
      }
      
      // create label object with optional end time/position
      const labelObject = {
        time: task.time,
        position: labelPosition,
        isEndTime: false,
        taskId: task.id,
        ...(endTime && endPosition !== undefined ? { endTime, endPosition } : {})
      };
      
      // always add/update label for each task
      // use task.id to track labels so they update correctly when tasks move
      const existingLabelIndex = labels.findIndex(l => l.taskId === task.id);
      if (existingLabelIndex >= 0) {
        // update existing label with all fields (including end time/position if they exist)
        labels[existingLabelIndex] = labelObject;
      } else {
        // add new label with task.id for proper keying
        labels.push(labelObject);
      }
    });

    // sort labels by position
    return labels.sort((a, b) => a.position - b.position);
  }, [timeSlots, sortedTasks, tasksWithTime, dynamicStartHour, calculatePositionWithOffsets, taskCardHeights, equalSpacingPositions]);

  // reverse calculate position to time - accounts for task-aware spacing offsets
  // finds the time that corresponds to a given Y position
  // constrained to 00:05 (earliest) and 23:55 (latest)
  const positionToTimeWithOffsets = useCallback((yPosition: number): string => {
    // find the time that corresponds to this position
    // iterate through possible times (every 5 minutes) and find the closest match
    let closestTime = '';
    let minDiff = Infinity;
    
    // constrain to valid drag times: 00:05 to 23:55
    const minDragTime = '00:05';
    const maxDragTime = '23:55';
    const minDragMinutes = timeToMinutes(minDragTime); // 5 minutes
    const maxDragMinutes = timeToMinutes(maxDragTime); // 1435 minutes (23*60 + 55)
    
    // iterate through all possible times between min and max drag times
    for (let minutes = minDragMinutes; minutes <= maxDragMinutes; minutes += 5) {
      const testTime = minutesToTime(minutes);
      const testPosition = calculatePositionWithOffsets(testTime);
      const diff = Math.abs(testPosition - yPosition);
      
      if (diff < minDiff) {
        minDiff = diff;
        closestTime = testTime;
      }
    }
    
    // clamp the result to ensure it's within bounds
    const closestMinutes = timeToMinutes(closestTime);
    const clampedMinutes = Math.max(minDragMinutes, Math.min(maxDragMinutes, closestMinutes));
    
    return minutesToTime(clampedMinutes);
  }, [calculatePositionWithOffsets]);

  // handle when a task is dragged to a new position
  // converts the Y position to a time and updates the task
  const handleTaskDrag = useCallback((taskId: string, newY: number) => {
    // use reverse calculation that accounts for offsets
    const newTime = positionToTimeWithOffsets(newY);
    
    // call the callback to update the task
    if (onTaskTimeChange) {
      onTaskTimeChange(taskId, newTime);
    }
  }, [onTaskTimeChange, positionToTimeWithOffsets]);

  // handle height measurement from TimelineItem
  const handleHeightMeasured = useCallback((taskId: string, height: number) => {
    setTaskCardHeights(prev => {
      const currentHeight = prev.get(taskId);
      
      // only update if height actually changed to avoid infinite loops
      if (currentHeight === height) {
        return prev;
      }
      const newMap = new Map(prev);
      newMap.set(taskId, height);
      
      return newMap;
    });
  }, [tasks]);

  return (
    <View style={styles.container}>
      {/* scrollable timeline content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent, 
          { minHeight: timelineHeight + 220 } // timelineHeight + paddingTop (20) + paddingBottom (200)
        ]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={true}
      >
        {/* time labels column on the left */}
        <View style={styles.timeLabelsContainer}>
          {allTimeLabels.map((label) => (
            <React.Fragment key={`${label.taskId}-${label.time}`}>
              {/* start time label - always rendered */}
              <TimeLabel
                time={label.time}
                position={label.position}
                isEndTime={false}
              />
              
              {/* end time label - only rendered if task has duration */}
              {label.endTime && label.endPosition !== undefined && (
                <TimeLabel
                  key={`${label.taskId}-${label.endTime}-end`}
                  time={label.endTime}
                  position={label.endPosition}
                  isEndTime={true}
                />
              )}
            </React.Fragment>
          ))}
          
          {/* drag time label - shows current drag position */}
          {dragState && (
            <TimeLabel
              key="drag-time-label"
              time={dragState.time}
              position={dragState.yPosition}
              isDragLabel={true}
            />
          )}
        </View>

        {/* tasks column on the right */}
        <View style={styles.tasksContainer}>
          {/* vertical line connecting all time slots - extends only between first and last task */}
          <View style={[
            styles.timelineLine, 
            { 
              top: timelineLineBounds.top,
              height: timelineLineBounds.height 
            }
          ]} />

          {/* render each task at its position */}
          {tasksWithTime.length === 0 ? (
            // empty state when no tasks have times set
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                No tasks with scheduled times for this day.
              </Text>
              <Text style={styles.emptyStateSubtext}>
                Add a time to your tasks to see them on the timeline.
              </Text>
            </View>
          ) : (
            sortedTasks.map((task) => {
              const duration = task.duration || 0;
              
              // get equal spacing position for this task
              const equalSpacing = equalSpacingPositions.get(task.id);
              if (!equalSpacing) return null;
              
              // equalSpacingPosition is the CENTER of the card
              // convert to top position for rendering (top = center - half height)
              // MUST use same cardHeight that was used in spacing calculation
              // (equalSpacing.cardHeight) to ensure positions match spacing calculations
              const centerPosition = equalSpacing.equalSpacingPosition;
              const cardHeight = equalSpacing.cardHeight;
              const position = centerPosition - (cardHeight / 2);
              
              // get pixelsPerMinute for this task (consistent for height calculations)
              // for tasks with duration: based on allocated height / duration
              // for tasks without duration: use segment pixelsPerMinute
              const taskPpm = taskPixelsPerMinute.get(task.id) || 0.3;
              
              return (
                <TimelineItem
                  key={task.id}
                  task={task}
                  position={position}
                  duration={duration}
                  pixelsPerMinute={taskPpm}
                  startHour={dynamicStartHour}
                  onHeightMeasured={(height: number) => handleHeightMeasured(task.id, height)}
                    onDrag={(newY) => {
                      // newY is the top position of the task from TimelineItem
                      // convert top position to center position (equalSpacingPosition is always center)
                      const centerY = newY + (cardHeight / 2);
                      handleTaskDrag(task.id, centerY);
                    }}
                  onDragStart={() => {
                    // drag started - will be updated by onDragPositionChange
                  }}
                  onDragPositionChange={(yPosition) => {
                    // yPosition is the top position of the task from TimelineItem
                    // convert top position to center position (equalSpacingPosition is always center)
                    const centerY = yPosition + (cardHeight / 2);
                    // calculate time from center position using offset-aware function
                    const time = positionToTimeWithOffsets(centerY);
                    setDragState({ yPosition: centerY, time });
                  }}
                  onDragEnd={() => {
                    setDragState(null);
                  }}
                  onPress={() => onTaskPress?.(task)}
                />
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// create dynamic styles using theme colors and typography
const createStyles = (
  themeColors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useTypography>
) => StyleSheet.create({
  // main container for the timeline view
  container: {
    flex: 1,
    backgroundColor: themeColors.background.primary(),
  },

  // scrollable view container
  scrollView: {
    flex: 1,
  },

  // scroll content container with calculated height
  scrollContent: {
    flexDirection: 'row',
    paddingTop: 80, // increased top padding to see just the top
    paddingBottom: 200, // bottom padding
  },

  // time labels container on the left side - more compact
  timeLabelsContainer: {
    marginLeft: 28,
    paddingRight: 20,
    alignItems: 'flex-end',
  },

  // tasks container on the right side (takes remaining space)
  tasksContainer: {
    flex: 1,
    position: 'relative',
    paddingLeft: 20,
    paddingRight: 14,
  },

  // vertical line connecting all time slots
  timelineLine: {
    position: 'absolute',
    left: 26,
    top: 0,
    width: 4,
    backgroundColor: themeColors.border.secondary(),
  },

  // empty state container
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 100,
  },

  // empty state text
  emptyStateText: {
    ...typography.getTextStyle('body-large'),
    color: themeColors.text.secondary(),
    textAlign: 'center',
    marginBottom: 8,
  },

  // empty state subtext
  emptyStateSubtext: {
    ...typography.getTextStyle('body-medium'),
    color: themeColors.text.tertiary(),
    textAlign: 'center',
  },
});

