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

  // format drag time for display (snap to 5-minute intervals)
  const formatDragTime = useCallback((time: string): string => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
  }, []);

  // create dynamic styles using theme colors and typography
  const styles = useMemo(() => createStyles(themeColors, typography), [themeColors, typography]);

  // generate time slots for the timeline (e.g., 6:00, 7:00, 8:00, etc.)
  // these are used to display time labels on the left side
  const timeSlots = useMemo(() => generateTimeSlots(startHour, endHour, timeInterval), [startHour, endHour, timeInterval]);

  // filter tasks that have a time set (required for timeline positioning)
  // tasks without time won't appear on the timeline
  const tasksWithTime = useMemo(() => {
    return tasks.filter(task => task.time && task.dueDate);
  }, [tasks]);

  // use compact spacing - 0.5 pixels per minute for tight timeline
  const basePixelsPerMinute = 0.5;

  // detect task time ranges and their required heights
  // uses actual card heights measured from TimelineItem components
  const taskTimeRanges = useMemo(() => {
    const ranges = new Map<string, { startMinutes: number; endMinutes: number; requiredHeight: number }>();
    
    tasksWithTime.forEach((task) => {
      if (!task.time) return;
      const startMinutes = timeToMinutes(task.time);
      const duration = task.duration || 0;
      
      if (duration > 0) {
        // use actual card height from TimelineItem, or fallback to calculated height
        const measuredHeight = taskCardHeights.get(task.id);
        const requiredHeight = measuredHeight || calculateTaskHeight(duration, basePixelsPerMinute);
        const endMinutes = startMinutes + duration;
        ranges.set(task.id, { startMinutes, endMinutes, requiredHeight });
      }
    });
    
    return ranges;
  }, [tasksWithTime, basePixelsPerMinute, taskCardHeights]);

  // helper function to calculate position with task-aware spacing
  // uses actual card heights for task time ranges, base spacing elsewhere
  const calculatePositionWithOffsets = useCallback((time: string): number => {
    const timeMinutes = timeToMinutes(time);
    const startMinutes = startHour * 60;
    
    // check if this time is within any task's time range
    for (const [taskId, range] of taskTimeRanges.entries()) {
      if (timeMinutes >= range.startMinutes && timeMinutes <= range.endMinutes) {
        // time is within this task's range - calculate position proportionally
        const minutesIntoTask = timeMinutes - range.startMinutes;
        const totalTaskMinutes = range.endMinutes - range.startMinutes;
        
        // calculate base position of task start (without offsets)
        const taskStartBasePosition = (range.startMinutes - startMinutes) * basePixelsPerMinute;
        
        // calculate cumulative offset from tasks that end before this task starts
        let offsetBeforeTask = 0;
        for (const [otherTaskId, otherRange] of taskTimeRanges.entries()) {
          if (otherRange.endMinutes < range.startMinutes) {
            const baseHeight = (otherRange.endMinutes - otherRange.startMinutes) * basePixelsPerMinute;
            offsetBeforeTask += otherRange.requiredHeight - baseHeight;
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
      if (range.endMinutes < timeMinutes) {
        const baseHeight = (range.endMinutes - range.startMinutes) * basePixelsPerMinute;
        cumulativeOffset += range.requiredHeight - baseHeight;
      }
    }
    
    return basePosition + cumulativeOffset;
  }, [startHour, basePixelsPerMinute, taskTimeRanges]);

  // calculate total height of timeline using task-aware spacing
  const timelineHeight = useMemo(() => {
    // calculate position of the end hour using the same logic
    const endTime = `${String(endHour).padStart(2, '0')}:00`;
    return calculatePositionWithOffsets(endTime);
  }, [startHour, endHour, calculatePositionWithOffsets]);

  // generate time labels - only show start and end times for tasks
  // hide regular time labels that fall within a task's duration range
  const allTimeLabels = useMemo(() => {
    const labels: Array<{ time: string; position: number; isEndTime: boolean }> = [];
    const seenTimes = new Set<string>();

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
    timeSlots.forEach((time) => {
      if (shouldShowRegularLabel(time)) {
        const position = calculatePositionWithOffsets(time);
        labels.push({ time, position, isEndTime: false });
        seenTimes.add(time);
      }
    });

    // add start time labels for all tasks
    tasksWithTime.forEach((task) => {
      if (!task.time) return;
      
      const startPosition = calculatePositionWithOffsets(task.time);
      if (!seenTimes.has(task.time)) {
        labels.push({ time: task.time, position: startPosition, isEndTime: false });
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

      // only add if not already added
      if (!seenTimes.has(endTime)) {
        labels.push({ time: endTime, position: endPosition, isEndTime: true });
        seenTimes.add(endTime);
      }
    });

    // sort labels by position
    return labels.sort((a, b) => a.position - b.position);
  }, [timeSlots, tasksWithTime, startHour, basePixelsPerMinute, calculatePositionWithOffsets]);

  // reverse calculate position to time - accounts for task-aware spacing offsets
  // finds the time that corresponds to a given Y position
  const positionToTimeWithOffsets = useCallback((yPosition: number): string => {
    // find the time that corresponds to this position
    // iterate through possible times (every 5 minutes) and find the closest match
    let closestTime = '';
    let minDiff = Infinity;
    
    for (let hour = startHour; hour <= endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 5) {
        const testTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        const testPosition = calculatePositionWithOffsets(testTime);
        const diff = Math.abs(testPosition - yPosition);
        
        if (diff < minDiff) {
          minDiff = diff;
          closestTime = testTime;
        }
      }
    }
    
    return closestTime;
  }, [startHour, endHour, calculatePositionWithOffsets]);

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
        contentContainerStyle={[styles.scrollContent, { height: timelineHeight }]}
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
          {/* vertical line connecting all time slots */}
          <View style={[styles.timelineLine, { height: timelineHeight }]} />

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
                  startHour={startHour}
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
    paddingBottom: 40,
  },

  // time labels container on the left side
  timeLabelsContainer: {
    marginLeft: 36,
    paddingRight: 12,
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
    width: 3,
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

