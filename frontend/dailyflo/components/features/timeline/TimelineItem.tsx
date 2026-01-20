/**
 * TimelineItem Component
 * 
 * Displays a single task on the timeline with drag functionality.
 * Shows the task icon in a circular container, time range, and title.
 * Can be dragged vertically to change the task's start time.
 * 
 * This component is used by TimelineView to render individual tasks.
 */

import React, { useMemo, useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { Task } from '@/types';
import { getTaskColorValue } from '@/utils/taskColors';
import TaskIcon from '@/components/ui/Card/TaskCard/TaskIcon';
import { formatTimeRange, calculateTaskHeight, getTaskCardHeight, TASK_CARD_HEIGHTS } from './timelineUtils';
import { useDropdownArrowAnimation } from '@/hooks/useDropdownArrowAnimation';

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
  
  // state for subtask dropdown expansion
  const [isSubtasksExpanded, setIsSubtasksExpanded] = useState(false);
  
  // dropdown arrow animation hook
  const { arrowRotation, toggle: toggleArrow } = useDropdownArrowAnimation(false);
  
  // handle subtask button press
  const handleSubtaskPress = () => {
    const willBeExpanded = !isSubtasksExpanded;
    setIsSubtasksExpanded(willBeExpanded);
    toggleArrow(willBeExpanded);
  };
  
  // memoized check for subtasks presence - ensures component re-renders when subtasks load
  const hasSubtasks = useMemo(() => {
    return !!(task.metadata?.subtasks && Array.isArray(task.metadata.subtasks) && task.metadata.subtasks.length > 0);
  }, [
    task.metadata?.subtasks?.length ?? 0,
    task.id,
    // stringify subtasks array to detect when it changes from undefined/empty to populated
    task.metadata?.subtasks ? JSON.stringify(task.metadata.subtasks) : 'no-subtasks'
  ]);
  
  // calculate minimum card height based on duration and subtask presence
  // use fixed minimum to avoid circular dependency with pixelsPerMinute
  // pixelsPerMinute depends on cardHeight which creates a loop - use fixed value for initial render instead
  const minCardHeight = useMemo(() => {
    // use centralized height calculation function for consistency
    return getTaskCardHeight(duration, hasSubtasks);
  }, [duration, hasSubtasks]);

  // use explicit height to fill entire space - always use minimum height to match spacing calculations
  // height varies based on duration and subtask presence (64px, 80px, or 88px)
  // this ensures visual consistency with spacing calculations
  const cardHeight = minCardHeight;

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


  // measure card height when layout is calculated
  const handleContentLayout = (event: any) => {
    const { height } = event.nativeEvent.layout;
    if (measuredContentHeight !== height) {
      setMeasuredContentHeight(height);
    }
  };

  // reset height when task content changes (triggers remeasurement)
  // use subtasks length instead of array reference to avoid unnecessary re-renders during hot reload
  // include task.metadata to ensure re-render when metadata is loaded
  useEffect(() => {
    setMeasuredContentHeight(null);
    lastReportedHeight.current = null;
  }, [task.metadata?.subtasks?.length ?? 0, task.title, duration, task.id, task.metadata]);

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
           style={[
             styles.combinedContainer,
             { height: cardHeight } // use explicit height to fill entire space (64px for duration, 56px without)
           ]}
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
             {/* text content container - layout depends on subtask presence */}
             {hasSubtasks ? (
               // tasks with subtasks: centered layout (subtask button is positioned absolutely above)
               <View style={styles.textContainerWithSubtasks}>
                 {/* top content - time range and title */}
                 <View style={styles.topContent}>
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
             ) : (
               // tasks without subtasks: centered layout (original layout)
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
             )}
           </View>
           
           {/* checkbox container - on the right side */}
           <View style={styles.checkboxContainer}>
             <View 
               style={[
                 styles.checkboxCircle, 
                 // use tertiary color for unchecked border, task color for checked fill
                 task.isCompleted 
                   ? { backgroundColor: taskColor, borderColor: taskColor }
                   : { borderColor: themeColors.text.tertiary() }
               ]}
             />
           </View>
           
           {/* subtask button - absolutely positioned layer above task card */}
           {hasSubtasks && (
             <TouchableOpacity
               style={[
                 styles.subtaskButton,
                 { left: task.icon ? 56 : 16 }, // align with task content: paddingLeft (16) + icon (24) + marginRight (16) = 56px, or just padding (16) if no icon
               ]}
               onPress={handleSubtaskPress}
               activeOpacity={0.7}
             >
               <View style={styles.subtaskContainer}>
                 {/* checkbox icon on the left */}
                 <Ionicons
                   name="checkbox-outline"
                   size={14}
                   color={themeColors.text.secondary()}
                   style={styles.subtaskIcon}
                 />
                 {/* subtask count text */}
                 <Text style={styles.subtaskText}>
                   {task.metadata.subtasks.filter(st => st.isCompleted).length}/{task.metadata.subtasks.length}
                 </Text>
                 {/* dropdown arrow icon on the right - animated */}
                 <Animated.View
                   style={[
                     styles.subtaskDropdownIconContainer,
                     {
                       transform: [{ rotate: arrowRotation }],
                     },
                   ]}
                 >
                   <Ionicons
                     name="chevron-down"
                     size={12}
                     color={themeColors.text.secondary()}
                   />
                 </Animated.View>
               </View>
             </TouchableOpacity>
           )}
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
    position: 'relative', // needed for absolute positioning of subtask button
    backgroundColor: themeColors.background.elevated(),
    borderRadius: 28, // matches TaskCard borderRadius (increased by 8px)
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    position: 'relative', // needed for absolute positioning of list indicator
    justifyContent: 'center', // vertically center content to align with icon
  },

  // checkbox container - on the right side of task content
  checkboxContainer: {
    marginLeft: 0, // spacing between task content and checkbox
    alignItems: 'center',
    justifyContent: 'center',
  },

  // checkbox circle - same size as icon (24px) with border
  // unchecked: border with tertiary color, no fill
  // checked: solid circle filled with task color
  checkboxCircle: {
    width: 18, // same size as TaskIcon default size
    height: 18,
    borderRadius: 9, // make it circular (half of width/height)
    borderWidth: 1.5,
    // backgroundColor and borderColor are set dynamically based on completion state
  },

  // time range row - contains time range only
  timeRangeRow: {
    flexDirection: 'row', // horizontal layout
    alignItems: 'center',
    marginBottom: 2, // spacing between time range row and title
  },


  // subtask button - absolutely positioned layer above task card
  subtaskButton: {
    position: 'absolute',
    bottom: 12, // position at bottom with padding
    right: 0, // match container paddingRight
    zIndex: 10, // layer above task card
    // left is set dynamically based on icon presence
  },

  // subtask container - wraps subtask count text with border radius, padding, and border
  subtaskContainer: {
    flexDirection: 'row', // horizontal layout for checkbox, text, and dropdown arrow
    alignItems: 'center', // vertically center all items
    alignSelf: 'flex-start', // align to start (left)
    paddingVertical: 4, // vertical padding
    paddingHorizontal: 8, // horizontal padding
    borderRadius: 16, // border radius for rounded container
    borderWidth: 0, // no border
    borderColor: themeColors.text.tertiary(), // border color (not used when borderWidth is 0)
    backgroundColor: themeColors.background.tertiary(), // use tertiary background color from theme
  },

  // subtask icon styling (checkbox on the left)
  subtaskIcon: {
    marginRight: 4, // spacing between checkbox and text
  },

  // subtask dropdown icon container - for animation
  subtaskDropdownIconContainer: {
    marginLeft: 2, // spacing between text and dropdown arrow
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

