/**
 * TimelineView Component
 * 
 * Displays tasks in a timeline format with time labels on the left side.
 * Tasks are positioned at their scheduled times and can be dragged to change times.
 * Shows connecting lines between tasks and displays icons in circular containers.
 * 
 * This component is used by the Planner screen to show tasks in a timeline view.
 */

import React, { useMemo, useState, useCallback, useRef, useEffect, useLayoutEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, Platform } from 'react-native';
import { useSharedValue, withTiming, makeMutable, withSpring } from 'react-native-reanimated';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { Paddings } from '@/constants/Paddings';
import { Task } from '@/types';
import TimelineItem from './TimelineItem/TimelineItem';
import TimeLabel from './TimeLabel';
import { OverlappingTaskCard } from './OverlappingTaskCard';
import DragOverlay from './DragOverlay';
import { DashedVerticalLine } from '@/components/ui/borders';
import { SparklesIcon } from '@/components/ui/icon';
import { calculateTaskPosition, generateTimeSlots, snapToNearestTime, timeToMinutes, minutesToTime, calculateTaskHeight, calculateTaskRenderProperties, useTimelineDrag, getTaskCardHeight } from './timelineUtils';

// type for combined overlapping tasks
// represents multiple tasks that overlap and are combined into a single card
interface CombinedOverlappingTask {
  id: string; // unique id for the combined task (e.g., "overlap-{task1Id}-{task2Id}-...")
  tasks: Task[]; // array of tasks sorted by start time (earliest first)
  time: string; // start time (from first task in the array)
  duration: number; // calculated duration from start of first to end of last
  dueDate: string; // due date (from first task in the array)
}

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

  // track if we're currently processing a drag operation to prevent double overlap detection
  // when a drag ends, handleTaskTimeChangeWithOverlap handles overlap detection
  // we don't want the useEffect to also run overlap detection immediately after
  const isProcessingDragRef = useRef(false);

  // track task IDs that should be hidden due to overlaps
  // when a task is dragged and overlaps with others, both overlapping tasks are hidden
  const [hiddenTaskIds, setHiddenTaskIds] = useState<Set<string>>(new Set());

  // store the full task objects that are hidden due to overlaps
  // this preserves the complete task data (including the dragged task with its new time)
  // so they can be restored later if needed
  // access via: hiddenOverlappingTasks.get(taskId) to get a specific task
  // or: Array.from(hiddenOverlappingTasks.values()) to get all hidden overlapping tasks
  const [hiddenOverlappingTasks, setHiddenOverlappingTasks] = useState<Map<string, Task>>(new Map());

  // store combined overlapping tasks that replace the individual overlapping tasks
  // these are created when tasks overlap and represent the combined card
  const [combinedOverlappingTasks, setCombinedOverlappingTasks] = useState<Map<string, CombinedOverlappingTask>>(new Map());

  // create dynamic styles using theme colors and typography
  const styles = useMemo(() => createStyles(themeColors, typography), [themeColors, typography]);

  // helper function to check if two tasks overlap in time
  // returns true if the time ranges of two tasks overlap
  const doTasksOverlap = useCallback((task1: Task, task2: Task): boolean => {
    if (!task1.time || !task2.time) return false;
    
    const task1Minutes = timeToMinutes(task1.time);
    const task1Duration = task1.duration || 0;
    const task1EndMinutes = task1Minutes + task1Duration;
    
    const task2Minutes = timeToMinutes(task2.time);
    const task2Duration = task2.duration || 0;
    const task2EndMinutes = task2Minutes + task2Duration;
    
    // tasks overlap if one starts before the other ends
    // handle edge cases: tasks that start/end at the same time are considered overlapping
    return (
      (task1Minutes < task2EndMinutes && task1EndMinutes > task2Minutes) ||
      (task1Minutes === task2Minutes) ||
      (task1EndMinutes === task2EndMinutes) ||
      (task1Minutes === task2EndMinutes) ||
      (task1EndMinutes === task2Minutes)
    );
  }, []);

  // filter tasks that have a time set (required for timeline positioning)
  // tasks without time won't appear on the timeline
  // also exclude tasks that are hidden due to overlaps
  // and include combined overlapping tasks as pseudo-tasks for rendering
  const tasksWithTime = useMemo(() => {
    const regularTasks = tasks.filter(task => 
      task.time && 
      task.dueDate && 
      !hiddenTaskIds.has(task.id)
    );
    
    // convert combined overlapping tasks to pseudo-tasks for rendering
    const combinedTasksAsPseudoTasks: Task[] = Array.from(combinedOverlappingTasks.values())
      .filter(combined => combined.tasks && combined.tasks.length > 0) // ensure tasks array exists and has items
      .map(combined => {
        const firstTask = combined.tasks[0]; // safe to access since we filtered above
        return {
          id: combined.id,
          userId: firstTask.userId,
          listId: firstTask.listId,
          title: combined.tasks.map(t => t.title).join(' & '), // combined title for display
          description: '',
          icon: firstTask.icon, // use first task's icon
          time: combined.time,
          duration: combined.duration,
          dueDate: combined.dueDate,
          isCompleted: false,
          completedAt: null,
          priorityLevel: firstTask.priorityLevel,
          color: firstTask.color,
          routineType: firstTask.routineType,
          sortOrder: 0,
          metadata: { subtasks: [], reminders: [] },
          softDeleted: false,
          createdAt: firstTask.createdAt,
          updatedAt: firstTask.updatedAt,
        };
      });
    
    // combine regular tasks and combined tasks
    return [...regularTasks, ...combinedTasksAsPseudoTasks];
  }, [tasks, hiddenTaskIds, combinedOverlappingTasks]);

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
  const SPACING_LESS_THAN_30_MIN = 20;
  const SPACING_30_MIN_TO_2_HOURS = 84;
  const SPACING_MORE_THAN_2_HOURS = 140;
  
  // calculate spacing between tasks based on time difference
  const getTaskSpacing = (timeDifferenceMinutes: number): number => {
    if (timeDifferenceMinutes < 30) {
      return SPACING_LESS_THAN_30_MIN;
    } else if (timeDifferenceMinutes <= 120) {
      return SPACING_30_MIN_TO_2_HOURS;
    } else {
      return SPACING_MORE_THAN_2_HOURS;
    }
  };

  // 20 messages for 30 min to 2 hours free time segments - short, about enjoying a break (max 6-7 words)
  const FREE_TIME_BREAK_MESSAGES = [
    'Take a moment to breathe.',
    'You deserve a little rest.',
    'Enjoy this pocket of calm.',
    'Stretch and unwind a bit.',
    'Step outside for fresh air.',
    'Grab a drink and relax.',
    'Let your mind wander free.',
    'Quick recharge before what\'s next.',
    'Sit back and take it in.',
    'A brief pause does wonders.',
    'Ease into this quiet moment.',
    'Reset before the next task.',
    'Savor this small slice of time.',
    'Unplug for a few minutes.',
    'Allow yourself to slow down.',
    'A short break, well earned.',
    'Breathe deep and feel ease.',
    'Enjoy the empty space.',
    'Nice little pocket of peace.',
    'Pause and appreciate the quiet.',
  ];

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
      
      // check if this is a combined overlapping task
      const combinedTask = combinedOverlappingTasks.get(task.id);
      
      let cardHeight: number;
      
      if (combinedTask) {
        // calculate combined height for overlapping tasks: sum of all task heights + spacing
        let combinedHeight = 0;
        combinedTask.tasks.forEach((taskItem, index) => {
          const taskDuration = taskItem.duration || 0;
          const taskHeight = getTaskCardHeight(taskDuration);
          combinedHeight += taskHeight;
          // add 4px spacing between cards (not after the last one)
          if (index < combinedTask.tasks.length - 1) {
            combinedHeight += 4;
          }
        });
        
        // prefer the live measured/animated height so spacing animates with the card
        // fall back to the calculated combined height if we don't have it yet
        const measuredHeight = taskCardHeights.get(task.id);
        cardHeight = measuredHeight ?? combinedHeight;
      } else {
        // regular task - use standard height calculation
        const duration = task.duration || 0;
        // prefer the live measured/animated height so spacing animates with the card
        const measuredHeight = taskCardHeights.get(task.id);
        const fallbackHeight = getTaskCardHeight(duration);
        cardHeight = measuredHeight ?? fallbackHeight;
      }
      
      // store center position for this task
      positions.set(task.id, { equalSpacingPosition: currentPosition, cardHeight });
      
      // calculate next task's position
      if (index < sortedTasks.length - 1) {
        const nextTask = sortedTasks[index + 1];
        if (!nextTask.time) return;
        
        const taskMinutes = timeToMinutes(task.time);
        const taskDuration = task.duration || 0;
        const taskEndMinutes = taskMinutes + taskDuration;
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
          // check if next task is a combined overlapping task
          const nextCombinedTask = combinedOverlappingTasks.get(nextTask.id);
          let nextTaskSpacingHeight: number;
          
          if (nextCombinedTask) {
            // calculate combined height for next overlapping task: sum of all task heights + spacing
            let nextCombinedHeight = 0;
            nextCombinedTask.tasks.forEach((taskItem, index) => {
              const taskDuration = taskItem.duration || 0;
              const taskHeight = getTaskCardHeight(taskDuration);
              nextCombinedHeight += taskHeight;
              // add 4px spacing between cards (not after the last one)
              if (index < nextCombinedTask.tasks.length - 1) {
                nextCombinedHeight += 4;
              }
            });
            const nextMeasuredHeight = taskCardHeights.get(nextTask.id);
            nextTaskSpacingHeight = nextMeasuredHeight ?? nextCombinedHeight;
          } else {
            // regular next task
            const nextTaskDuration = nextTask.duration || 0;
            const nextMeasuredHeight = taskCardHeights.get(nextTask.id);
            const nextFallbackHeight = getTaskCardHeight(nextTaskDuration);
            nextTaskSpacingHeight = nextMeasuredHeight ?? nextFallbackHeight;
          }

          currentPosition = nextTop + (nextTaskSpacingHeight / 2);
        }
      }
    });
    
    return positions;
  }, [sortedTasks, taskCardHeights, combinedOverlappingTasks]); // recalc when tasks or heights change so spacing matches animated card heights

  // free time segments - gaps between non-overlapping tasks where we show contextual messages
  // derived from equalSpacingPositions: gap = space between bottom of current task and top of next
  // includes timeDifferenceMinutes to pick message type: 30-60 min = break messages, >60 min = duration message
  const freeTimeSegments = useMemo(() => {
    const segments: Array<{ top: number; height: number; timeDifferenceMinutes: number }> = [];
    if (sortedTasks.length < 2) return segments;

    for (let i = 0; i < sortedTasks.length - 1; i++) {
      const task = sortedTasks[i];
      const nextTask = sortedTasks[i + 1];
      if (!task.time || !nextTask.time) continue;

      const taskEndMinutes = timeToMinutes(task.time) + (task.duration || 0);
      const nextTaskMinutes = timeToMinutes(nextTask.time);
      const timeDifferenceMinutes = nextTaskMinutes - taskEndMinutes;
      const isOverlapping =
        taskEndMinutes > nextTaskMinutes ||
        timeToMinutes(task.time) === nextTaskMinutes ||
        timeToMinutes(task.time) === nextTaskMinutes + (nextTask.duration || 0) ||
        nextTaskMinutes === taskEndMinutes;

      if (isOverlapping) continue;

      const curr = equalSpacingPositions.get(task.id);
      const next = equalSpacingPositions.get(nextTask.id);
      if (!curr || !next) continue;

      const gapTop = curr.equalSpacingPosition + curr.cardHeight / 2;
      const nextTaskTop = next.equalSpacingPosition - next.cardHeight / 2;
      const gapHeight = nextTaskTop - gapTop;
      if (gapHeight > 0) segments.push({ top: gapTop, height: gapHeight, timeDifferenceMinutes });
    }
    return segments;
  }, [sortedTasks, equalSpacingPositions]);

  // format minutes as "Xh Ym" for free time duration display
  const formatMinutesToDuration = (minutes: number): string => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  };

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
      let endTime: string | undefined;
      let endPosition: number | undefined;
      
      if (duration > 0) {
        const startMinutes = timeToMinutes(task.time);
        const endMinutes = startMinutes + duration;
        endTime = minutesToTime(endMinutes);
        // use the actual card height from equalSpacing (includes combined height for overlapping tasks)
        // this ensures end time label is positioned at the bottom of the card, including all stacked tasks
        endPosition = cardTop + cardHeight; // bottom edge of the card (includes combined height for overlapping tasks)
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

  // store animated positions for time labels using reanimated
  // this allows labels to smoothly animate when tasks expand/collapse
  // using ref to persist shared values across renders
  // note: we can't call useSharedValue conditionally, so we create them lazily using a helper
  const labelPositionAnimationsRef = useRef<Map<string, ReturnType<typeof useSharedValue<number>>>>(new Map());
  
  // skip label animation during initial layout (~250ms) - prevents jank when positions update
  // after task height measurements cascade
  const timelineMountTimeRef = useRef(Date.now());

  // helper function to get or create shared value for a label
  // using makeMutable allows us to create shared values conditionally (inside useEffect)
  // this is the correct way to create shared values dynamically
  const getOrCreateLabelAnimation = useCallback((key: string, initialValue: number) => {
    const animations = labelPositionAnimationsRef.current;
    if (!animations.has(key)) {
      // create shared value using makeMutable for dynamic creation
      // makeMutable can be called conditionally, unlike useSharedValue
      animations.set(key, makeMutable(initialValue));
    }
    return animations.get(key)!;
  }, []);

  // create and update animated positions for time labels
  // this makes labels smoothly move when tasks expand/collapse
  useEffect(() => {
    const isInitialLayout = Date.now() - timelineMountTimeRef.current < 250;
    
    allTimeLabels.forEach((label) => {
      const startLabelKey = `${label.taskId}-${label.time}-start`;
      
      // get or create shared value for start time label
      const positionAnimation = getOrCreateLabelAnimation(startLabelKey, label.position);
      
      // during initial layout, set immediately to prevent jank; later, animate smoothly
      if (isInitialLayout) {
        positionAnimation.value = label.position;
      } else {
        positionAnimation.value = withTiming(label.position, {
          duration: 75, // matches card expansion animation duration
        });
      }
      
      // handle end time label if it exists
      if (label.endTime && label.endPosition !== undefined) {
        const endLabelKey = `${label.taskId}-${label.endTime}-end`;
        const endPositionAnimation = getOrCreateLabelAnimation(endLabelKey, label.endPosition);
        if (isInitialLayout) {
          endPositionAnimation.value = label.endPosition;
        } else {
          endPositionAnimation.value = withTiming(label.endPosition, {
            duration: 75, // matches card expansion animation duration
          });
        }
      }
    });
    
    // cleanup: remove animations for labels that no longer exist
    const labelPositionAnimations = labelPositionAnimationsRef.current;
    const currentLabelKeys = new Set<string>();
    allTimeLabels.forEach((label) => {
      currentLabelKeys.add(`${label.taskId}-${label.time}-start`);
      if (label.endTime) {
        currentLabelKeys.add(`${label.taskId}-${label.endTime}-end`);
      }
    });
    
    // remove animations for labels that are no longer in the list
    Array.from(labelPositionAnimations.keys()).forEach((key) => {
      if (!currentLabelKeys.has(key)) {
        labelPositionAnimations.delete(key);
      }
    });
  }, [allTimeLabels, getOrCreateLabelAnimation]);

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

  // helper function to calculate combined properties for overlapping tasks
  // calculates start time, end time, and duration for a combined overlapping task
  // calculate combined task properties from an array of tasks
  // sorts tasks by start time and calculates combined time range
  const calculateCombinedTaskProperties = useCallback((tasksToCombine: Task[]): {
    time: string;
    duration: number;
    dueDate: string;
  } => {
    if (tasksToCombine.length === 0) {
      throw new Error('Cannot calculate combined properties for an empty array of tasks');
    }
    
    // ensure all tasks have time
    const tasksWithTime = tasksToCombine.filter(task => task.time);
    if (tasksWithTime.length === 0) {
      throw new Error('All tasks must have time to calculate combined properties');
    }
    
    // sort tasks by start time (earliest first)
    const sortedTasks = [...tasksWithTime].sort((a, b) => {
      if (!a.time || !b.time) return 0;
      return timeToMinutes(a.time) - timeToMinutes(b.time);
    });
    
    const firstTask = sortedTasks[0];
    const lastTask = sortedTasks[sortedTasks.length - 1];
    
    const firstTaskMinutes = timeToMinutes(firstTask.time!);
    const firstTaskDuration = firstTask.duration || 0;
    
    const lastTaskMinutes = timeToMinutes(lastTask.time!);
    const lastTaskDuration = lastTask.duration || 0;
    const lastTaskEndMinutes = lastTaskMinutes + lastTaskDuration;
    
    // start time is the start time of the first task
    const startTime = firstTask.time!;
    
    // end time is the end time of the last task (if duration), or start time of last task (if no duration)
    let endTimeMinutes: number;
    if (lastTaskDuration > 0) {
      // last task has duration, use its end time
      endTimeMinutes = lastTaskEndMinutes;
    } else {
      // last task has no duration, use its start time
      endTimeMinutes = lastTaskMinutes;
    }
    
    // duration is from start of first task to end of last task
    const duration = endTimeMinutes - firstTaskMinutes;
    
    return {
      time: startTime,
      duration: Math.max(0, duration), // ensure non-negative
      dueDate: firstTask.dueDate || '',
    };
  }, []);

  /**
   * Modular function to detect and create overlapping task groups
   * This function analyzes all tasks and groups overlapping tasks together
   * Used on initial load, task updates, and any timeline refresh
   */
  const detectAndCreateOverlappingTasks = useCallback((tasksToAnalyze: Task[]) => {
    // filter to only tasks with time (required for overlap detection)
    const tasksWithTime = tasksToAnalyze.filter(task => task.time && task.dueDate);
    
    if (tasksWithTime.length === 0) {
      // no tasks with time - clear all overlapping state
      setCombinedOverlappingTasks(new Map());
      setHiddenTaskIds(new Set());
      setHiddenOverlappingTasks(new Map());
      return;
    }
    
    // find all overlapping groups using a union-find approach
    // each group represents tasks that overlap with each other
    const taskGroups: Task[][] = [];
    const processedTaskIds = new Set<string>();
    
    // for each task, find all tasks that overlap with it (directly or transitively)
    tasksWithTime.forEach(task => {
      if (processedTaskIds.has(task.id)) return;
      
      // start a new group with this task
      const group: Task[] = [task];
      processedTaskIds.add(task.id);
      
      // find all tasks that overlap with any task in this group
      // keep expanding until no more overlapping tasks are found
      let foundNew = true;
      while (foundNew) {
        foundNew = false;
        tasksWithTime.forEach(otherTask => {
          if (processedTaskIds.has(otherTask.id)) return;
          
          // check if this task overlaps with any task in the current group
          const overlapsWithGroup = group.some(groupTask => doTasksOverlap(otherTask, groupTask));
          
          if (overlapsWithGroup) {
            group.push(otherTask);
            processedTaskIds.add(otherTask.id);
            foundNew = true;
          }
        });
      }
      
      // only create a group if it has 2+ tasks (single tasks don't need grouping)
      if (group.length >= 2) {
        taskGroups.push(group);
      }
    });
    
    // create combined overlapping tasks for each group
    const newCombinedTasks = new Map<string, CombinedOverlappingTask>();
    const newHiddenTaskIds = new Set<string>();
    const newHiddenOverlappingTasks = new Map<string, Task>();
    
    taskGroups.forEach(group => {
      // sort tasks by start time (earliest first)
      group.sort((a, b) => {
        if (!a.time || !b.time) return 0;
        return timeToMinutes(a.time) - timeToMinutes(b.time);
      });
      
      // create combined task id from all task ids
      const combinedTaskId = `overlap-${group.map(t => t.id).join('-')}`;
      
      // create combined task with all tasks
      const combinedTask: CombinedOverlappingTask = {
        id: combinedTaskId,
        tasks: group,
        ...calculateCombinedTaskProperties(group),
      };
      
      // store the combined task
      newCombinedTasks.set(combinedTask.id, combinedTask);
      
      // hide all tasks in this group
      group.forEach(task => {
        newHiddenTaskIds.add(task.id);
        newHiddenOverlappingTasks.set(task.id, task);
      });
    });
    
    // update state with all detected overlapping groups
    setCombinedOverlappingTasks(newCombinedTasks);
    setHiddenTaskIds(newHiddenTaskIds);
    setHiddenOverlappingTasks(newHiddenOverlappingTasks);
  }, [doTasksOverlap, calculateCombinedTaskProperties]);

  // handle task time change with overlap detection
  // when a task is dragged to a new time, check for overlaps and create combined overlapping task
  // also handles removing tasks from combined overlapping tasks when they're dragged out
  const handleTaskTimeChangeWithOverlap = useCallback((taskId: string, newTime: string) => {
    // mark that we're processing a drag operation to prevent useEffect from running overlap detection
    isProcessingDragRef.current = true;
    
    // update the task time via parent callback
    onTaskTimeChange?.(taskId, newTime);
    
    // after updating, detect overlaps with the new time
    // find the dragged task to get its duration
    const draggedTask = tasks.find(t => t.id === taskId);
    if (!draggedTask) {
      // reset drag processing flag if task not found
      setTimeout(() => {
        isProcessingDragRef.current = false;
      }, 50);
      return;
    }
    
    // create a temporary task object with the new time for overlap checking
    const draggedTaskWithNewTime: Task = {
      ...draggedTask,
      time: newTime,
    };
    
    // first, check if the dragged task was part of a combined overlapping task
    // if so, remove it from that combined task
    let wasInCombinedTask = false;
    let sourceCombinedTaskId: string | null = null;
    let sourceCombinedTask: CombinedOverlappingTask | null = null;
    
    for (const [combinedTaskId, combinedTask] of combinedOverlappingTasks.entries()) {
      const taskIndex = combinedTask.tasks.findIndex((t: Task) => t.id === taskId);
      if (taskIndex >= 0) {
        wasInCombinedTask = true;
        sourceCombinedTaskId = combinedTaskId;
        sourceCombinedTask = combinedTask;
        break;
      }
    }
    
    // if task was in a combined task, remove it and handle the remaining tasks
    if (wasInCombinedTask && sourceCombinedTask && sourceCombinedTaskId) {
      // remove the dragged task from the combined task
      const remainingTasks = sourceCombinedTask.tasks.filter((t: Task) => t.id !== taskId);
      
      // remove the old combined task FIRST
      // this ensures the timeline recalculates positions before the task becomes visible
      setCombinedOverlappingTasks(prev => {
        const next = new Map(prev);
        next.delete(sourceCombinedTaskId!);
        return next;
      });
      
      // remove the dragged task from stored overlapping tasks
      setHiddenOverlappingTasks(prev => {
        const next = new Map(prev);
        next.delete(taskId);
        return next;
      });
      
      // DON'T remove from hiddenTaskIds yet - keep it hidden until we check for overlaps
      // This prevents the slide glitch where it appears at old position first
      // We'll remove it from hiddenTaskIds after checking if it still overlaps
      
      // handle remaining tasks
      if (remainingTasks.length === 0) {
        // no tasks left - nothing to do
        // reset drag processing flag after a small delay to prevent double detection
        setTimeout(() => {
          isProcessingDragRef.current = false;
        }, 50);
        return;
      } else if (remainingTasks.length === 1) {
        // only one task remains - check if dragged task still overlaps with it
        const remainingTask = remainingTasks[0];
        const stillOverlaps = remainingTask.time && doTasksOverlap(draggedTaskWithNewTime, remainingTask);
        
        if (stillOverlaps) {
          // dragged task still overlaps with the remaining task - create combined task with both
          const allTasksIncludingDragged = [remainingTask, draggedTaskWithNewTime];
          
          // sort all tasks by start time
          allTasksIncludingDragged.sort((a, b) => {
            if (!a.time || !b.time) return 0;
            return timeToMinutes(a.time) - timeToMinutes(b.time);
          });
          
          // create new combined task id from all task ids (including dragged task)
          const newCombinedTaskId = `overlap-${allTasksIncludingDragged.map(t => t.id).join('-')}`;
          
          // create new combined task with all tasks (including dragged task)
          const newCombinedTask: CombinedOverlappingTask = {
            id: newCombinedTaskId,
            tasks: allTasksIncludingDragged,
            ...calculateCombinedTaskProperties(allTasksIncludingDragged),
          };
          
          // store the new combined overlapping task
          setCombinedOverlappingTasks(prev => {
            const next = new Map(prev);
            next.set(newCombinedTask.id, newCombinedTask);
            return next;
          });
          
          // hide all tasks (including dragged task)
          const allTaskIds = allTasksIncludingDragged.map(t => t.id);
          setHiddenTaskIds(prev => {
            const next = new Set(prev);
            allTaskIds.forEach(id => next.add(id));
            return next;
          });
          
          // store all tasks (including dragged task)
          setHiddenOverlappingTasks(prev => {
            const next = new Map(prev);
            allTasksIncludingDragged.forEach(task => {
              next.set(task.id, task);
            });
            return next;
          });
          
          // early return - we've handled the overlap, no need to check further
          // reset drag processing flag after a small delay to prevent double detection
          setTimeout(() => {
            isProcessingDragRef.current = false;
          }, 50);
          return;
        } else {
          // dragged task no longer overlaps with the remaining task
          // convert the remaining task back to a standalone task
          setHiddenTaskIds(prev => {
            const next = new Set(prev);
            next.delete(remainingTask.id);
            return next;
          });
          setHiddenOverlappingTasks(prev => {
            const next = new Map(prev);
            next.delete(remainingTask.id);
            return next;
          });
        }
      } else {
        // multiple tasks remain - check if dragged task still overlaps with remaining tasks
        // if it does, merge it back into the combined task
        const stillOverlapsWithRemaining = remainingTasks.some((task: Task) => {
          if (!task.time) return false;
          return doTasksOverlap(draggedTaskWithNewTime, task);
        });
        
        if (stillOverlapsWithRemaining) {
          // dragged task still overlaps with remaining tasks - merge it back in
          const allTasksIncludingDragged = [...remainingTasks, draggedTaskWithNewTime];
          
          // sort all tasks by start time
          allTasksIncludingDragged.sort((a, b) => {
            if (!a.time || !b.time) return 0;
            return timeToMinutes(a.time) - timeToMinutes(b.time);
          });
          
          // create new combined task id from all task ids (including dragged task)
          const newCombinedTaskId = `overlap-${allTasksIncludingDragged.map(t => t.id).join('-')}`;
          
          // create new combined task with all tasks (including dragged task)
          const newCombinedTask: CombinedOverlappingTask = {
            id: newCombinedTaskId,
            tasks: allTasksIncludingDragged,
            ...calculateCombinedTaskProperties(allTasksIncludingDragged),
          };
          
          // store the new combined overlapping task
          setCombinedOverlappingTasks(prev => {
            const next = new Map(prev);
            next.set(newCombinedTask.id, newCombinedTask);
            return next;
          });
          
          // hide all tasks (including dragged task)
          const allTaskIds = allTasksIncludingDragged.map(t => t.id);
          setHiddenTaskIds(prev => {
            const next = new Set(prev);
            allTaskIds.forEach(id => next.add(id));
            return next;
          });
          
          // store all tasks (including dragged task)
          setHiddenOverlappingTasks(prev => {
            const next = new Map(prev);
            allTasksIncludingDragged.forEach(task => {
              next.set(task.id, task);
            });
            return next;
          });
          
          // early return - we've handled the overlap, no need to check further
          // reset drag processing flag after a small delay to prevent double detection
          setTimeout(() => {
            isProcessingDragRef.current = false;
          }, 50);
          return;
        } else {
          // dragged task no longer overlaps with remaining tasks
          // create a new combined task with just the remaining tasks
          // sort remaining tasks by start time
          remainingTasks.sort((a, b) => {
            if (!a.time || !b.time) return 0;
            return timeToMinutes(a.time) - timeToMinutes(b.time);
          });
          
          // create new combined task id from remaining task ids
          const newCombinedTaskId = `overlap-${remainingTasks.map(t => t.id).join('-')}`;
          
          // create new combined task with remaining tasks
          const newCombinedTask: CombinedOverlappingTask = {
            id: newCombinedTaskId,
            tasks: remainingTasks,
            ...calculateCombinedTaskProperties(remainingTasks),
          };
          
          // store the new combined overlapping task
          setCombinedOverlappingTasks(prev => {
            const next = new Map(prev);
            next.set(newCombinedTask.id, newCombinedTask);
            return next;
          });
          
          // keep remaining tasks hidden
          const remainingTaskIds = remainingTasks.map(t => t.id);
          setHiddenTaskIds(prev => {
            const next = new Set(prev);
            remainingTaskIds.forEach(id => next.add(id));
            return next;
          });
          
          // store remaining tasks
          setHiddenOverlappingTasks(prev => {
            const next = new Map(prev);
            remainingTasks.forEach(task => {
              next.set(task.id, task);
            });
            return next;
          });
        }
      }
    }
    
    // now check if the dragged task (with its new time) overlaps with any other tasks
    // find all tasks that overlap with the dragged task at its new position
    // also check if the dragged task overlaps with any existing combined overlapping tasks
    const overlappingTaskIds = new Set<string>();
    const overlappingTasks = new Map<string, Task>();
    let overlappingCombinedTask: CombinedOverlappingTask | null = null;
    let overlappingCombinedTaskId: string | null = null;
    
    // first, check if dragged task overlaps with any existing combined overlapping tasks
    for (const [combinedTaskId, combinedTask] of combinedOverlappingTasks.entries()) {
      // skip the source combined task if we just removed the task from it
      if (combinedTaskId === sourceCombinedTaskId) continue;
      
      // check if dragged task overlaps with any task in the combined task
      const overlapsWithCombined = combinedTask.tasks.some((task: Task) => {
        if (!task.time) return false;
        return doTasksOverlap(draggedTaskWithNewTime, task);
      });
      
      if (overlapsWithCombined) {
        overlappingCombinedTask = combinedTask;
        overlappingCombinedTaskId = combinedTaskId;
        break; // found an overlap, no need to check others
      }
    }
    
    // if no overlap with existing combined task, check for overlaps with standalone tasks
    if (!overlappingCombinedTask) {
      tasks.forEach(task => {
        // skip the dragged task itself (we'll add it separately)
        if (task.id === taskId) return;
        // skip tasks without time
        if (!task.time) return;
        // skip tasks that are already in a combined overlapping task
        if (hiddenTaskIds.has(task.id)) return;
        
        // check if this task overlaps with the dragged task at its new position
        if (doTasksOverlap(draggedTaskWithNewTime, task)) {
          overlappingTaskIds.add(task.id);
          // store the full task object for later restoration
          overlappingTasks.set(task.id, task);
        }
      });
    }
    
    // if task was dragged out of overlapping group and doesn't overlap with anything else,
    // remove it from hiddenTaskIds now (after overlap check) to make it visible as standalone
    // This prevents slide glitch by keeping it hidden until timeline has recalculated positions
    // Use requestAnimationFrame to ensure timeline has recalculated before making it visible
    if (wasInCombinedTask && !overlappingCombinedTask && overlappingTaskIds.size === 0) {
      // dragged task doesn't overlap with anything - make it visible as standalone
      // Delay visibility change to allow timeline to recalculate positions first
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setHiddenTaskIds(prev => {
            const next = new Set(prev);
            next.delete(taskId);
            return next;
          });
        });
      });
    }
    
    // if there are overlaps, create a combined overlapping task
    if (overlappingCombinedTask || overlappingTaskIds.size > 0) {
      let allTasksToCombine: Task[] = [];
      
      if (overlappingCombinedTask && overlappingCombinedTaskId) {
        // dragged task overlaps with an existing combined overlapping task
        // extract all tasks from the existing combined task and add the dragged task
        allTasksToCombine = [...overlappingCombinedTask.tasks, draggedTaskWithNewTime];
        
        // hide all tasks from the old combined task
        const oldTaskIds = overlappingCombinedTask.tasks.map((t: Task) => t.id);
        setHiddenTaskIds(prev => {
          const next = new Set(prev);
          oldTaskIds.forEach((id: string) => next.add(id));
          next.add(taskId); // also hide the dragged task
          return next;
        });
        
        // store all tasks from the old combined task
        setHiddenOverlappingTasks(prev => {
          const next = new Map(prev);
          overlappingCombinedTask!.tasks.forEach((task: Task) => {
            next.set(task.id, task);
          });
          next.set(taskId, draggedTaskWithNewTime);
          return next;
        });
        
        // remove the old combined task
        setCombinedOverlappingTasks(prev => {
          const next = new Map(prev);
          next.delete(overlappingCombinedTaskId);
          return next;
        });
      } else {
        // dragged task overlaps with a standalone task
        const overlappingTaskId = Array.from(overlappingTaskIds)[0];
        const overlappingTask = overlappingTasks.get(overlappingTaskId);
        
        if (overlappingTask) {
          allTasksToCombine = [draggedTaskWithNewTime, overlappingTask];
          
          // hide both the dragged task and the overlapping task
          setHiddenTaskIds(prev => {
            const next = new Set(prev);
            next.add(taskId);
            next.add(overlappingTaskId);
            return next;
          });
          
          // store the full task objects for later restoration
          setHiddenOverlappingTasks(prev => {
            const next = new Map(prev);
            next.set(taskId, draggedTaskWithNewTime);
            next.set(overlappingTaskId, overlappingTask);
            return next;
          });
        }
      }
      
      // sort all tasks by start time
      allTasksToCombine.sort((a, b) => {
        if (!a.time || !b.time) return 0;
        return timeToMinutes(a.time) - timeToMinutes(b.time);
      });
      
      // create combined task id from all task ids
      const combinedTaskId = `overlap-${allTasksToCombine.map(t => t.id).join('-')}`;
      
      // create combined task with all tasks sorted by start time
      const combinedTask: CombinedOverlappingTask = {
        id: combinedTaskId,
        tasks: allTasksToCombine,
        ...calculateCombinedTaskProperties(allTasksToCombine),
      };
      
      // store the combined overlapping task
      setCombinedOverlappingTasks(prev => {
        const next = new Map(prev);
        next.set(combinedTask.id, combinedTask);
        return next;
      });
    }
    
    // reset drag processing flag after overlap detection completes
    // use a small delay to ensure the useEffect has a chance to check the flag
    // this prevents double overlap detection when tasks prop updates after drag
    setTimeout(() => {
      isProcessingDragRef.current = false;
    }, 50);
  }, [tasks, doTasksOverlap, onTaskTimeChange, calculateCombinedTaskProperties, combinedOverlappingTasks, hiddenTaskIds]);

  // use drag hook for unified drag handling across all states
  // this modularizes the drag logic that was previously duplicated
  const {
    dragState,
    handleDragStart,
    handleDragPositionChange,
    handleDragEnd,
  } = useTimelineDrag({
    positionToTime: positionToTimeWithOffsets,
    onTaskTimeChange: handleTaskTimeChangeWithOverlap,
  });
  
  // shared value for drag overlay position - used to anchor time label to overlay
  // this ensures the time label moves smoothly with the overlay (especially on iOS with spring animation)
  // initialized to 0, will be updated when drag starts and during drag
  const dragOverlayY = useSharedValue(0);
  
  // track previous drag taskId to detect when a new drag starts
  // when a new drag starts, we immediately set position without animation
  // during the same drag, we use smooth spring animation
  const previousDragTaskIdRef = useRef<string | null>(null);
  const previousDragStateRef = useRef<typeof dragState>(null);
  
  // update drag overlay position when drag state changes
  // use useLayoutEffect to set position synchronously before paint to prevent flicker
  // this keeps the overlay and time label synchronized
  useLayoutEffect(() => {
    const wasDragging = previousDragStateRef.current !== null;
    const isDragging = dragState !== null;
    
    if (dragState) {
      const isNewDrag = previousDragTaskIdRef.current !== dragState.taskId;
      
      if (isNewDrag) {
        // new drag started - immediately set position without animation
        // useLayoutEffect ensures this happens synchronously before overlay renders
        // this prevents overlay from flashing at old position
        dragOverlayY.value = dragState.yPosition;
        previousDragTaskIdRef.current = dragState.taskId;
      } else {
        // same drag continuing - use smooth spring animation on iOS
        if (Platform.OS === 'ios') {
          dragOverlayY.value = withSpring(dragState.yPosition, {
            damping: 20, // moderate damping for smooth but not bouncy feel
            stiffness: 400, // high stiffness for immediate, responsive movement
            mass: 0.3, // low mass for light, quick response
            overshootClamping: false, // allow slight overshoot for natural feel
          });
        } else {
          // for Android, use direct assignment for immediate response
          dragOverlayY.value = dragState.yPosition;
        }
      }
    } else if (wasDragging && !isDragging) {
      // drag just ended - reset position to prevent flicker on next drag
      // set to a value that won't be visible (off-screen)
      // this ensures overlay doesn't flash at old position when new drag starts
      dragOverlayY.value = -1000; // move off-screen
      previousDragTaskIdRef.current = null;
    }
    
    // update previous drag state ref for next comparison
    previousDragStateRef.current = dragState;
  }, [dragState?.taskId, dragState?.yPosition, dragOverlayY, dragState]);

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

  // detect and create overlapping tasks when tasks change
  // this runs on initial load, task updates, and any timeline refresh
  // uses modular detectAndCreateOverlappingTasks function for consistency
  // only runs when not dragging to avoid interfering with drag operations
  useEffect(() => {
    // only run overlap detection if we're not currently dragging and not processing a drag operation
    // drag operations handle overlap detection themselves via handleTaskTimeChangeWithOverlap
    // this ensures overlap detection runs on initial load and when tasks are updated (but not during/after drag)
    if (dragState === null && !isProcessingDragRef.current) {
      detectAndCreateOverlappingTasks(tasks);
    }
  }, [tasks, detectAndCreateOverlappingTasks, dragState]);

  // clear hidden tasks that no longer exist in the tasks list
  // this prevents stale hidden state when tasks are removed or updated
  // note: this runs after detectAndCreateOverlappingTasks, so it cleans up any stale state
  useEffect(() => {
    setHiddenTaskIds(prev => {
      const next = new Set<string>();
      // only keep task IDs that still exist in the tasks list
      prev.forEach(taskId => {
        if (tasks.some(t => t.id === taskId)) {
          next.add(taskId);
        }
      });
      return next;
    });
    
    // also clean up stored overlapping tasks that no longer exist
    setHiddenOverlappingTasks(prev => {
      const next = new Map<string, Task>();
      // only keep task objects that still exist in the tasks list
      prev.forEach((task, taskId) => {
        if (tasks.some(t => t.id === taskId)) {
          next.set(taskId, task);
        }
      });
      return next;
    });
    
    // clean up combined overlapping tasks if their component tasks no longer exist
    setCombinedOverlappingTasks(prev => {
      const next = new Map<string, CombinedOverlappingTask>();
      prev.forEach((combinedTask, combinedId) => {
        // keep combined task if all component tasks still exist
        const allTasksExist = combinedTask.tasks.every(task => 
          tasks.some(t => t.id === task.id)
        );
        if (allTasksExist) {
          next.set(combinedId, combinedTask);
        }
      });
      return next;
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
          {allTimeLabels.map((label) => {
            // get animated position for this label from ref
            const labelPositionAnimations = labelPositionAnimationsRef.current;
            const startLabelKey = `${label.taskId}-${label.time}-start`;
            const positionAnimation = labelPositionAnimations.get(startLabelKey);
            const endLabelKey = label.endTime ? `${label.taskId}-${label.endTime}-end` : null;
            const endPositionAnimation = endLabelKey ? labelPositionAnimations.get(endLabelKey) : null;
            
            return (
              <React.Fragment key={`${label.taskId}-${label.time}`}>
                {/* start time label - always rendered */}
                <TimeLabel
                  time={label.time}
                  position={label.position}
                  animatedPosition={positionAnimation} // pass animated position for smooth animation
                  isEndTime={false}
                />
                
                {/* end time label - only rendered if task has duration */}
                {label.endTime && label.endPosition !== undefined && endPositionAnimation && (
                  <TimeLabel
                    key={`${label.taskId}-${label.endTime}-end`}
                    time={label.endTime}
                    position={label.endPosition}
                    animatedPosition={endPositionAnimation} // pass animated position for smooth animation
                    isEndTime={true}
                  />
                )}
              </React.Fragment>
            );
          })}
          
          {/* drag time label - shows current drag position */}
          {/* anchored to drag overlay position for smooth, synchronized movement */}
          {dragState && (
            <TimeLabel
              key="drag-time-label"
              time={dragState.time}
              position={dragState.yPosition}
              animatedPosition={dragOverlayY}
              isDragLabel={true}
            />
          )}
        </View>

        {/* tasks column on the right */}
        <View style={styles.tasksContainer}>
          {/* vertical dashed line connecting all time slots - extends only between first and last task */}
          <DashedVerticalLine
            height={timelineLineBounds.height}
            color={themeColors.border.secondary()}
            style={[
              styles.timelineLine,
              { top: timelineLineBounds.top },
            ]}
          />

          {/* free time blocks - rendered in the gap between non-overlapping tasks (30+ min only) */}
          {freeTimeSegments
            .filter((seg) => seg.timeDifferenceMinutes >= 30)
            .map((seg, i) => {
              const isLongBreak = seg.timeDifferenceMinutes > 120;
              const isMediumBreak = seg.timeDifferenceMinutes >= 30 && seg.timeDifferenceMinutes <= 120;
              return (
                <View
                  key={`free-time-${i}`}
                  style={[
                    styles.freeTimeBlock,
                    { top: seg.top, height: seg.height },
                  ]}
                >
                  <View style={styles.freeTimeContentRow}>
                    <SparklesIcon size={14} color={themeColors.background.quaternary()} />
                    {isLongBreak ? (
                      <Text style={[styles.freeTimeTextSegments, { color: themeColors.background.tertiary() }]}>
                        Woah! you have{' '}
                        <Text style={styles.freeTimeDurationBold}>
                          {formatMinutesToDuration(seg.timeDifferenceMinutes)}
                        </Text>
                        {' '}of free time!
                      </Text>
                    ) : (
                      <Text style={[styles.freeTimeTextSegments, { color: themeColors.background.tertiary() }]}>
                        {FREE_TIME_BREAK_MESSAGES[i % FREE_TIME_BREAK_MESSAGES.length]}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          
          {/* drag overlay - follows thumb position during drag */}
          {/* only rendered when dragState exists and task is available (during active drag) */}
          {/* uses shared value for position to keep synchronized with time label */}
          {/* key ensures overlay remounts cleanly when switching tasks to prevent flicker */}
          {dragState && dragState.task && (
            <DragOverlay
              key={`drag-overlay-${dragState.taskId}`}
              task={dragState.task}
              yPosition={dragState.yPosition}
              cardHeight={dragState.cardHeight}
              duration={dragState.task.duration || 0}
              animatedPosition={dragOverlayY}
            />
          )}

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
              
              // check if this is a combined overlapping task
              const combinedTask = combinedOverlappingTasks.get(task.id);
              
              if (combinedTask) {
                // render OverlappingTaskCard for combined overlapping tasks
                // get equal spacing position for the combined task
                const equalSpacing = equalSpacingPositions.get(task.id);
                if (!equalSpacing) return null;
                
                // calculate combined height: sum of all task card heights + spacing
                let combinedHeight = 0;
                combinedTask.tasks.forEach((taskItem, index) => {
                  const taskDuration = taskItem.duration || 0;
                  const taskHeight = getTaskCardHeight(taskDuration);
                  combinedHeight += taskHeight;
                  // add 4px spacing between cards (not after the last one)
                  if (index < combinedTask.tasks.length - 1) {
                    combinedHeight += 4;
                  }
                });
                
                // use the combined height for spacing calculations
                const spacingHeight = combinedHeight;
                const measuredHeight = taskCardHeights.get(task.id) || spacingHeight;
                const taskPpm = taskPixelsPerMinute.get(task.id) || 0.3;
                
                // for overlapping tasks, position based on the first task's time
                // this ensures the first task aligns with its time label
                const firstTask = combinedTask.tasks[0];
                const firstTaskTime = firstTask?.time;
                let overlappingCardPosition: number;
                
                if (firstTaskTime) {
                  // use calculatePositionWithOffsets to get the exact position based on the first task's time
                  // this ensures alignment with the time label regardless of expansion state
                  overlappingCardPosition = calculatePositionWithOffsets(firstTaskTime);
                } else {
                  // fallback to calculated position if first task has no time
                  const renderProps = calculateTaskRenderProperties(
                    task.id,
                    equalSpacing.equalSpacingPosition,
                    spacingHeight,
                    measuredHeight,
                    taskPpm
                  );
                  overlappingCardPosition = renderProps.position;
                }
                
                return (
                  <OverlappingTaskCard
                    key={task.id}
                    tasks={combinedTask.tasks}
                    position={overlappingCardPosition}
                    duration={duration}
                    pixelsPerMinute={taskPpm}
                    startHour={dynamicStartHour}
                    combinedTaskId={task.id}
                    onPress={(pressedTask) => onTaskPress?.(pressedTask)}
                    onTaskComplete={onTaskComplete}
                    onDrag={(taskId, newY) => {
                      // handle drag from overlapping task - use modular drag handler
                      // this converts top position to center and updates task
                      // find the task to get its measured height
                      const draggedTask = combinedTask.tasks.find(t => t.id === taskId);
                      if (draggedTask) {
                        const taskDuration = draggedTask.duration || 0;
                        const taskHeight = getTaskCardHeight(taskDuration);
                        const measuredHeight = taskCardHeights.get(taskId) || taskHeight;
                        handleDragEnd(taskId, newY, measuredHeight);
                      }
                    }}
                    onDragStart={(taskId) => {
                      // drag started from overlapping task - use modular drag handler
                      // find the task and calculate its position
                      const draggedTask = combinedTask.tasks.find(t => t.id === taskId);
                      if (draggedTask) {
                        const taskIndex = combinedTask.tasks.findIndex(t => t.id === taskId);
                        // use overlappingCardPosition as the base (position of first task)
                        let taskTopPosition = overlappingCardPosition;
                        // calculate position by summing heights of all previous tasks
                        for (let i = 0; i < taskIndex; i++) {
                          const prevTask = combinedTask.tasks[i];
                          // use measured height if available
                          const prevMeasuredHeight = taskCardHeights.get(prevTask.id);
                          const prevTaskDuration = prevTask.duration || 0;
                          const prevTaskHeight = prevMeasuredHeight ?? getTaskCardHeight(prevTaskDuration);
                          taskTopPosition += prevTaskHeight + 4; // 4px spacing between cards
                        }
                        const taskDuration = draggedTask.duration || 0;
                        const taskHeight = getTaskCardHeight(taskDuration);
                        const measuredHeight = taskCardHeights.get(taskId) || taskHeight;
                        handleDragStart(taskId, taskTopPosition, measuredHeight, draggedTask);
                      }
                    }}
                    onDragPositionChange={(taskId, yPosition) => {
                      // drag position changed from overlapping task - use modular drag handler
                      // this provides visual feedback during drag
                      // find the task to get its measured height
                      const draggedTask = combinedTask.tasks.find(t => t.id === taskId);
                      if (draggedTask) {
                        const taskDuration = draggedTask.duration || 0;
                        const taskHeight = getTaskCardHeight(taskDuration);
                        const measuredHeight = taskCardHeights.get(taskId) || taskHeight;
                        handleDragPositionChange(taskId, yPosition, measuredHeight);
                      }
                    }}
                    onDragEnd={(taskId) => {
                      // drag ended from overlapping task - cleanup handled by handleDragEnd in onDrag callback
                    }}
                    onHeightMeasured={(taskId, height) => {
                      // forward height measurement to the main handler
                      handleHeightMeasured(taskId, height);
                    }}
                    draggedTaskId={dragState?.taskId || null}
                  />
                );
              }
              
              // render regular TimelineItem for non-combined tasks
              // get equal spacing position for this task
              const equalSpacing = equalSpacingPositions.get(task.id);
              if (!equalSpacing) return null;
              
              // use modular function to calculate all render properties
              // this unifies the calculation logic used across all three states:
              // - After drag and drop
              // - After updating a task
              // - After initially loading
              // spacingHeight uses fallback height from TASK_CARD_HEIGHTS constants
              // values: 64px (no duration), 72px (duration)
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
                  onDrag={(newY: number) => {
                    // newY is the top position from TimelineItem when drag ends
                    // use modular drag handler which converts top to center and updates task
                    // this handles the "after drag and drop" state
                    handleDragEnd(task.id, newY, renderProps.measuredHeight);
                  }}
                  onDragStart={() => {
                    // drag started - use modular drag handler with initial position and task info
                    // this initializes drag state for visual feedback and overlay rendering
                    // get initial position from basePosition (current top position)
                    const initialTopY = renderProps.position;
                    handleDragStart(task.id, initialTopY, renderProps.measuredHeight, task);
                  }}
                  onDragPositionChange={(yPosition: number) => {
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
  // --- LAYOUT STYLES ---
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
    paddingTop: Paddings.timelineScrollTop,
    paddingBottom: Paddings.timelineScrollBottom,
  },

  // time labels container on the left side - more compact
  timeLabelsContainer: {
    marginLeft: 28,
    paddingRight: Paddings.timelineLabelsRight,
    alignItems: 'flex-end',
  },

  // tasks container on the right side (takes remaining space)
  tasksContainer: {
    flex: 1,
    position: 'relative',
    paddingLeft: Paddings.timelineTasksLeft,
    paddingRight: Paddings.timelineTasksRight,
  },

  // vertical dashed line connecting all time slots - aligns with icon container line (left: 21)
  timelineLine: {
    position: 'absolute',
    left: 21,
  },

  // free time block - fills the gap between non-overlapping tasks
  // positioned absolutely at gap top/height, text vertically centered
  // 32px left padding and left-aligned for all segment messages
  freeTimeBlock: {
    position: 'absolute',
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: Paddings.timelineFreeTimeLeft,
  },

  // row containing sparkles icon (14px) + message text
  freeTimeContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  // empty state container
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Paddings.timelineEmptyHorizontal,
    paddingTop: Paddings.timelineEmptyTop,
  },

  // --- TYPOGRAPHY STYLES ---
  freeTimeTextSegments: {
    ...typography.getTextStyle('body-small'),
    color: themeColors.background.tertiary(),
  },
  freeTimeDurationBold: {
    ...typography.getTextStyle('body-medium'),
    color: themeColors.text.primary(),
  },
  emptyStateText: {
    ...typography.getTextStyle('body-large'),
    color: themeColors.text.secondary(),
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    ...typography.getTextStyle('body-medium'),
    color: themeColors.text.tertiary(),
    textAlign: 'center',
  },
});

