/**
 * DragOverlay Component
 * 
 * Renders a visual overlay that follows the user's thumb during drag operations.
 * The overlay is a copy of the dragged task card that moves with the gesture,
 * while the actual task card stays in place with a visual indicator.
 * 
 * This component is used by TimelineView to show the drag preview.
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import AnimatedReanimated, { useAnimatedStyle, useSharedValue, withSpring, SharedValue } from 'react-native-reanimated';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { Task } from '@/types';
import { getTaskColorValue } from '@/utils/taskColors';
import TaskIcon from '@/components/ui/Card/TaskCard/TaskIcon';
import { formatTimeRange, getTaskCardHeight } from './timelineUtils';

interface DragOverlayProps {
  // the task being dragged
  task: Task;
  // Y position where the overlay should be rendered (follows thumb)
  // this value updates as the drag position changes
  yPosition: number;
  // height of the task card (matches the dragged task)
  cardHeight: number;
  // duration of the task in minutes
  duration: number;
  // animated position shared value (optional - if provided, uses this instead of creating own)
  // when provided, overlay and time label will be synchronized
  animatedPosition?: SharedValue<number>;
}

/**
 * DragOverlay Component
 * 
 * Renders a copy of the task card that follows the drag gesture.
 * The overlay has the same appearance and size as the original task card.
 */
export default function DragOverlay({
  task,
  yPosition,
  cardHeight,
  duration,
  animatedPosition,
}: DragOverlayProps) {
  // safety check: don't render if task is not available
  // this prevents errors if dragState exists but task is undefined
  if (!task) {
    return null;
  }
  
  const themeColors = useThemeColors();
  const typography = useTypography();
  
  // get task color value from color palette system
  const taskColor = getTaskColorValue(task.color);
  
  // create dynamic styles using theme colors and typography
  const styles = createStyles(themeColors, typography, taskColor);
  
  // calculate minimum card height (base height without expansion)
  // this matches the calculation in TimelineItem
  const hasSubtasks = !!(task.metadata?.subtasks && Array.isArray(task.metadata.subtasks) && task.metadata.subtasks.length > 0);
  const minCardHeight = getTaskCardHeight(duration, hasSubtasks);
  
  // format time range for display (e.g., "9:00 AM - 10:30 AM")
  const timeRangeText = task.time ? formatTimeRange(task.time, duration) : '';
  
  // use provided animated position if available, otherwise create own shared value
  // when animatedPosition is provided, overlay and time label will be synchronized
  const internalOverlayY = useSharedValue(yPosition);
  const overlayY = animatedPosition || internalOverlayY;
  
  // initialize internal shared value when not using provided animatedPosition
  // when animatedPosition is provided, parent (TimelineView) handles all updates via useLayoutEffect
  // this ensures position is set synchronously before render, preventing flicker
  useEffect(() => {
    if (!animatedPosition) {
      // when using internal shared value, initialize it
      internalOverlayY.value = yPosition;
    }
  }, []); // only run on mount
  
  // update shared value when yPosition prop changes (during drag)
  // only update if we're using internal shared value (not when using provided animatedPosition)
  // when animatedPosition is provided, parent (TimelineView) handles updates
  useEffect(() => {
    if (!animatedPosition) {
      // use spring animation for iOS - feels more natural and smooth
      // parameters optimized for drag: high stiffness for responsiveness, moderate damping for smoothness
      if (Platform.OS === 'ios') {
        internalOverlayY.value = withSpring(yPosition, {
          damping: 20, // moderate damping for smooth but not bouncy feel
          stiffness: 400, // high stiffness for immediate, responsive movement
          mass: 0.3, // low mass for light, quick response
          overshootClamping: false, // allow slight overshoot for natural feel
        });
      } else {
        // for Android, use direct assignment for immediate response
        internalOverlayY.value = yPosition;
      }
    }
  }, [yPosition, internalOverlayY, animatedPosition]);
  
  // create animated style for overlay position using reanimated
  // uses the shared value (either provided or internal) for smooth movement
  // this runs on native thread for smooth 60fps performance
  const animatedOverlayStyle = useAnimatedStyle(() => {
    return {
      top: overlayY.value, // use the shared value which is animated with spring on iOS
    };
  });
  
  return (
    <AnimatedReanimated.View
      style={[
        styles.overlayContainer,
        animatedOverlayStyle, // animated position that follows thumb
        {
          height: cardHeight, // use the actual card height from drag state
        },
      ]}
      pointerEvents="none" // overlay doesn't intercept touches - gestures pass through
    >
      {/* icon container - separate background for the icon */}
      {/* matches the layout from TimelineItem */}
      {task.icon && (
        <View style={[styles.iconContainer, { height: minCardHeight }]}>
          <TaskIcon icon={task.icon} color={themeColors.background.invertedPrimary()} size={20} />
        </View>
      )}
      
      {/* content column - contains task content */}
      {/* matches the layout from TimelineItem */}
      <View
        style={[
          styles.content,
          {
            height: cardHeight, // use the actual card height
          },
        ]}
      >
        {/* combined container for task content - fixed height */}
        <View
          style={[
            styles.combinedContainer,
            {
              height: minCardHeight, // fixed height at base height
            },
          ]}
        >
          {/* task content - text only, no icon */}
          <View style={styles.taskContent}>
            {/* text content container */}
            <View style={styles.textContainer}>
              {/* time range row - time range only */}
              <View style={styles.timeRangeRow}>
                {/* time range display */}
                {timeRangeText && (
                  <Text style={styles.timeRange}>{timeRangeText}</Text>
                )}
              </View>
              
              {/* task title - matches TaskCard styling */}
              <Text
                style={[
                  styles.title,
                  task.isCompleted && styles.completedTitle, // strikethrough and dimmed color when completed
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {task.title}
              </Text>
            </View>
          </View>
          
          {/* checkbox container - spacer for layout */}
          <View style={styles.checkboxContainer} />
        </View>
      </View>
    </AnimatedReanimated.View>
  );
}

// create dynamic styles using theme colors and typography
// matches the styles from TimelineItem for consistent appearance
const createStyles = (
  themeColors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useTypography>,
  taskColor: string
) => StyleSheet.create({
  // overlay container - positioned absolutely to follow thumb
  // matches the container style from TimelineItem
  overlayContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingLeft: 0,
    paddingRight: 16,
    zIndex: 2000, // high z-index to appear above all task cards
  },
  
  // icon container - separate background for the icon
  // matches the icon container from TimelineItem
  iconContainer: {
    width: 44, // fixed width: 20px icon + 24px padding (12px each side)
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: taskColor, // task color background for icon container
    borderRadius: 24, // matches task card border radius
    paddingHorizontal: 12, // horizontal padding for icon spacing
    marginRight: 12, // spacing between icon container and content
  },
  
  // content column - contains task content
  // matches the content style from TimelineItem
  content: {
    flex: 1, // take up remaining available width within container
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 24, // outer border radius for the entire card
  },
  
  // combined container for task content - fixed height
  // matches the combined container from TimelineItem
  combinedContainer: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'stretch',
    position: 'relative',
    backgroundColor: themeColors.background.elevated(),
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  
  // task content container (text only)
  // matches the task content style from TimelineItem
  taskContent: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center', // vertically center content
  },
  
  // checkbox container - spacer for layout
  // matches the checkbox container from TimelineItem
  checkboxContainer: {
    marginLeft: 0,
    alignItems: 'center',
    justifyContent: 'center',
    width: 18, // same width as checkbox circle to maintain layout spacing
  },
  
  // time range row - contains time range only
  // matches the time range row from TimelineItem
  timeRangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2, // spacing between time range row and title
  },
  
  // text content container (time range + title)
  // matches the text container from TimelineItem
  textContainer: {
    flex: 1,
    justifyContent: 'center', // vertically center time range and title
    alignSelf: 'stretch',
  },
  
  // time range text styling - matches TaskCard metadata styling
  // matches the time range style from TimelineItem
  timeRange: {
    ...typography.getTextStyle('body-medium'),
    color: themeColors.text.tertiary(),
    fontWeight: '900',
  },
  
  // task title text styling - matches TaskCard title styling
  // matches the title style from TimelineItem
  title: {
    ...typography.getTextStyle('heading-4'),
    color: themeColors.text.primary(),
  },
  
  // completed title styling - matches TaskCard completed styling
  // matches the completed title style from TimelineItem
  completedTitle: {
    textDecorationLine: 'line-through', // strikethrough for completed tasks
    color: themeColors.text.secondary(), // dimmed color for completed
  },
});

