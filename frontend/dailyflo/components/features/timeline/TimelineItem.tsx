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
import { Ionicons } from '@expo/vector-icons';
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

  // state to store measured content height (includes padding)
  const [measuredContentHeight, setMeasuredContentHeight] = React.useState<number | null>(null);
  
  // calculate minimum card height - same for all tasks (with or without duration)
  // use fixed minimum (56px) to avoid circular dependency with pixelsPerMinute
  // pixelsPerMinute depends on cardHeight which creates a loop - use fixed value for initial render instead
  const minCardHeight = useMemo(() => {
    // same minimum height for all tasks regardless of duration
    // padding (16 top + 16 bottom) + icon height (~24) + some margin = ~56
    return 56;
  }, [duration]);

  // use measured height if available, otherwise use minimum for initial render
  // measured height already includes padding from the combinedContainer
  // once measured, always use measured height to let content determine size
  const cardHeight = measuredContentHeight ?? minCardHeight;

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

  // handle layout measurement to get actual content height
  const handleContentLayout = (event: any) => {
    const { height } = event.nativeEvent.layout;
    // height includes padding (16 top + 16 bottom = 32px padding)
    // use actual measured height without enforcing minimum - let content determine size
    if (measuredContentHeight !== height) {
      setMeasuredContentHeight(height);
      // notify parent of new height
      if (onHeightMeasuredRef.current) {
        onHeightMeasuredRef.current(height);
      }
    }
  };

  // reset measured height when task content changes (e.g., subtasks added/removed)
  // also reset when duration changes to ensure height is remeasured for spacing calculations
  useEffect(() => {
    setMeasuredContentHeight(null);
  }, [task.metadata?.subtasks, task.title, duration]);

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
            // no height constraint - let content determine height naturally
            transform: [{ translateY }],
          },
        ]}
      >
         {/* combined container for icon and task content */}
         <TouchableOpacity
           style={styles.combinedContainer}
           onPress={onPress}
           activeOpacity={0.7}
           onLayout={handleContentLayout}
         >
           {/* icon - inside the combined container */}
           {task.icon && (
             <View style={styles.iconWrapper}>
               <TaskIcon icon={task.icon} color={taskColor} />
             </View>
           )}

           {/* task content - inside the combined container */}
           <View style={styles.taskContent}>
             {/* text content container */}
             <View style={[
               styles.textContainer,
               duration === 0 && styles.textContainerCentered // center content for tasks without duration
             ]}>
               {/* time range row - time range on left, list indicator on right */}
               <View style={styles.timeRangeRow}>
                 {/* time range display */}
                 {timeRangeText && (
                   <Text style={styles.timeRange}>{timeRangeText}</Text>
                 )}
                 
                 {/* list group indicator - same row as time range, aligned right */}
                 <View style={styles.listIndicator}>
                   {/* folder icon for list/inbox indication */}
                   <Ionicons
                     name="folder-outline"
                     size={12}
                     color={themeColors.text.tertiary()}
                     style={styles.listIndicatorIcon}
                   />
                   {/* list/inbox text - conditionally shows 'List' or 'Inbox' based on listId */}
                   <Text style={styles.listIndicatorText}>
                     {task.listId ? 'List' : 'Inbox'}
                   </Text>
                 </View>
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

               {/* subtask indicator - shows completion count if subtasks exist */}
               {task.metadata?.subtasks && task.metadata.subtasks.length > 0 && (
                 <View style={styles.subtaskIndicator}>
                   {/* checkmark icon */}
                   <Ionicons
                     name="checkmark"
                     size={12}
                     color={themeColors.text.secondary()}
                     style={styles.subtaskIcon}
                   />
                   {/* subtask count text */}
                   <Text style={styles.subtaskText}>
                     {task.metadata.subtasks.filter(st => st.isCompleted).length}/{task.metadata.subtasks.length} Subtasks
                   </Text>
                 </View>
               )}
             </View>
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
    alignItems: 'flex-start', // align to top, let content determine height
    paddingLeft: 0,
    paddingRight: 16,
  },

  // combined container for icon and task content
  combinedContainer: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'stretch',
    backgroundColor: themeColors.background.elevated(),
    borderRadius: 28, // matches TaskCard borderRadius (increased by 8px)
    paddingTop: 16, // matches TaskCard vertical padding
    paddingBottom: 16, // matches TaskCard vertical padding
    paddingLeft: 16, // matches TaskCard horizontal padding
    paddingRight: 20, // right padding
  },

  // icon wrapper - inside combined container
  iconWrapper: {
    marginRight: 16, // spacing between icon and content (matches TaskCard)
    alignItems: 'center',
    justifyContent: 'center',
  },

  // task content container (text only) - inside combined container
  taskContent: {
    flex: 1,
    // no height constraints - let content determine height naturally
  },

  // time range row - contains time range and list indicator side by side
  timeRangeRow: {
    flexDirection: 'row', // horizontal layout
    alignItems: 'center',
    justifyContent: 'space-between', // time range on left, list indicator on right
    marginBottom: 2, // spacing between time range row and title
  },

  // list group indicator - in same row as time range, aligned right
  listIndicator: {
    flexDirection: 'row', // horizontal layout for icon and text
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },

  // list indicator icon styling
  listIndicatorIcon: {
    marginRight: 4,
  },

  // list indicator text styling - matches TaskIndicators styling
  listIndicatorText: {
    // use the body-medium text style from typography system (12px, regular, satoshi font)
    ...typography.getTextStyle('body-medium'),
    // use tertiary text color for list indicator - matches TaskIndicators
    color: themeColors.text.tertiary(),
    fontWeight: '900', // match TaskIndicators font weight
  },

  // subtask indicator - shows completion count
  subtaskIndicator: {
    flexDirection: 'row', // horizontal layout for icon and text
    alignItems: 'center',
    marginTop: 4, // spacing from title
  },

  // subtask icon styling
  subtaskIcon: {
    marginRight: 4,
  },

  // subtask text styling - matches TaskMetadata styling
  subtaskText: {
    // use the body-medium text style from typography system (12px, regular, satoshi font)
    ...typography.getTextStyle('body-medium'),
    // use secondary text color - lighter than tertiary
    color: themeColors.text.secondary(),
    fontWeight: '900', // match TaskMetadata font weight
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

