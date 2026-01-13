/**
 * TimelineItem Component
 * 
 * Displays a single task on the timeline with drag functionality.
 * Shows the task icon in a circular container, time range, and title.
 * Can be dragged vertically to change the task's start time.
 * 
 * This component is used by TimelineView to render individual tasks.
 */

import React, { useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { Task } from '@/types';
import { getTaskColorValue } from '@/utils/taskColors';
import TaskIcon from '@/components/ui/Card/TaskCard/TaskIcon';
import { formatTimeRange, calculateTaskHeight } from './timelineUtils';

interface TimelineItemProps {
  // task to display
  task: Task;
  // Y position on the timeline in pixels (start position)
  position: number;
  // duration in minutes
  duration: number;
  // pixels per minute for reference
  pixelsPerMinute: number;
  // start hour of the timeline (e.g., 6 for 6 AM)
  startHour?: number;
  // callback when card height is measured/calculated
  onHeightMeasured?: (height: number) => void;
  // callback when task is dragged to a new position
  onDrag: (newY: number) => void;
  // callback when drag position changes (for showing time label)
  // only passes yPosition, time is calculated in parent
  onDragPositionChange?: (yPosition: number) => void;
  // callback when drag starts
  onDragStart?: () => void;
  // callback when drag ends
  onDragEnd?: () => void;
  // callback when task is pressed
  onPress?: () => void;
}

/**
 * TimelineItem Component
 * 
 * Renders a task item on the timeline with drag functionality.
 * Shows icon in circular container, time range, and title.
 */
export default function TimelineItem({
  task,
  position,
  duration,
  pixelsPerMinute,
  startHour = 6,
  onHeightMeasured,
  onDrag,
  onDragPositionChange,
  onDragStart,
  onDragEnd,
  onPress,
}: TimelineItemProps) {
  const themeColors = useThemeColors();
  const typography = useTypography();

  // get task color value from color palette system
  const taskColor = useMemo(() => getTaskColorValue(task.color), [task.color]);

  // create dynamic styles using theme colors and typography
  const styles = useMemo(() => createStyles(themeColors, typography, taskColor), [themeColors, typography, taskColor]);

  // animated value for drag position (starts at 0, tracks drag offset)
  const translateY = useRef(new Animated.Value(0)).current;
  
  // track the base position (initial position before drag)
  const basePosition = useRef(position);

  // track if currently dragging
  const [isDragging, setIsDragging] = React.useState(false);
  
  // use ref to track dragging state for listener
  const isDraggingRef = React.useRef(false);

  // calculate card height based on content
  // for tasks with duration, use calculated height; for tasks without duration, use minimal height
  const cardHeight = useMemo(() => {
    if (duration > 0) {
      // for tasks with duration, calculate based on duration with minimum
      return Math.max(80, calculateTaskHeight(duration, pixelsPerMinute));
    } else {
      // tasks without duration: minimal height (just content)
      // padding (16 top + 16 bottom) + icon height (~24) + some margin = ~56
      return 56;
    }
  }, [duration, pixelsPerMinute]);

  // notify parent of card height when it changes
  // use ref to track last reported height to avoid infinite loops
  const lastReportedHeight = useRef<number | null>(null);
  const onHeightMeasuredRef = useRef(onHeightMeasured);
  
  // keep ref updated
  useEffect(() => {
    onHeightMeasuredRef.current = onHeightMeasured;
  }, [onHeightMeasured]);
  
  useEffect(() => {
    // only report if height actually changed
    if (onHeightMeasuredRef.current && cardHeight !== lastReportedHeight.current) {
      lastReportedHeight.current = cardHeight;
      onHeightMeasuredRef.current(cardHeight);
    }
  }, [cardHeight]);

  // use the calculated card height
  const taskHeight = cardHeight;

  // update base position when prop changes
  useEffect(() => {
    basePosition.current = position;
    translateY.setValue(0); // reset translation when position changes
  }, [position, translateY]);

  // listen to translateY changes to update drag position
  useEffect(() => {
    const listenerId = translateY.addListener(({ value }) => {
      if (isDraggingRef.current) {
        // calculate current Y position
        const currentY = basePosition.current + value;
        
        // notify parent of drag position change - parent will calculate time with offsets
        if (onDragPositionChange) {
          onDragPositionChange(currentY);
        }
      }
    });

    return () => {
      translateY.removeListener(listenerId);
    };
  }, [translateY, onDragPositionChange]);

  // format time range for display (e.g., "9:00 AM - 10:30 AM")
  const timeRangeText = useMemo(() => {
    if (!task.time) return '';
    return formatTimeRange(task.time, duration);
  }, [task.time, duration]);

  // handle pan gesture for dragging
  // translationY tracks how far the user has dragged from the start
  const handleGestureEvent = Animated.event(
    [{ nativeEvent: { translationY: translateY } }],
    { useNativeDriver: true }
  );

  // handle when gesture state changes
  const handleHandlerStateChange = (event: any) => {
    // when gesture becomes active (after hold duration), provide haptic feedback
    if (event.nativeEvent.state === State.ACTIVE && event.nativeEvent.oldState === State.BEGAN) {
      // provide light haptic feedback when drag activates
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setIsDragging(true);
      isDraggingRef.current = true;
      
      // notify parent that drag started
      if (onDragStart) {
        onDragStart();
      }
      
      // notify parent of initial drag position
      // basePosition already accounts for center alignment if no duration
      if (onDragPositionChange) {
        onDragPositionChange(basePosition.current);
      }
    }
    
    // when gesture ends - update task time
    if (event.nativeEvent.oldState === State.ACTIVE) {
      // gesture ended - calculate new absolute position
      // basePosition is the original position (top for tasks without duration, start for tasks with duration)
      // translationY is the drag offset
      const newY = basePosition.current + event.nativeEvent.translationY;
      
      // ensure position is not negative
      const clampedY = Math.max(0, newY);
      
      // call onDrag callback with new position
      // TimelineView will handle converting to timeline position if needed
      onDrag(clampedY);
      
      // reset drag state
      setIsDragging(false);
      isDraggingRef.current = false;
      
      // notify parent that drag ended
      if (onDragEnd) {
        onDragEnd();
      }
      
      // reset translation animation (position will be updated via prop)
      translateY.setValue(0);
    }
  };

  return (
    <PanGestureHandler
      onGestureEvent={handleGestureEvent}
      onHandlerStateChange={handleHandlerStateChange}
      activeOffsetY={[-10, 10]} // require 10px movement before activating
    >
        <Animated.View
          style={[
            styles.container,
            {
              top: position, // no offset needed since padding is removed
              height: taskHeight, // use exact height instead of minHeight to enforce card size
              transform: [{ translateY }],
            },
          ]}
        >
          {/* task content container */}
          <TouchableOpacity
            style={styles.taskContent}
            onPress={onPress}
            activeOpacity={0.7}
          >
            {/* icon - matches TaskCard styling (no circular container) */}
            {task.icon && (
              <View style={styles.iconWrapper}>
                <TaskIcon icon={task.icon} color={taskColor} />
              </View>
            )}

            {/* text content container */}
            <View style={[
              styles.textContainer,
              duration === 0 && styles.textContainerCentered // center content for tasks without duration
            ]}>
              {/* time range display */}
              {timeRangeText && (
                <Text style={styles.timeRange}>{timeRangeText}</Text>
              )}
              
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
          </TouchableOpacity>
        </Animated.View>
      </PanGestureHandler>
  );
}

// create dynamic styles using theme colors and typography
const createStyles = (
  themeColors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useTypography>,
  taskColor: string
) => StyleSheet.create({
  // main container for the task item
  // positioned so the icon center aligns with the timeline position
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'stretch', // stretch items to fill container height
    paddingLeft: 0,
    paddingRight: 16,
  },

  // connecting line from timeline to task icon
  // positioned at icon center

  // task content container (icon + text)
  // matches TaskCard spacing exactly
  taskContent: {
    flexDirection: 'row',
    alignItems: 'center', // center icon vertically
    flex: 1,
    backgroundColor: themeColors.background.elevated(),
    borderRadius: 28, // matches TaskCard borderRadius (increased by 8px)
    paddingTop: 16, // matches TaskCard vertical padding
    paddingBottom: 16, // matches TaskCard vertical padding
    paddingLeft: 16, // matches TaskCard horizontal padding
    paddingRight: 0, // no right padding needed in timeline (no completion indicator)
    alignSelf: 'stretch', // ensure content fills the container height
  },


  // icon wrapper - matches TaskCard styling (no circular container)
  iconWrapper: {
    marginRight: 16, // spacing between icon and content (matches TaskCard)
  },

  // text content container (time range + title)
  textContainer: {
    flex: 1,
    justifyContent: 'flex-start', // align content to top for tasks with duration
    alignSelf: 'stretch', // ensure text container fills available height
  },

  // centered text container for tasks without duration
  textContainerCentered: {
    justifyContent: 'center', // center content vertically for tasks without duration
  },

  // time range text styling - matches TaskCard metadata styling
  timeRange: {
    // use body-medium text style from typography system (matches TaskMetadata)
    ...typography.getTextStyle('body-medium'),
    color: themeColors.text.tertiary(),
    marginBottom: 2, // spacing between time range and title (matches TaskCard)
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

