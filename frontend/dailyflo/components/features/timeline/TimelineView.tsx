/**
 * TimelineView Component
 * 
 * Displays tasks in a timeline format with time labels on the left side.
 * Tasks are positioned at their scheduled times and can be dragged to change times.
 * Shows connecting lines between tasks and displays icons in circular containers.
 * 
 * This component is used by the Planner screen to show tasks in a timeline view.
 */

import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { Task } from '@/types';
import TimelineItem from './TimelineItem';
import TimeLabel from './TimeLabel';
import { calculateTaskPosition, generateTimeSlots, snapToNearestTime, timeToMinutes, minutesToTime, calculateTaskHeight, calculateTaskRenderProperties, useTimelineDrag, getTaskCardHeight } from './timelineUtils';

interface TimelineViewProps {
  // array of tasks to display on the timeline
  tasks: Task[];
  // callback when a task's time is changed via dragging
  onTaskTimeChange?: (taskId: string, newTime: string, newDuration?: number) => void;
  // callback when a task is pressed
  onTaskPress?: (task: Task) => void;
  // callback when a task's completion status is toggled
  onTaskComplete?: (task: Task) => void;
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
  onTaskComplete,
  startHour = 6,
  endHour = 23,
  timeInterval = 60,
}: TimelineViewProps) {
  const themeColors = useThemeColors();
  const typography = useTypography();

  // track measured/animated card heights (used for both rendering and spacing)
  // spacing now follows the animated height so the whole timeline moves smoothly
  const [taskCardHeights, setTaskCardHeights] = useState<Map<string, number>>(new Map());

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

  // spacing constants - adjust these to change spacing between tasks
  const SPACING_LESS_THAN_30_MIN = 30;
  const SPACING_30_MIN_TO_1_HOUR = 90;
  const SPACING_MORE_THAN_1_HOUR = 90;
  
  // calculate spacing between tasks based on time difference
  const getTaskSpacing = (timeDifferenceMinutes: number): number => {
    if (timeDifferenceMinutes < 30) {
      return SPACING_LESS_THAN_30_MIN;
    } else if (timeDifferenceMinutes <= 60) {
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

  // calculate task positions with consistent spacing
  // uses the latest measured/animated card heights so spacing animates with cards
  // returns map of taskId -> { equalSpacingPosition (center), cardHeight }
  const equalSpacingPositions = useMemo(() => {
    const positions = new Map<string, { equalSpacingPosition: number; cardHeight: number }>();
    if (sortedTasks.length === 0) return positions;
    
    let currentPosition = 0; // start at top
    
    sortedTasks.forEach((task, index) => {
      if (!task.time) return;
      
      const duration = task.duration || 0;
      const hasSubtasks = task.metadata?.subtasks && task.metadata.subtasks.length > 0;

      // prefer the live measured/animated height so spacing animates with the card
      // fall back to the base height from centralized helper if we don't have it yet
      const measuredHeight = taskCardHeights.get(task.id);
      const fallbackHeight = getTaskCardHeight(duration, hasSubtasks);
      const cardHeight = measuredHeight ?? fallbackHeight;
      
      // store center position for this task
      positions.set(task.id, { equalSpacingPosition: currentPosition, cardHeight });
      
      // calculate next task's position
      if (index < sortedTasks.length - 1) {
        const nextTask = sortedTasks[index + 1];
        if (!nextTask.time) return;
        
        const taskMinutes = timeToMinutes(task.time);
        const taskEndMinutes = taskMinutes + duration;
        const nextTaskMinutes = timeToMinutes(nextTask.time);
        const nextTaskDuration = nextTask.duration || 0;
        const nextTaskEndMinutes = nextTaskMinutes + nextTaskDuration;
        
        // check if tasks overlap in time
        const isOverlapping = taskEndMinutes > nextTaskMinutes || 
          taskMinutes === nextTaskMinutes ||
          taskMinutes === nextTaskEndMinutes ||
          nextTaskMinutes === taskEndMinutes;
        
        if (isOverlapping) {
          // overlapping tasks: use time-based positioning
          const timeDifference = nextTaskMinutes - taskMinutes;
          currentPosition += timeDifference * 0.3; // 0.3 pixels per minute
        } else {
          // non-overlapping tasks: use spacing constants
          const timeDifference = nextTaskMinutes - taskEndMinutes;
          const gapSpacing = getTaskSpacing(timeDifference);
          
          // calculate next task position: current top + current height + gap
          const currentTop = currentPosition - (cardHeight / 2);
          const nextTop = currentTop + cardHeight + gapSpacing;

          // compute the spacing height for the next task using its live height when available
          const nextTaskDuration = nextTask.duration || 0;
          const nextTaskHasSubtasks = nextTask.metadata?.subtasks && nextTask.metadata.subtasks.length > 0;
          const nextMeasuredHeight = taskCardHeights.get(nextTask.id);
          const nextFallbackHeight = getTaskCardHeight(nextTaskDuration, nextTaskHasSubtasks);
          const nextTaskSpacingHeight = nextMeasuredHeight ?? nextFallbackHeight;

          currentPosition = nextTop + (nextTaskSpacingHeight / 2);
        }
      }
    });
    
    return positions;
  }, [sortedTasks, taskCardHeights]); // recalc when tasks or heights change so spacing matches animated card heights

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


  // calculate Y position for a given time on the timeline
  // accounts for task spacing and overlapping tasks
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
          // task without duration - anchor the time to the TOP edge of the card
          // so aligning top edges of zero-duration tasks gives matching times
          const taskTop = equalSpacing.equalSpacingPosition - (equalSpacing.cardHeight / 2);
          return taskTop;
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

  // generate time labels - show start times for all tasks, end times for tasks with duration
  const allTimeLabels = useMemo(() => {
    const labels: Array<{ time: string; position: number; isEndTime: boolean; taskId: string; endTime?: string; endPosition?: number }> = [];

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

    // add time labels for all tasks - positioned at top edge of each card
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
      
      // calculate end time label for tasks with duration
      const duration = task.duration || 0;
      const hasSubtasks = task.metadata?.subtasks && task.metadata.subtasks.length > 0;

      // use the base, non-expanded card height for end-time labels so subtask expansion
      // does not visually extend the main task's duration on the timeline
      const baseCardHeight = getTaskCardHeight(duration, hasSubtasks);
      let endTime: string | undefined;
      let endPosition: number | undefined;
      
      if (duration > 0) {
        const startMinutes = timeToMinutes(task.time);
        const endMinutes = startMinutes + duration;
        endTime = minutesToTime(endMinutes);
        endPosition = cardTop + baseCardHeight; // bottom edge of the main card only (exclude subtask expansion)
      }
      
      // hide if before the first task (but always show the first task's label)
      if (firstTaskStartPosition !== null && labelPosition < firstTaskStartPosition && task.id !== sortedTasks[0]?.id) {
        return;
      }
      
      // hide if past the last task
      if (lastTaskEndPosition !== null && labelPosition > lastTaskEndPosition) {
        return;
      }
      
      // add label (update if exists, otherwise add new)
      const labelObject = {
        time: task.time,
        position: labelPosition,
        isEndTime: false,
        taskId: task.id,
        ...(endTime && endPosition !== undefined ? { endTime, endPosition } : {})
      };
      
      const existingIndex = labels.findIndex(l => l.taskId === task.id);
      if (existingIndex >= 0) {
        labels[existingIndex] = labelObject;
      } else {
        labels.push(labelObject);
      }
    });

    return labels.sort((a, b) => a.position - b.position);
  }, [sortedTasks, tasksWithTime, calculatePositionWithOffsets, equalSpacingPositions]);

  // convert Y position (TOP edge of the card) to time for drag operations
  // finds closest time by testing every 5 minutes between 00:05 and 23:55
  // this function is used by the drag hook to convert top positions to time
  const positionToTimeWithOffsets = useCallback((topY: number): string => {
    const globalMinDragMinutes = timeToMinutes('00:05');
    const globalMaxDragMinutes = timeToMinutes('23:55');

    // derive a tighter clamp window from the actual first and last tasks
    // so positions at or above the first task's top never map to earlier times
    let earliestTaskMinutes = globalMinDragMinutes;
    let latestTaskEndMinutes = globalMaxDragMinutes;

    if (sortedTasks.length > 0) {
      const firstTask = sortedTasks[0];
      if (firstTask.time) {
        earliestTaskMinutes = Math.max(
          globalMinDragMinutes,
          timeToMinutes(firstTask.time)
        );
      }

      const lastTask = sortedTasks[sortedTasks.length - 1];
      if (lastTask.time) {
        const lastMinutes = timeToMinutes(lastTask.time);
        const lastEnd = lastMinutes + (lastTask.duration || 0);
        latestTaskEndMinutes = Math.min(globalMaxDragMinutes, lastEnd);
      }
    }
    
    let closestTime = '';
    let minDiff = Infinity;
    
    for (let minutes = globalMinDragMinutes; minutes <= globalMaxDragMinutes; minutes += 5) {
      const testTime = minutesToTime(minutes);
      const testPosition = calculatePositionWithOffsets(testTime);
      const diff = Math.abs(testPosition - topY);
      
      if (diff < minDiff) {
        minDiff = diff;
        closestTime = testTime;
      }
    }
    
    const closestMinutes = timeToMinutes(closestTime);
    // clamp to the first task's start and the last task's end so
    // aligning a later card's top with the first card's top always
    // yields the same start time as that first task
    const clampedMinutes = Math.max(
      earliestTaskMinutes,
      Math.min(latestTaskEndMinutes, closestMinutes)
    );
    return minutesToTime(clampedMinutes);
  }, [calculatePositionWithOffsets, sortedTasks]);

  // use drag hook for unified drag handling across all states
  // this modularizes the drag logic that was previously duplicated
  const {
    dragState,
    handleDragStart,
    handleDragPositionChange,
    handleDragEnd,
  } = useTimelineDrag({
    positionToTime: positionToTimeWithOffsets,
    onTaskTimeChange: (taskId: string, newTime: string) => {
      onTaskTimeChange?.(taskId, newTime);
    },
  });

  // handle height measurement from TimelineItem
  // measured heights now drive both rendering and spacing so the timeline animates with cards
  const handleHeightMeasured = useCallback((taskId: string, height: number) => {
    setTaskCardHeights(prev => {
      if (prev.get(taskId) === height) return prev;
      const newMap = new Map(prev);
      newMap.set(taskId, height);
      return newMap;
    });
  }, []);
  
  // reset heights when tasks change
  const taskIdsString = useMemo(() => 
    sortedTasks.map(t => t.id).sort().join(','), 
    [sortedTasks]
  );
  
  useEffect(() => {
    // when the visible task set changes, keep heights for tasks that still exist
    // this preserves expanded heights across reordering (e.g. after drag)
    setTaskCardHeights(prev => {
      const next = new Map<string, number>();
      sortedTasks.forEach(task => {
        const existing = prev.get(task.id);
        if (existing !== undefined) {
          next.set(task.id, existing);
        }
      });
      return next;
    });
  }, [taskIdsString, sortedTasks]);

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
              
              // use modular function to calculate all render properties
              // this unifies the calculation logic used across all three states:
              // - After drag and drop
              // - After updating a task
              // - After initially loading
              // spacingHeight uses fallback height from TASK_CARD_HEIGHTS constants
              // values: 64px (no duration), 80px (duration), 88px (duration + subtasks)
              const spacingHeight = equalSpacing.cardHeight;
              const measuredHeight = taskCardHeights.get(task.id) || spacingHeight;
              const taskPpm = taskPixelsPerMinute.get(task.id) || 0.3;
              
              const renderProps = calculateTaskRenderProperties(
                task.id,
                equalSpacing.equalSpacingPosition,
                spacingHeight,
                measuredHeight,
                taskPpm
              );
              
              return (
                <TimelineItem
                  key={task.id}
                  task={task}
                  position={renderProps.position}
                  duration={duration}
                  pixelsPerMinute={renderProps.pixelsPerMinute}
                  startHour={dynamicStartHour}
                  onHeightMeasured={(height: number) => handleHeightMeasured(task.id, height)}
                  onDrag={(newY) => {
                    // newY is the top position from TimelineItem when drag ends
                    // use modular drag handler which converts top to center and updates task
                    // this handles the "after drag and drop" state
                    handleDragEnd(task.id, newY, renderProps.measuredHeight);
                  }}
                  onDragStart={() => {
                    // drag started - use modular drag handler with initial position
                    // this initializes drag state for visual feedback
                    // get initial position from basePosition (current top position)
                    const initialTopY = renderProps.position;
                    handleDragStart(task.id, initialTopY, renderProps.measuredHeight);
                  }}
                  onDragPositionChange={(yPosition) => {
                    // yPosition is the top position from TimelineItem during drag
                    // use modular drag handler which converts top to center and updates drag state
                    // this provides visual feedback during drag
                    handleDragPositionChange(task.id, yPosition, renderProps.measuredHeight);
                  }}
                  onDragEnd={() => {
                    // drag ended - cleanup handled by handleDragEnd in onDrag callback
                    // this is called after onDrag, so state is already cleared
                  }}
                  onPress={() => onTaskPress?.(task)}
                  onTaskComplete={onTaskComplete}
                  // pass isDraggedTask prop so this task can apply higher z-index when being dragged
                  // this ensures the dragged task appears above all other tasks on the timeline
                  isDraggedTask={dragState?.taskId === task.id}
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
  // positioned to be horizontally centered with icon container
  // icon container: 44px wide, center at 22px from its left edge
  // icon container starts at tasksContainer paddingLeft (20px)
  // icon container center from tasksContainer left: 20 + 22 = 42px
  // timeline line is 4px wide, so to center it: left = 42 - (4/2) = 40px
  // but if appearing on right edge, recalculate: icon container right edge is at 20 + 44 = 64px
  // to center: left should be at icon container center minus half line width
  timelineLine: {
    position: 'absolute',
    // icon container: starts at tasksContainer.paddingLeft (20px), width 44px, center at 22px from start
    // icon container center from tasksContainer left: 20 + 22 = 42px
    // timeline line width: 4px, so to center: left = 42 - 2 = 40px
    left: 21,
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

