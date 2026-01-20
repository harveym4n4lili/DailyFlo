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
// Redux imports for updating subtasks
import { useAppDispatch } from '@/store';
import { updateTask } from '@/store/slices/tasks/tasksSlice';

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
  // callback when task completion checkbox is pressed
  onTaskComplete?: (task: Task) => void;
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
  onTaskComplete,
}: TimelineItemProps) {
  const themeColors = useThemeColors();
  const typography = useTypography();
  
  // get Redux dispatch function for updating tasks
  const dispatch = useAppDispatch();

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
  
  // animated value for checkbox fill animation (0 = unchecked/grey, 1 = checked/task color)
  const checkboxFillAnimation = useRef(new Animated.Value(task.isCompleted ? 1 : 0)).current;
  
  // animated value for checkbox scale animation (for tap feedback)
  const checkboxScaleAnimation = useRef(new Animated.Value(1)).current;
  
  // animated value for card height expansion - initialized with default height, will be updated when minCardHeight is calculated
  const cardHeightAnimation = useRef(new Animated.Value(64)).current; // default to 64px, will be updated
  
  // animated value for expanded area height (0 when collapsed, 32px per subtask + 12px padding when expanded)
  const expandedAreaHeightAnimation = useRef(new Animated.Value(0)).current;
  
  // update animation when task completion status changes
  useEffect(() => {
    Animated.timing(checkboxFillAnimation, {
      toValue: task.isCompleted ? 1 : 0,
      duration: 200, // animation duration in milliseconds
      useNativeDriver: false, // backgroundColor animation doesn't support native driver
    }).start();
  }, [task.isCompleted, checkboxFillAnimation]);
  
  // handle subtask button press - toggle expansion and animate card height
  const handleSubtaskPress = () => {
    // provide light haptic feedback when subtask button is pressed
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const willBeExpanded = !isSubtasksExpanded;
    setIsSubtasksExpanded(willBeExpanded);
    toggleArrow(willBeExpanded);
    
    // the card height will automatically update via cardHeight calculation
    // and this will be reported to parent via animation listener below
  };
  
  // handle subtask toggle - complete/uncomplete a subtask
  const handleSubtaskToggle = async (subtaskId: string) => {
    // provide light haptic feedback when subtask is toggled
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // check if task has subtasks
    if (!task.metadata?.subtasks) return;
    
    // create updated subtasks array with the toggled subtask
    const updatedSubtasks = task.metadata.subtasks.map(subtask =>
      subtask.id === subtaskId
        ? { ...subtask, isCompleted: !subtask.isCompleted }
        : subtask
    );
    
    // prepare updates object with modified subtasks
    const updates = {
      id: task.id,
      metadata: {
        ...task.metadata,
        subtasks: updatedSubtasks,
      },
    };
    
    // dispatch updateTask action to Redux store to update the subtask
    // this will trigger the async thunk that updates the task via API
    try {
      await dispatch(updateTask({
        id: task.id,
        updates,
      })).unwrap();
    } catch (error) {
      console.error('Failed to update subtask:', error);
    }
  };
  
  // handle checkbox press - complete/uncomplete task and all subtasks
  const handleCheckboxPress = () => {
    // provide light haptic feedback when checkbox is pressed
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // animate scale down and back up for visual feedback
    // scale down to 0.85 (15% smaller) then back to 1.0
    Animated.sequence([
      Animated.timing(checkboxScaleAnimation, {
        toValue: 0.85,
        duration: 100, // quick scale down
        useNativeDriver: true, // scale animation supports native driver for better performance
      }),
      Animated.timing(checkboxScaleAnimation, {
        toValue: 1.0,
        duration: 100, // quick scale back up
        useNativeDriver: true,
      }),
    ]).start();
    
    if (onTaskComplete) {
      onTaskComplete(task);
    }
  };

  // handle main task press - open task detail view with haptic feedback
  // this wrapper ensures haptic feedback fires even if PanGestureHandler intercepts the touch
  const handleTaskPress = () => {
    // provide medium haptic feedback when tapping the main timeline task card
    // this mirrors the subtask and checkbox haptics so the whole card feels responsive
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);

    // call parent callback so planner screen can open the task detail modal
    if (onPress) {
      onPress();
    }
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
  
  // calculate subtask count for dynamic expansion height
  // each subtask adds 32px to the expanded height
  const subtasksCount = useMemo(() => {
    return task.metadata?.subtasks?.length ?? 0;
  }, [task.metadata?.subtasks?.length]);
  
  // calculate minimum card height based on duration and subtask presence
  // use fixed minimum to avoid circular dependency with pixelsPerMinute
  // pixelsPerMinute depends on cardHeight which creates a loop - use fixed value for initial render instead
  const minCardHeight = useMemo(() => {
    // use centralized height calculation function for consistency
    return getTaskCardHeight(duration, hasSubtasks);
  }, [duration, hasSubtasks]);

  // calculate card height - base height plus 32px per subtask plus 12px padding when subtasks are expanded
  // allow expansion above 88px when subtasks are expanded (base can be 88px, so expanded would be base + (subtasksCount * 32) + 12)
  const cardHeight = useMemo(() => {
    const baseHeight = minCardHeight;
    // calculate expanded height: 32px per subtask + 12px padding when expanded
    const expandedHeight = isSubtasksExpanded ? baseHeight + (subtasksCount * 36) + 4 : baseHeight;
    // no cap - allow expansion above 88px when subtasks are expanded
    return expandedHeight;
  }, [minCardHeight, isSubtasksExpanded, subtasksCount]);
  
  // update animation value when minCardHeight changes (for initial render or when task properties change)
  useEffect(() => {
    // only update if minCardHeight is a valid number
    if (typeof minCardHeight === 'number' && minCardHeight > 0) {
      cardHeightAnimation.setValue(minCardHeight);
    }
  }, [minCardHeight, cardHeightAnimation]);
  
  // animate card height when expansion state changes
  useEffect(() => {
    // only animate if cardHeight is a valid number
    if (typeof cardHeight === 'number' && cardHeight > 0) {
      Animated.timing(cardHeightAnimation, {
        toValue: cardHeight,
        duration: 100, // smooth animation duration
        useNativeDriver: false, // height animation doesn't support native driver
      }).start();
    }
  }, [cardHeight, cardHeightAnimation]);
  
  // animate expanded area height when expansion state changes
  // height is calculated as 32px per subtask + 12px padding
  useEffect(() => {
    const expandedHeight = isSubtasksExpanded ? (subtasksCount * 32) + 12 : 0;
    Animated.timing(expandedAreaHeightAnimation, {
      toValue: expandedHeight, // (32px per subtask + 12px padding) when expanded, 0 when collapsed
      duration: 100, // smooth animation duration
      useNativeDriver: false, // height animation doesn't support native driver
    }).start();
  }, [isSubtasksExpanded, expandedAreaHeightAnimation, subtasksCount]);

  // notify parent of card height when it changes
  // use ref to track last reported height to avoid infinite loops
  // report the expanded height (including 32px per subtask + 12px padding when subtasks are expanded) so timeline spacing adjusts
  const lastReportedHeight = useRef<number | null>(null);
  const onHeightMeasuredRef = useRef(onHeightMeasured);
  
  // keep ref updated
  useEffect(() => {
    onHeightMeasuredRef.current = onHeightMeasured;
  }, [onHeightMeasured]);

  // listen to the animated card height value and stream changes to parent
  // so the timeline can smoothly update spacing while the card is expanding/collapsing
  useEffect(() => {
    const id = cardHeightAnimation.addListener(({ value }) => {
      if (!onHeightMeasuredRef.current) return;
      
      // avoid spamming identical values to parent
      if (lastReportedHeight.current === value) return;
      lastReportedHeight.current = value;
      
      // report the animated card height on every meaningful tick
      // this lets the timeline spacing animate in sync with the card
      onHeightMeasuredRef.current(value);
    });

    return () => {
      cardHeightAnimation.removeListener(id);
    };
  }, [cardHeightAnimation]);

  // measure card height when layout is calculated (fallback / initial measurement)
  // this measures the actual rendered height of the combinedContainer
  const handleContentLayout = (event: any) => {
    const { height } = event.nativeEvent.layout;
    if (measuredContentHeight !== height) {
      setMeasuredContentHeight(height);
      // report the measured height to parent so timeline spacing adjusts
      // this includes the expanded height when subtasks are expanded
      if (onHeightMeasuredRef.current) {
        onHeightMeasuredRef.current(height);
        lastReportedHeight.current = height;
      }
    }
  };

  // reset height when task content changes (triggers remeasurement)
  // use subtasks length instead of array reference to avoid unnecessary re-renders during hot reload
  // include task.metadata and isSubtasksExpanded to ensure re-render when expansion state changes
  useEffect(() => {
    setMeasuredContentHeight(null);
    lastReportedHeight.current = null;
  }, [task.metadata?.subtasks?.length ?? 0, task.title, duration, task.id, task.metadata, isSubtasksExpanded]);

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
        {/* icon container - separate background for the icon */}
        {/* positioned on the left side in the row layout */}
        {/* height is fixed at base height, does not expand with subtasks */}
        {/* background color is task color, icon color is primary */}
        {task.icon && (
          <Animated.View style={[styles.iconContainer, { height: minCardHeight }]}>
            <TaskIcon icon={task.icon} color={themeColors.background.invertedPrimary()} size={20} />
          </Animated.View>
        )}

        {/* content column - contains combined container and subtask list */}
        {/* positioned on the right side in the row layout */}
        <Animated.View
          style={[
            styles.content,
            { 
              height: cardHeightAnimation, // animated height: base + (32px per subtask + 12px padding) when expanded
            }
          ]}
          onLayout={handleContentLayout}
        >
          {/* combined container for task content - fixed height, stays at top */}
          {/* this is the main card that doesn't expand */}
          <Animated.View
            style={[
              styles.combinedContainer,
              { 
                height: minCardHeight, // fixed height at base height, doesn't expand
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
              <View style={styles.checkboxContainer} />
            </TouchableOpacity>
            
            {/* subtask button - absolutely positioned layer above task card */}
            {hasSubtasks && (
              <TouchableOpacity
                style={[
                  styles.subtaskButton,
                  { left: 16 }, // align with task content padding (icon is now separate)
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
            
            {/* checkbox - absolutely positioned layer above task card for easy tapping */}
            {/* positioned relative to combinedContainer, inside the card's padding area */}
            {/* larger tap area (44x44) for better touch target, visual checkbox remains 18x18 */}
            {/* checkbox stays centered at base height (minCardHeight), not expanded height */}
            <TouchableOpacity
              style={[
                styles.checkboxTouchable,
                { top: minCardHeight / 2 - 22 } // center vertically at base height (half base height minus half tap area height)
              ]}
              onPress={handleCheckboxPress}
              activeOpacity={1} // disable default opacity change since we're using custom scale animation
            >
              {/* outer animated view for scale animation (uses native driver) */}
              <Animated.View
                style={{
                  // animate scale for tap feedback - uses native driver for better performance
                  transform: [{ scale: checkboxScaleAnimation }],
                }}
              >
                {/* inner animated view for color animations (doesn't use native driver) */}
                <Animated.View
                  style={[
                    styles.checkboxCircle,
                    {
                      // animate border color from tertiary (grey) to task color
                      borderColor: checkboxFillAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [themeColors.text.tertiary(), taskColor],
                      }),
                      // animate background color from transparent to task color
                      backgroundColor: checkboxFillAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['transparent', taskColor],
                      }),
                    },
                  ]}
                />
              </Animated.View>
            </TouchableOpacity>
          </Animated.View>
          
          {/* expanded area below the card - appears when subtasks are expanded */}
          {/* this creates the extra space below the main card content (32px per subtask + 12px padding) */}
          {/* animated height from 0 to (subtasksCount * 32px + 12px) for smooth expansion */}
          <Animated.View
            style={[
              styles.expandedArea,
              {
                height: expandedAreaHeightAnimation, // animate from 0 to (subtasksCount * 32px + 12px)
                overflow: 'hidden', // hide subtasks when collapsed
              }
            ]}
          >
            {/* render each subtask in a 32px tall row */}
            {isSubtasksExpanded && task.metadata?.subtasks && task.metadata.subtasks.length > 0 && (
              <View style={[
                styles.subtasksList,
                // align with task content left edge: 16px padding (icon is now separate)
                { paddingLeft: 16 }
              ]}>
                {/* sort subtasks by sortOrder before rendering */}
                {[...task.metadata.subtasks]
                  .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
                  .map((subtask, index) => (
                    <TouchableOpacity
                      key={subtask.id}
                      style={[
                        styles.subtaskRow,
                        // first subtask (index 0) should not have a top border
                        index === 0 && styles.subtaskRowFirst
                      ]}
                      onPress={() => handleSubtaskToggle(subtask.id)}
                      activeOpacity={0.7}
                    >
                      {/* checkbox icon - shows completed state */}
                      {/* unchecked state uses square-outline (box), checked state uses checkbox */}
                      {/* unchecked box color matches subtask title color (text.primary) */}
                      <Ionicons
                        name={subtask.isCompleted ? "checkbox" : "square-outline"}
                        size={14}
                        color={subtask.isCompleted ? taskColor : themeColors.text.primary()}
                        style={styles.subtaskCheckbox}
                      />
                      {/* subtask title text */}
                      <Text
                        style={[
                          styles.subtaskTitle,
                          subtask.isCompleted && styles.subtaskTitleCompleted
                        ]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {subtask.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
              </View>
            )}
          </Animated.View>
        </Animated.View>
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
  // row layout: icon container on left, content column on right
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-start', // align to top, let content determine height
    paddingLeft: 0,
    paddingRight: 16,
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

  // content column - contains combined container and subtask list
  // positioned on the right in the row layout
  // expands when subtasks are expanded
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
  
  // expanded area below the card - appears when subtasks are expanded
  // creates the extra space below the main card content (32px per subtask + 12px padding)
  // seamlessly connects with the card above (no gap, same background)
  // positioned as the bottom row in cardWrapper
  expandedArea: {
    width: '100%',
    backgroundColor: themeColors.background.primarySecondaryBlend(), // match card background for seamless look
    // no border radius - cardWrapper handles all border radius
  },

  // subtasks list container - holds all subtask rows
  // includes 12px bottom padding for the expansion height calculation
  // padding matches task content edges: left edge is 16px (matches combinedContainer paddingHorizontal)
  subtasksList: {
    width: '100%',
    paddingHorizontal: 16, // align with task content (icon is now separate)
  },

  // individual subtask row - exactly 32px tall
  subtaskRow: {
    flexDirection: 'row', // horizontal layout for checkbox and text
    alignItems: 'center', // vertically center checkbox and text
    height: 36, // exactly 32px per subtask as requested
    paddingVertical: 0, // no vertical padding to maintain exact 32px height
    borderTopWidth: 1, // top border to separate each subtask row
    borderTopColor: themeColors.border.primary(), // use theme border color for consistency
  },

  // first subtask row - no top border
  subtaskRowFirst: {
    borderTopWidth: 0, // remove top border for the first subtask
  },

  // subtask checkbox icon - positioned on the left
  subtaskCheckbox: {
    marginRight: 8, // spacing between checkbox and text
  },

  // subtask title text styling
  subtaskTitle: {
    flex: 1, // take up remaining space
    // use body-medium text style from typography system (12px, regular, satoshi font)
    ...typography.getTextStyle('body-large'),
    color: themeColors.text.primary(), // primary text color for uncompleted subtasks
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.3,
  },

  // completed subtask title styling - strikethrough and dimmed
  subtaskTitleCompleted: {
    textDecorationLine: 'line-through', // strikethrough for completed subtasks
    color: themeColors.text.tertiary(), // dimmed color for completed subtasks
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

  // checkbox touchable - absolutely positioned layer above task card for easy tapping
  // positioned relative to combinedContainer (the task card)
  // top position is set dynamically in component to center it vertically
  // positioned inside the card's padding area with proper spacing from the right edge
  // using 12px instead of 16px to give it some breathing room from the edge
  // larger tap area (44x44) for better touch target, visual checkbox remains 18x18
  // the tap area is centered, and the visual checkbox is centered within it using alignItems/justifyContent
  checkboxTouchable: {
    position: 'absolute',
    right: 12, // position inside card padding area with spacing from right edge (card has 16px padding)
    zIndex: 20, // layer above task card (higher than subtask button which is zIndex 10)
    width: 44, // larger tap area for better touch target (iOS/Android recommended minimum is 44x44)
    height: 44,
    alignItems: 'center', // center the visual checkbox horizontally within the tap area
    justifyContent: 'center', // center the visual checkbox vertically within the tap area
  },

  // checkbox circle - same size as icon (18px) with border
  // unchecked: border with tertiary color (grey), no fill
  // checked: solid circle filled with task color
  // animation interpolates between these states
  checkboxCircle: {
    width: 18, // same size as TaskIcon default size
    height: 18,
    borderRadius: 9, // make it circular (half of width/height)
    borderWidth: 1.5,
    // backgroundColor and borderColor are animated based on completion state
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

