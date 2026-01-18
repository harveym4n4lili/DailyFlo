/**
 * TimelineTask Component
 * 
 * Displays an individual task in timeline format with a card container,
 * timeline line with times, and task content (time range, title, completed subtasks).
 * 
 * Timeline Layout:
 * - Left: Timeline line with start time at top and end time at bottom (if duration exists)
 * - Right: Task card container with time range, title, and completed subtasks
 * 
 * Task heights are based on duration:
 * - Duration < 30 min: Short height
 * - Duration >= 30 min and < 1 hr: Medium height
 * - Duration >= 1 hr: Tall height
 */

import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

// types for tasks
import { Task } from '@/types';

// import color palette system for consistent theming
import { useThemeColors, useSemanticColors } from '@/hooks/useColorPalette';

// import typography system for consistent text styling
import { useTypography } from '@/hooks/useTypography';

// import utility functions for timeline formatting
import { formatTimeForDisplay, calculateEndTime } from '@/utils/timelineHelpers';
import { getTaskHeightForDuration } from '@/utils/timelineHelpers';
import { getTaskColorValue } from '@/utils/taskColors';

// import TaskIcon component
import TaskIcon from '@/components/ui/Card/TaskCard/TaskIcon';

/**
 * Props interface for TimelineTask component
 */
export interface TimelineTaskProps {
  // task data to display
  task: Task;
  // callback function called when user taps on the task
  onPress?: (task: Task) => void;
}

/**
 * TimelineTask Component
 */
export default function TimelineTask({
  task,
  onPress,
}: TimelineTaskProps) {
  // COLOR PALETTE USAGE - Getting theme-aware colors
  const themeColors = useThemeColors();
  const semanticColors = useSemanticColors();
  
  // TYPOGRAPHY USAGE - Getting typography system for consistent text styling
  const typography = useTypography();
  
  // get task color value from color palette system
  const taskColor = useMemo(() => getTaskColorValue(task.color), [task.color]);
  
  // calculate task height based on duration
  const taskHeight = useMemo(() => {
    return getTaskHeightForDuration(task.duration ?? 0);
  }, [task.duration]);
  
  // format start time for display (e.g., "8:45 AM")
  const formattedStartTime = useMemo(() => {
    if (!task.time) return '';
    return formatTimeForDisplay(task.time);
  }, [task.time]);
  
  // calculate and format end time for display (e.g., "9:15 AM")
  const formattedEndTime = useMemo(() => {
    if (!task.time || !task.duration || task.duration <= 0) return '';
    const endTime = calculateEndTime(task.time, task.duration);
    return formatTimeForDisplay(endTime);
  }, [task.time, task.duration]);
  
  // format time range for display (e.g., "8:45 AM - 9:15 AM")
  const timeRangeText = useMemo(() => {
    if (!task.time) return '';
    if (task.duration && task.duration > 0) {
      const endTime = calculateEndTime(task.time, task.duration);
      return `${formatTimeForDisplay(task.time)} - ${formatTimeForDisplay(endTime)}`;
    }
    return formatTimeForDisplay(task.time);
  }, [task.time, task.duration]);
  
  // get completed subtasks count
  const completedSubtasksCount = useMemo(() => {
    if (!task.metadata?.subtasks) return 0;
    return task.metadata.subtasks.filter(subtask => subtask.isCompleted).length;
  }, [task.metadata?.subtasks]);
  
  // get total subtasks count
  const totalSubtasksCount = useMemo(() => {
    return task.metadata?.subtasks?.length ?? 0;
  }, [task.metadata?.subtasks]);
  
  // create dynamic styles
  const styles = useMemo(() => createStyles(themeColors, typography, taskHeight), [themeColors, typography, taskHeight]);

  return (
    <View style={styles.container}>
      {/* Left side - Timeline line with times */}
      <View style={styles.timelineLineContainer}>
        {/* Start time at top */}
        {task.time && (
          <Text style={[styles.timeText, styles.startTimeText, task.isCompleted && styles.completedTimeText]}>
            {formattedStartTime}
          </Text>
        )}
        
        {/* Vertical timeline line */}
        <View style={styles.timelineLine} />
        
        {/* End time at bottom (if duration exists) */}
        {formattedEndTime && (
          <Text style={[styles.timeText, styles.endTimeText, task.isCompleted && styles.completedTimeText]}>
            {formattedEndTime}
          </Text>
        )}
      </View>
      
      {/* Right side - Task card container */}
      <TouchableOpacity
        style={[styles.cardContainer, task.isCompleted && styles.completedCardContainer]}
        onPress={() => onPress?.(task)}
        activeOpacity={0.7}
      >
        {/* Content row with icon and text */}
        <View style={styles.contentRow}>
          {/* Task icon */}
          {task.icon && (
            <View style={styles.iconWrapper}>
              <TaskIcon icon={task.icon} color={taskColor} />
            </View>
          )}
          
          {/* Content column */}
          <View style={styles.contentColumn}>
            {/* Time range */}
            {timeRangeText && (
              <Text style={[styles.timeRangeText, task.isCompleted && styles.completedText]}>
                {timeRangeText}
              </Text>
            )}
            
            {/* Task title */}
            <Text
              style={[styles.title, task.isCompleted && styles.completedTitle]}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {task.title}
            </Text>
            
            {/* Completed subtasks count */}
            {totalSubtasksCount > 0 && (
              <Text style={[styles.subtasksText, task.isCompleted && styles.completedText]}>
                {completedSubtasksCount} of {totalSubtasksCount} subtasks completed
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

// create dynamic styles using the color palette system and typography system
const createStyles = (
  themeColors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useTypography>,
  taskHeight: number
) => StyleSheet.create({
  // main container - horizontal layout for timeline line and card
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 0, // no margin, separator handles spacing
  },
  
  // left side - timeline line container
  timelineLineContainer: {
    width: 80, // fixed width for timeline line
    paddingRight: 4, // reduced spacing from card (was 12, then 8)
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    height: taskHeight, // match task card height
    position: 'relative',
    paddingLeft: 0, // no left padding, line starts at edge
  },
  
  // timeline line - vertical line connecting start and end times
  // this line matches the container background color and connects with separator
  timelineLine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: themeColors.background.elevated(), // matches card container color
  },
  
  // time text styling
  timeText: {
    ...typography.getTextStyle('body-medium'),
    color: themeColors.text.secondary(),
    backgroundColor: themeColors.background.primary(), // background to cover line
    paddingHorizontal: 4,
    zIndex: 1, // above timeline line
  },
  
  // start time styling - positioned at top
  startTimeText: {
    marginTop: 0,
  },
  
  // end time styling - positioned at bottom
  endTimeText: {
    marginBottom: 0,
  },
  
  // completed time text styling
  completedTimeText: {
    color: themeColors.text.tertiary(),
  },
  
  // right side - task card container (matches TaskCard styling)
  cardContainer: {
    flex: 1,
    backgroundColor: themeColors.background.elevated(),
    borderRadius: 20,
    padding: 16,
    minHeight: taskHeight,
    justifyContent: 'flex-start', // align content to top
  },
  
  // content row - horizontal layout for icon and content
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  
  // icon wrapper - provides spacing for icon
  iconWrapper: {
    marginRight: 16, // spacing between icon and content (matches TaskCard)
  },
  
  // content column - contains time range, title, and subtasks
  contentColumn: {
    flex: 1,
    flexDirection: 'column',
  },
  
  // completed card container styling
  completedCardContainer: {
    backgroundColor: themeColors.background.primary(),
  },
  
  // time range text styling
  timeRangeText: {
    ...typography.getTextStyle('body-medium'),
    color: themeColors.text.secondary(),
    marginBottom: 4,
  },
  
  // task title text styling
  title: {
    ...typography.getTextStyle('heading-4'),
    color: themeColors.text.primary(),
    marginBottom: 4,
  },
  
  // completed title styling
  completedTitle: {
    textDecorationLine: 'line-through',
    color: themeColors.text.secondary(),
  },
  
  // subtasks text styling
  subtasksText: {
    ...typography.getTextStyle('body-medium'),
    color: themeColors.text.tertiary(),
  },
  
  // completed text styling
  completedText: {
    color: themeColors.text.tertiary(),
  },
});
