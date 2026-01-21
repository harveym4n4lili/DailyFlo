/**
 * OverlappingTaskCard Component
 * 
 * Displays two overlapping tasks stacked vertically as a single card on the timeline.
 * Shows both task cards with their icons, time ranges, and titles.
 * The card height is calculated from the sum of both task card heights.
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
  // first task (earlier start time)
  task1: Task;
  // second task (later start time)
  task2: Task;
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
 * Renders two overlapping tasks stacked vertically as a single card.
 */
export default function OverlappingTaskCard({
  task1,
  task2,
  position,
  duration,
  pixelsPerMinute,
  onPress,
  onTaskComplete,
}: OverlappingTaskCardProps) {
  const themeColors = useThemeColors();
  const typography = useTypography();

  // get task colors from color palette system
  const task1Color = useMemo(() => getTaskColorValue(task1.color), [task1.color]);
  const task2Color = useMemo(() => getTaskColorValue(task2.color), [task2.color]);

  // calculate individual task card heights (minCardHeight for each)
  const task1Duration = task1.duration || 0;
  const task1HasSubtasks = useMemo(() => {
    return !!(task1.metadata?.subtasks && Array.isArray(task1.metadata.subtasks) && task1.metadata.subtasks.length > 0);
  }, [task1.metadata?.subtasks]);
  const task1MinCardHeight = getTaskCardHeight(task1Duration, task1HasSubtasks);

  const task2Duration = task2.duration || 0;
  const task2HasSubtasks = useMemo(() => {
    return !!(task2.metadata?.subtasks && Array.isArray(task2.metadata.subtasks) && task2.metadata.subtasks.length > 0);
  }, [task2.metadata?.subtasks]);
  const task2MinCardHeight = getTaskCardHeight(task2Duration, task2HasSubtasks);

  // format time ranges for display
  const task1TimeRange = useMemo(() => {
    if (!task1.time) return '';
    return formatTimeRange(task1.time, task1Duration);
  }, [task1.time, task1Duration]);

  const task2TimeRange = useMemo(() => {
    if (!task2.time) return '';
    return formatTimeRange(task2.time, task2Duration);
  }, [task2.time, task2Duration]);

  // create dynamic styles using theme colors and typography
  const styles1 = useMemo(() => createStyles(themeColors, typography, task1Color), [themeColors, typography, task1Color]);
  const styles2 = useMemo(() => createStyles(themeColors, typography, task2Color), [themeColors, typography, task2Color]);
  
  // create outer container style for the overlapping card wrapper
  const outerContainerStyle = useMemo(() => ({
    position: 'absolute' as const,
    left: 0,
    right: 0,
    flexDirection: 'column' as const,
  }), []);

  // handle task press - pass the specific task that was pressed
  const handleTask1Press = () => {
    onPress?.(task1);
  };

  const handleTask2Press = () => {
    onPress?.(task2);
  };

  return (
    <View style={[outerContainerStyle, { top: position }]}>
      {/* first task card (top) - matches TimelineItem structure exactly */}
      <View style={styles1.container}>
        {/* icon container - separate background for the icon */}
        {/* positioned on the left side in the row layout */}
        {/* height is fixed at base height, does not expand with subtasks */}
        {/* background color is task color, icon color is primary */}
        {task1.icon && (
          <View style={[styles1.iconContainer, { height: task1MinCardHeight }]}>
            <TaskIcon icon={task1.icon} color={themeColors.background.invertedPrimary()} size={20} />
          </View>
        )}

        {/* content column - contains combined container */}
        {/* positioned on the right side in the row layout */}
        <View style={styles1.content}>
          {/* combined container for task content - fixed height, stays at top */}
          {/* this is the main card that doesn't expand */}
          {/* no icon here - icon is separate */}
          <View
            style={[
              styles1.combinedContainer,
              { 
                height: task1MinCardHeight, // fixed height at base height, doesn't expand
              }
            ]}
          >
            <TouchableOpacity
              style={styles1.touchableContent}
              onPress={handleTask1Press}
              activeOpacity={0.7}
            >
              {/* task content - text only, no icon */}
              <View style={styles1.taskContent}>
                {/* text content container - layout depends on subtask presence */}
                {task1HasSubtasks ? (
                  // tasks with subtasks: centered layout (subtask button is positioned absolutely above)
                  <View style={styles1.textContainerWithSubtasks}>
                    {/* top content - time range and title */}
                    <View style={styles1.topContent}>
                      {/* time range row - time range only */}
                      <View style={styles1.timeRangeRow}>
                        {/* time range display */}
                        {task1TimeRange && (
                          <Text style={styles1.timeRange}>{task1TimeRange}</Text>
                        )}
                      </View>
                      
                      {/* task title - matches TaskCard styling */}
                      <Text
                        style={[
                          styles1.title,
                          task1.isCompleted && styles1.completedTitle, // strikethrough and dimmed color when completed
                        ]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {task1.title}
                      </Text>
                    </View>
                  </View>
                ) : (
                  // tasks without subtasks: centered layout (original layout)
                  <View style={styles1.textContainer}>
                    {/* time range row - time range only */}
                    <View style={styles1.timeRangeRow}>
                      {/* time range display */}
                      {task1TimeRange && (
                        <Text style={styles1.timeRange}>{task1TimeRange}</Text>
                      )}
                    </View>
                    
                    {/* task title - matches TaskCard styling */}
                    <Text
                      style={[
                        styles1.title,
                        task1.isCompleted && styles1.completedTitle, // strikethrough and dimmed color when completed
                      ]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {task1.title}
                    </Text>
                  </View>
                )}
              </View>
              
              {/* checkbox container - on the right side */}
              <View style={styles1.checkboxContainer} />
            </TouchableOpacity>
            
            {/* checkbox - absolutely positioned layer above task card for easy tapping */}
            <TimelineCheckbox
              task={task1}
              taskColor={task1Color}
              onTaskComplete={onTaskComplete}
              minCardHeight={task1MinCardHeight}
            />
          </View>
        </View>
      </View>

      {/* second task card (bottom) - matches TimelineItem structure exactly */}
      <View style={[styles2.container, { marginTop: 4 }]}>
        {/* icon container - separate background for the icon */}
        {/* positioned on the left side in the row layout */}
        {/* height is fixed at base height, does not expand with subtasks */}
        {/* background color is task color, icon color is primary */}
        {task2.icon && (
          <View style={[styles2.iconContainer, { height: task2MinCardHeight }]}>
            <TaskIcon icon={task2.icon} color={themeColors.background.invertedPrimary()} size={20} />
          </View>
        )}

        {/* content column - contains combined container */}
        {/* positioned on the right side in the row layout */}
        <View style={styles2.content}>
          {/* combined container for task content - fixed height, stays at top */}
          {/* this is the main card that doesn't expand */}
          {/* no icon here - icon is separate */}
          <View
            style={[
              styles2.combinedContainer,
              { 
                height: task2MinCardHeight, // fixed height at base height, doesn't expand
              }
            ]}
          >
            <TouchableOpacity
              style={styles2.touchableContent}
              onPress={handleTask2Press}
              activeOpacity={0.7}
            >
              {/* task content - text only, no icon */}
              <View style={styles2.taskContent}>
                {/* text content container - layout depends on subtask presence */}
                {task2HasSubtasks ? (
                  // tasks with subtasks: centered layout (subtask button is positioned absolutely above)
                  <View style={styles2.textContainerWithSubtasks}>
                    {/* top content - time range and title */}
                    <View style={styles2.topContent}>
                      {/* time range row - time range only */}
                      <View style={styles2.timeRangeRow}>
                        {/* time range display */}
                        {task2TimeRange && (
                          <Text style={styles2.timeRange}>{task2TimeRange}</Text>
                        )}
                      </View>
                      
                      {/* task title - matches TaskCard styling */}
                      <Text
                        style={[
                          styles2.title,
                          task2.isCompleted && styles2.completedTitle, // strikethrough and dimmed color when completed
                        ]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {task2.title}
                      </Text>
                    </View>
                  </View>
                ) : (
                  // tasks without subtasks: centered layout (original layout)
                  <View style={styles2.textContainer}>
                    {/* time range row - time range only */}
                    <View style={styles2.timeRangeRow}>
                      {/* time range display */}
                      {task2TimeRange && (
                        <Text style={styles2.timeRange}>{task2TimeRange}</Text>
                      )}
                    </View>
                    
                    {/* task title - matches TaskCard styling */}
                    <Text
                      style={[
                        styles2.title,
                        task2.isCompleted && styles2.completedTitle, // strikethrough and dimmed color when completed
                      ]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {task2.title}
                    </Text>
                  </View>
                )}
              </View>
              
              {/* checkbox container - on the right side */}
              <View style={styles2.checkboxContainer} />
            </TouchableOpacity>
            
            {/* checkbox - absolutely positioned layer above task card for easy tapping */}
            <TimelineCheckbox
              task={task2}
              taskColor={task2Color}
              onTaskComplete={onTaskComplete}
              minCardHeight={task2MinCardHeight}
            />
          </View>
        </View>
      </View>
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

