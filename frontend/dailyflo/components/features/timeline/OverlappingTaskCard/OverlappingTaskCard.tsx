/**
 * OverlappingTaskCard Component
 * 
 * Displays multiple overlapping tasks stacked vertically as a single card on the timeline.
 * Shows all task cards with their icons, time ranges, and titles.
 * The card height is calculated from the sum of all task card heights.
 * 
 * This component is used by TimelineView to render overlapping tasks as a single card.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { Task } from '@/types';
import { getTaskColorValue } from '@/utils/taskColors';
import TaskIcon from '@/components/ui/Card/TaskCard/TaskIcon';
import { formatTimeRange, getTaskCardHeight } from '../timelineUtils';
import { TimelineCheckbox } from '../TimelineItem/sections';

interface OverlappingTaskCardProps {
  // array of tasks sorted by start time (earliest first)
  tasks: Task[];
  // Y position on the timeline in pixels (start position)
  position: number;
  // combined duration in minutes (calculated from start of first to end of last)
  duration: number;
  // pixels per minute for reference
  pixelsPerMinute: number;
  // callback when task is pressed
  onPress?: (task: Task) => void;
  // callback when task completion checkbox is pressed
  onTaskComplete?: (task: Task) => void;
}

/**
 * OverlappingTaskCard Component
 * 
 * Renders multiple overlapping tasks stacked vertically as a single card.
 */
export default function OverlappingTaskCard({
  tasks = [],
  position,
  duration,
  pixelsPerMinute,
  onPress,
  onTaskComplete,
}: OverlappingTaskCardProps) {
  const themeColors = useThemeColors();
  const typography = useTypography();
  
  // ensure tasks is always an array
  const safeTasks = Array.isArray(tasks) ? tasks : [];

  // calculate task properties for each task
  const taskProperties = useMemo(() => {
    if (!safeTasks || safeTasks.length === 0) return [];
    
    return safeTasks
      .filter(task => task != null) // filter out null/undefined tasks
      .map((task, index) => {
        const taskDuration = task.duration || 0;
        const taskHasSubtasks = !!(task.metadata?.subtasks && Array.isArray(task.metadata.subtasks) && task.metadata.subtasks.length > 0);
        const taskMinCardHeight = getTaskCardHeight(taskDuration, taskHasSubtasks);
        const taskColor = getTaskColorValue(task.color);
        const taskTimeRange = task.time ? formatTimeRange(task.time, taskDuration) : '';
        
        // calculate cumulative position (sum of all previous task heights + spacing)
        let cumulativePosition = position;
        for (let i = 0; i < index; i++) {
          const prevTaskDuration = safeTasks[i].duration || 0;
          const prevTaskHasSubtasks = !!(safeTasks[i].metadata?.subtasks && Array.isArray(safeTasks[i].metadata.subtasks) && safeTasks[i].metadata.subtasks.length > 0);
          const prevTaskHeight = getTaskCardHeight(prevTaskDuration, prevTaskHasSubtasks);
          cumulativePosition += prevTaskHeight + 4; // 4px spacing between cards
        }
        
        return {
          task,
          taskDuration,
          taskHasSubtasks,
          taskMinCardHeight,
          taskColor,
          taskTimeRange,
          cumulativePosition,
        };
      }).filter(Boolean);
  }, [safeTasks, position]);

  // create dynamic styles for each task
  const taskStyles = useMemo(() => {
    return taskProperties.map(tp => 
      createStyles(themeColors, typography, tp.taskColor)
    );
  }, [taskProperties, themeColors, typography]);
  
  // create outer container style for the overlapping card wrapper
  const outerContainerStyle = useMemo(() => ({
    position: 'absolute' as const,
    left: 0,
    right: 0,
    flexDirection: 'column' as const,
  }), []);

  return (
    <View style={[outerContainerStyle, { top: position }]}>
      {taskProperties.map((tp, index) => {
        const styles = taskStyles[index];
        const isFirst = index === 0;
        
        // handle task press - pass the specific task that was pressed
        const handleTaskPress = () => {
          onPress?.(tp.task);
        };

        return (
          <View key={tp.task.id} style={[styles.container, !isFirst && { marginTop: 4 }]}>
            {/* icon container - separate background for the icon */}
            {/* positioned on the left side in the row layout */}
            {/* height is fixed at base height, does not expand with subtasks */}
            {/* background color is task color, icon color is primary */}
            {tp.task.icon && (
              <View style={[styles.iconContainer, { height: tp.taskMinCardHeight }]}>
                <TaskIcon icon={tp.task.icon} color={themeColors.background.invertedPrimary()} size={20} />
              </View>
            )}

            {/* content column - contains combined container */}
            {/* positioned on the right side in the row layout */}
            <View style={styles.content}>
              {/* combined container for task content - fixed height, stays at top */}
              {/* this is the main card that doesn't expand */}
              {/* no icon here - icon is separate */}
              <View
                style={[
                  styles.combinedContainer,
                  { 
                    height: tp.taskMinCardHeight, // fixed height at base height, doesn't expand
                  }
                ]}
              >
                <TouchableOpacity
                  style={styles.touchableContent}
                  onPress={handleTaskPress}
                  activeOpacity={0.7}
                >
                  {/* task content - text only, no icon */}
                  <View style={styles.taskContent}>
                    {/* text content container - layout depends on subtask presence */}
                    {tp.taskHasSubtasks ? (
                      // tasks with subtasks: centered layout (subtask button is positioned absolutely above)
                      <View style={styles.textContainerWithSubtasks}>
                        {/* top content - time range and title */}
                        <View style={styles.topContent}>
                          {/* time range row - time range only */}
                          <View style={styles.timeRangeRow}>
                            {/* time range display */}
                            {tp.taskTimeRange && (
                              <Text style={styles.timeRange}>{tp.taskTimeRange}</Text>
                            )}
                          </View>
                          
                          {/* task title - matches TaskCard styling */}
                          <Text
                            style={[
                              styles.title,
                              tp.task.isCompleted && styles.completedTitle, // strikethrough and dimmed color when completed
                            ]}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {tp.task.title}
                          </Text>
                        </View>
                      </View>
                    ) : (
                      // tasks without subtasks: centered layout (original layout)
                      <View style={styles.textContainer}>
                        {/* time range row - time range only */}
                        <View style={styles.timeRangeRow}>
                          {/* time range display */}
                          {tp.taskTimeRange && (
                            <Text style={styles.timeRange}>{tp.taskTimeRange}</Text>
                          )}
                        </View>
                        
                        {/* task title - matches TaskCard styling */}
                        <Text
                          style={[
                            styles.title,
                            tp.task.isCompleted && styles.completedTitle, // strikethrough and dimmed color when completed
                          ]}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {tp.task.title}
                        </Text>
                      </View>
                    )}
                  </View>
                  
                  {/* checkbox container - on the right side */}
                  <View style={styles.checkboxContainer} />
                </TouchableOpacity>
                
                {/* checkbox - absolutely positioned layer above task card for easy tapping */}
                <TimelineCheckbox
                  task={tp.task}
                  taskColor={tp.taskColor}
                  onTaskComplete={onTaskComplete}
                  minCardHeight={tp.taskMinCardHeight}
                />
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

// create dynamic styles using theme colors and typography
// matches TimelineItem styling exactly
const createStyles = (
  themeColors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useTypography>,
  taskColor: string
) => StyleSheet.create({
  // main container for the overlapping task card
  // stacks both task cards vertically
  container: {
    position: 'relative',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-start', // align to top, let content determine height
    paddingLeft: 0,
    paddingRight: 0,
  },

  // icon container - separate background for the icon
  // positioned on the left in the row layout
  // background color is task color, icon color is primary
  iconContainer: {
    width: 44, // fixed width: 20px icon + 24px padding (12px each side)
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: taskColor, // task color background for icon container
    borderRadius: 24, // matches task card border radius
    paddingHorizontal: 12, // horizontal padding for icon spacing
    marginRight: 12, // spacing between icon container and content
  },

  // content column - contains combined container
  // positioned on the right in the row layout
  content: {
    flex: 1, // take up remaining available width within container
    flexDirection: 'column', // stack combinedContainer and expandedArea vertically
    position: 'relative',
    overflow: 'hidden', // ensure content doesn't overflow during animation
    borderRadius: 24, // outer border radius for the entire card
  },
  
  // combined container for task content - fixed height, stays at top
  // this is the main card that doesn't expand
  // no icon here - icon is separate
  combinedContainer: {
    flexDirection: 'row',
    width: '100%', // ensure it takes full width of content
    alignItems: 'stretch',
    position: 'relative', // needed for absolute positioning of subtask button and checkbox
    backgroundColor: themeColors.background.elevated(),

    paddingHorizontal: 16,
    paddingVertical: 12, // top padding only (bottom padding moved to subtask space)
  },
  
  // touchable content area inside combined container
  // fills the container and handles touch events
  touchableContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
  },

  // task content container (text only) - inside combined container
  // no icon wrapper needed since icon is separate
  taskContent: {
    flex: 1,
    position: 'relative', // needed for absolute positioning of list indicator
    justifyContent: 'center', // vertically center content
  },

  // checkbox container - on the right side of task content (spacer for layout)
  checkboxContainer: {
    marginLeft: 0, // spacing between task content and checkbox
    alignItems: 'center',
    justifyContent: 'center',
    width: 18, // same width as checkbox circle to maintain layout spacing
  },

  // time range row - contains time range only
  timeRangeRow: {
    flexDirection: 'row', // horizontal layout
    alignItems: 'center',
    marginBottom: 2, // spacing between time range row and title
  },

  // text content container (time range + title)
  textContainer: {
    flex: 1,
    justifyContent: 'center', // vertically center time range and title to align with icon (for tasks without duration)
    alignSelf: 'stretch', // ensure text container fills available height
  },

  // text container for tasks WITH subtasks - top-aligned layout (subtask button is positioned absolutely at bottom)
  // applies to tasks with subtasks regardless of duration
  textContainerWithSubtasks: {
    flex: 1,
    justifyContent: 'flex-start', // align content to top (subtask button is separate layer at bottom)
    alignSelf: 'stretch', // ensure text container fills available height
  },

  // top content container - groups time range and title
  topContent: {
    // content flows naturally, no flex needed
  },

  // time range text styling - matches TaskCard metadata styling
  timeRange: {
    // use body-medium text style from typography system (matches TaskMetadata)
    ...typography.getTextStyle('body-medium'),
    color: themeColors.text.tertiary(),
    fontWeight: '900',
  },

  // task title text styling - matches TaskCard title styling
  title: {
    // use heading-4 text style from typography system (matches TaskCardContent)
    ...typography.getTextStyle('heading-4'),
    color: themeColors.text.primary(),
  },

  // completed title styling - matches TaskCard completed styling
  completedTitle: {
    textDecorationLine: 'line-through', // strikethrough for completed tasks
    color: themeColors.text.secondary(), // dimmed color for completed
  },
});

