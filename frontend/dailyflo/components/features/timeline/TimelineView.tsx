/**
 * TimelineView Component
 * 
 * Displays tasks in a timeline format with time labels on the left side.
 * Tasks are positioned at their scheduled times and can be dragged to change times.
 * Shows connecting lines between tasks and displays icons in circular containers.
 * 
 * This component is used by the Planner screen to show tasks in a timeline view.
 */

import React, { useMemo, useState, useCallback } from 'react';
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

  // use compact spacing - 0.5 pixels per minute for tight timeline
  const basePixelsPerMinute = 0.3;

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
        // for tasks with duration, use calculated height; for tasks without duration, use minimal estimate
        const estimatedHeight = duration > 0 
          ? calculateTaskHeight(duration, basePixelsPerMinute)
          : 56; // minimal height estimate for tasks without duration
        ranges.set(task.id, { startMinutes, endMinutes, requiredHeight: estimatedHeight });
      }
    });
    
    return ranges;
  }, [tasksWithTime, basePixelsPerMinute, taskCardHeights]);

  // helper function to calculate position with task-aware spacing
  // uses actual measured card heights for all tasks (with and without duration)
  // accounts for tasks without duration by treating them as having a height at their time position
  const calculatePositionWithOffsets = useCallback((time: string): number => {
    const timeMinutes = timeToMinutes(time);
    const startMinutes = dynamicStartHour * 60;
    
    // check if this time is within any task's time range (for tasks with duration)
    for (const [taskId, range] of taskTimeRanges.entries()) {
      const totalTaskMinutes = range.endMinutes - range.startMinutes;
      
      // only check range for tasks with duration (endMinutes > startMinutes)
      if (totalTaskMinutes > 0 && timeMinutes >= range.startMinutes && timeMinutes <= range.endMinutes) {
        // time is within this task's range - calculate position proportionally
        const minutesIntoTask = timeMinutes - range.startMinutes;
        
        // calculate base position of task start (without offsets)
        const taskStartBasePosition = (range.startMinutes - startMinutes) * basePixelsPerMinute;
        
        // calculate cumulative offset from tasks that end before this task starts
        let offsetBeforeTask = 0;
        for (const [otherTaskId, otherRange] of taskTimeRanges.entries()) {
          const otherEndMinutes = otherRange.endMinutes;
          const otherStartMinutes = otherRange.startMinutes;
          
          // for tasks with duration, check if they end before this task starts
          if (otherEndMinutes > otherStartMinutes && otherEndMinutes < range.startMinutes) {
            const baseHeight = (otherEndMinutes - otherStartMinutes) * basePixelsPerMinute;
            offsetBeforeTask += otherRange.requiredHeight - baseHeight;
          }
          // for tasks without duration, check if their time is before this task starts
          else if (otherEndMinutes === otherStartMinutes && otherStartMinutes < range.startMinutes) {
            // task without duration takes up its measured height centered at its time
            // add half the height as offset since it extends above and below its time position
            offsetBeforeTask += otherRange.requiredHeight / 2;
          }
        }
        
        // task start position with offsets
        const taskStartPosition = taskStartBasePosition + offsetBeforeTask;
        
        // calculate position within task range proportionally
        const proportion = totalTaskMinutes > 0 ? minutesIntoTask / totalTaskMinutes : 0;
        return taskStartPosition + (proportion * range.requiredHeight);
      }
    }
    
    // time is not within any task range - use base spacing with offsets
    const basePosition = (timeMinutes - startMinutes) * basePixelsPerMinute;
    
    // add cumulative offset from all tasks that end before this time
    let cumulativeOffset = 0;
    for (const [taskId, range] of taskTimeRanges.entries()) {
      const rangeEndMinutes = range.endMinutes;
      const rangeStartMinutes = range.startMinutes;
      
      if (rangeEndMinutes > rangeStartMinutes) {
        // task with duration - ends at endMinutes
        if (rangeEndMinutes < timeMinutes) {
          const baseHeight = (rangeEndMinutes - rangeStartMinutes) * basePixelsPerMinute;
          cumulativeOffset += range.requiredHeight - baseHeight;
        }
      } else {
        // task without duration - centered at startMinutes
        // if task time is before this time, add half its height as offset
        if (rangeStartMinutes < timeMinutes) {
          cumulativeOffset += range.requiredHeight / 2;
        }
      }
    }
    
    return basePosition + cumulativeOffset;
  }, [dynamicStartHour, basePixelsPerMinute, taskTimeRanges]);

  // calculate total height of timeline using task-aware spacing
  const timelineHeight = useMemo(() => {
    // if no tasks, use default end hour
    if (tasksWithTime.length === 0) {
      const endTime = `${String(endHour).padStart(2, '0')}:00`;
      return calculatePositionWithOffsets(endTime);
    }
    
    // calculate position of the end hour using the same logic
    // use the latest task time or endHour, whichever is later
    let latestTime = endHour;
    const latestTask = tasksWithTime.reduce((latest, task) => {
      if (!task.time) return latest;
      if (!latest) return task;
      
      const taskMinutes = timeToMinutes(task.time);
      const latestMinutes = timeToMinutes(latest.time!);
      
      // if task has duration, use end time
      const taskEndMinutes = taskMinutes + (task.duration || 0);
      const latestEndMinutes = latestMinutes + (latest.duration || 0);
      
      return taskEndMinutes > latestEndMinutes ? task : latest;
    }, null as Task | null);
    
    if (latestTask?.time) {
      const latestMinutes = timeToMinutes(latestTask.time);
      const latestEndMinutes = latestMinutes + (latestTask.duration || 0);
      const latestHour = Math.ceil(latestEndMinutes / 60);
      latestTime = Math.max(latestHour + 1, endHour); // add 1 hour buffer
    }
    
    const endTime = `${String(latestTime).padStart(2, '0')}:00`;
    const calculatedHeight = calculatePositionWithOffsets(endTime);
    
    // ensure minimum height
    return Math.max(calculatedHeight, 200);
  }, [tasksWithTime, endHour, calculatePositionWithOffsets]);

  // calculate timeline line start and end positions (between first and last task)
  const timelineLineBounds = useMemo(() => {
    if (tasksWithTime.length === 0) {
      return { top: 0, height: timelineHeight };
    }
    
    // find first task (earliest time)
    const firstTask = tasksWithTime.reduce((earliest, task) => {
      if (!task.time) return earliest;
      if (!earliest) return task;
      
      const taskMinutes = timeToMinutes(task.time);
      const earliestMinutes = timeToMinutes(earliest.time!);
      
      return taskMinutes < earliestMinutes ? task : earliest;
    }, null as Task | null);
    
    // find last task (latest end time)
    const lastTask = tasksWithTime.reduce((latest, task) => {
      if (!task.time) return latest;
      if (!latest) return task;
      
      const taskMinutes = timeToMinutes(task.time);
      const latestMinutes = timeToMinutes(latest.time!);
      
      const taskEndMinutes = taskMinutes + (task.duration || 0);
      const latestEndMinutes = latestMinutes + (latest.duration || 0);
      
      return taskEndMinutes > latestEndMinutes ? task : latest;
    }, null as Task | null);
    
    if (!firstTask?.time || !lastTask?.time) {
      return { top: 0, height: timelineHeight };
    }
    
    // calculate start position (first task start time)
    const firstTaskStartPosition = calculatePositionWithOffsets(firstTask.time);
    
    // calculate end position (last task end time)
    const lastTaskMinutes = timeToMinutes(lastTask.time);
    const lastTaskEndMinutes = lastTaskMinutes + (lastTask.duration || 0);
    const lastTaskEndTime = minutesToTime(lastTaskEndMinutes);
    const lastTaskEndPosition = calculatePositionWithOffsets(lastTaskEndTime);
    
    return {
      top: firstTaskStartPosition,
      height: lastTaskEndPosition - firstTaskStartPosition,
    };
  }, [tasksWithTime, calculatePositionWithOffsets, timelineHeight]);

  // generate time labels - only show start and end times for tasks
  // hide regular time labels that fall within a task's duration range
  const allTimeLabels = useMemo(() => {
    const labels: Array<{ time: string; position: number; isEndTime: boolean }> = [];
    const seenTimes = new Set<string>();

    // find the first task's start position to hide labels before it
    let firstTaskStartPosition: number | null = null;
    if (tasksWithTime.length > 0) {
      const firstTask = tasksWithTime.reduce((earliest, task) => {
        if (!task.time) return earliest;
        if (!earliest) return task;
        
        const taskMinutes = timeToMinutes(task.time);
        const earliestMinutes = timeToMinutes(earliest.time!);
        
        return taskMinutes < earliestMinutes ? task : earliest;
      }, null as Task | null);
      
      if (firstTask?.time) {
        firstTaskStartPosition = calculatePositionWithOffsets(firstTask.time);
      }
    }

    // find the last task's end position to hide labels after it
    let lastTaskEndPosition: number | null = null;
    if (tasksWithTime.length > 0) {
      const lastTask = tasksWithTime.reduce((latest, task) => {
        if (!task.time) return latest;
        if (!latest) return task;
        
        const taskMinutes = timeToMinutes(task.time);
        const latestMinutes = timeToMinutes(latest.time!);
        
        const taskEndMinutes = taskMinutes + (task.duration || 0);
        const latestEndMinutes = latestMinutes + (latest.duration || 0);
        
        return taskEndMinutes > latestEndMinutes ? task : latest;
      }, null as Task | null);
      
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
      
      // check if this time is exactly a task start or end time
      for (const range of taskTimeRanges) {
        if (range.startTime === time) return false; // it's a task start, will be added separately
        if (range.end === timeMinutes) return false; // it's a task end, will be added separately
      }
      
      // check if this time falls within any task's duration range
      for (const range of taskTimeRanges) {
        // if time is between start (exclusive) and end (exclusive), hide it
        if (timeMinutes > range.start && timeMinutes < range.end) {
          return false;
        }
        
        // hide if within 2 hours (120 minutes) before task start time
        const minutesBeforeStart = range.start - timeMinutes;
        if (minutesBeforeStart > 0 && minutesBeforeStart <= 120) {
          return false;
        }
        
        // hide if within 2 hours (120 minutes) after task end time
        const minutesAfterEnd = timeMinutes - range.end;
        if (minutesAfterEnd > 0 && minutesAfterEnd <= 120) {
          return false;
        }
      }
      
      return true; // show regular label if it's not within any task range or 2-hour buffer
    };

    // add regular time slot labels only if they don't fall within task duration ranges
    // and are not before the first task or past the last task
    timeSlots.forEach((time) => {
      if (shouldShowRegularLabel(time)) {
        const position = calculatePositionWithOffsets(time);
        
        // hide if before the first task
        if (firstTaskStartPosition !== null && position < firstTaskStartPosition) {
          return;
        }
        
        // hide if past the last task
        if (lastTaskEndPosition !== null && position > lastTaskEndPosition) {
          return;
        }
        
        labels.push({ time, position, isEndTime: false });
        seenTimes.add(time);
      }
    });

    // add start time labels for all tasks
    tasksWithTime.forEach((task) => {
      if (!task.time) return;
      
      const duration = task.duration || 0;
      const startPosition = calculatePositionWithOffsets(task.time);
      
      // get card height to calculate label position
      const cardHeight = taskCardHeights.get(task.id) || (duration > 0 ? 80 : 56);
      
      // for tasks without duration, center the label at the task's center position
      // task is positioned at startPosition - (cardHeight / 2), so its center is at startPosition
      // label should be at startPosition to align with the task's center
      let labelPosition = startPosition;
      if (duration === 0) {
        // task's center is at startPosition (task top is at startPosition - cardHeight/2)
        // label should be at startPosition to align with task center
        labelPosition = startPosition;
      }
      
      // hide if before the first task (shouldn't happen for start times, but check anyway)
      // use startPosition for comparison, not labelPosition
      if (firstTaskStartPosition !== null && startPosition < firstTaskStartPosition) {
        return;
      }
      
      // hide if past the last task (shouldn't happen for start times, but check anyway)
      // use startPosition for comparison, not labelPosition
      if (lastTaskEndPosition !== null && startPosition > lastTaskEndPosition) {
        return;
      }
      
      if (!seenTimes.has(task.time)) {
        labels.push({ time: task.time, position: labelPosition, isEndTime: false });
        seenTimes.add(task.time);
      }
    });

    // add end time labels for tasks with duration
    // position is calculated based on the actual end time with offsets
    // the space between start and end positions will be used as the card height
    tasksWithTime.forEach((task) => {
      if (!task.time || !task.duration || task.duration === 0) return;

      // calculate end time based on start time + duration
      const startMinutes = timeToMinutes(task.time);
      const endMinutes = startMinutes + task.duration;
      const endTime = minutesToTime(endMinutes);
      
      // calculate end position using the end time with offsets
      // this ensures the end label aligns with the timeline position for that time
      const endPosition = calculatePositionWithOffsets(endTime);

      // hide if past the last task (shouldn't happen for the last task's end time, but check anyway)
      if (lastTaskEndPosition !== null && endPosition > lastTaskEndPosition) {
        return;
      }

      // only add if not already added
      if (!seenTimes.has(endTime)) {
        labels.push({ time: endTime, position: endPosition, isEndTime: true });
        seenTimes.add(endTime);
      }
    });

    // sort labels by position
    return labels.sort((a, b) => a.position - b.position);
  }, [timeSlots, tasksWithTime, dynamicStartHour, basePixelsPerMinute, calculatePositionWithOffsets, taskCardHeights]);

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
  }, []);

  return (
    <View style={styles.container}>
      {/* scrollable timeline content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent, 
          { minHeight: timelineHeight + 220 } // timelineHeight + paddingTop (20) + paddingBottom (200)
        ]}
        showsVerticalScrollIndicator={true}
      >
        {/* time labels column on the left */}
        <View style={styles.timeLabelsContainer}>
          {allTimeLabels.map((label, index) => (
            <TimeLabel
              key={`${label.time}-${index}-${label.isEndTime ? 'end' : 'start'}`}
              time={label.time}
              position={label.position}
              isEndTime={label.isEndTime}
            />
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
            tasksWithTime.map((task) => {
              const startPosition = calculatePositionWithOffsets(task.time!);
              const duration = task.duration || 0;
              
              // get card height from state (measured by TimelineItem)
              // fallback to estimated height if not yet measured
              const cardHeight = taskCardHeights.get(task.id) || (duration > 0 ? 80 : 56);
              
              // calculate position based on duration
              let position = startPosition; // position for tasks with duration (top-aligned)
              if (duration === 0) {
                // center-align: position the task so its vertical center aligns with timeline
                position = startPosition - (cardHeight / 2);
              }
              
              return (
                <TimelineItem
                  key={task.id}
                  task={task}
                  position={position}
                  duration={duration}
                  pixelsPerMinute={basePixelsPerMinute}
                  startHour={dynamicStartHour}
                  onHeightMeasured={(height: number) => handleHeightMeasured(task.id, height)}
                  onDrag={(newY) => {
                    // newY is the top position of the task
                    // for tasks without duration, convert top position to center position (timeline position)
                    const timelineY = duration > 0 ? newY : newY + (cardHeight / 2);
                    handleTaskDrag(task.id, timelineY);
                  }}
                  onDragStart={() => {
                    // drag started - will be updated by onDragPositionChange
                  }}
                  onDragPositionChange={(yPosition) => {
                    // yPosition is the top position of the task
                    // for tasks without duration, convert top position to center position (timeline position)
                    const timelineY = duration > 0 ? yPosition : yPosition + (cardHeight / 2);
                    // calculate time from timeline position using offset-aware function
                    const time = positionToTimeWithOffsets(timelineY);
                    setDragState({ yPosition: timelineY, time });
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
    paddingTop: 20,
    paddingBottom: 200, // increased bottom padding to allow scrolling further down
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

