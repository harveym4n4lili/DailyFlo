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
import AnimatedReanimated, { useSharedValue, useAnimatedStyle, withTiming, useAnimatedReaction, runOnJS } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { Task } from '@/types';
import { getTaskColorValue } from '@/utils/taskColors';
import TaskIcon from '@/components/ui/Card/TaskCard/TaskIcon';
import { formatTimeRange, calculateTaskHeight, getTaskCardHeight, TASK_CARD_HEIGHTS } from '../timelineUtils';
// import extracted sub-components
import { TimelineCheckbox, TimelineSubtaskButton, TimelineSubtaskList } from './sections';

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
  // whether this task is currently being dragged (for z-index management)
  // this prop comes from parent to track which task should be on top layer
  isDraggedTask?: boolean;
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
  isDraggedTask = false,
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
  
  // track if a drag just ended to prevent modal from opening after drag release
  // this prevents the task modal from opening when user releases after dragging
  const justFinishedDragRef = React.useRef(false);

  // state to store measured content height (includes padding)
  const [measuredContentHeight, setMeasuredContentHeight] = React.useState<number | null>(null);
  
  // state for subtask dropdown expansion
  const [isSubtasksExpanded, setIsSubtasksExpanded] = useState(false);
  
  // animated value for card height expansion using reanimated - runs on native thread for better performance
  // initialized with default height, will be updated when minCardHeight is calculated
  const cardHeightAnimation = useSharedValue(64); // default to 64px, will be updated
  
  // animated value for fade-in animation when task repositions after drag
  // starts at 1 (fully visible), fades to 0 on drag end, then fades back to 1 when position updates
  const fadeAnimation = useRef(new Animated.Value(1)).current;
  
  // track previous position to detect when position updates after drag
  const previousPositionRef = useRef(position);
  
  // track if we're waiting for position update after drag to trigger fade-in
  const waitingForRepositionRef = useRef(false);
  
  // store timeout ref for fallback fade-in animation
  // this ensures animation always plays even if position doesn't change
  const fadeInTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // handle subtask button toggle - update expansion state
  // this is called by TimelineSubtaskButton when the button is pressed
  const handleSubtaskToggle = () => {
    setIsSubtasksExpanded(!isSubtasksExpanded);
    // the card height will automatically update via cardHeight calculation
    // and this will be reported to parent via animation listener below
  };

  // handle main task press - open task detail view with haptic feedback
  // this wrapper ensures haptic feedback fires even if PanGestureHandler intercepts the touch
  // prevents modal from opening if user just finished dragging the task
  const handleTaskPress = () => {
    // if a drag just finished, don't open the modal
    // this prevents accidental modal opening when releasing after dragging
    if (justFinishedDragRef.current) {
      // reset the flag so future taps work normally
      justFinishedDragRef.current = false;
      return;
    }
    
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
  // using reanimated shared value - runs on native thread for better performance
  useEffect(() => {
    // only update if minCardHeight is a valid number
    if (typeof minCardHeight === 'number' && minCardHeight > 0) {
      cardHeightAnimation.value = minCardHeight;
    }
  }, [minCardHeight]);
  
  // animate card height when expansion state changes using reanimated
  // withTiming runs on native thread for smooth 60fps animation on iOS
  useEffect(() => {
    // only animate if cardHeight is a valid number
    if (typeof cardHeight === 'number' && cardHeight > 0) {
      // use withTiming for smooth animation - runs on native thread
      // duration 100ms matches original animation timing
      cardHeightAnimation.value = withTiming(cardHeight, {
        duration: 100,
      });
    }
  }, [cardHeight]);
  

  // notify parent of card height when it changes
  // use shared value to track last reported height (works in worklets)
  // report the expanded height (including 32px per subtask + 12px padding when subtasks are expanded) so timeline spacing adjusts
  const lastReportedHeight = useSharedValue<number | null>(null);
  const onHeightMeasuredRef = useRef(onHeightMeasured);
  
  // keep ref updated
  useEffect(() => {
    onHeightMeasuredRef.current = onHeightMeasured;
  }, [onHeightMeasured]);

  // callback function to report height to parent - must be defined outside worklet
  // this function runs on JS thread and can safely access refs
  const reportHeight = (value: number) => {
    if (!onHeightMeasuredRef.current) return;
    onHeightMeasuredRef.current(value);
  };

  // listen to the animated card height value and stream changes to parent using reanimated reaction
  // this runs on native thread and calls JS function to report height changes
  // so the timeline can smoothly update spacing while the card is expanding/collapsing
  useAnimatedReaction(
    () => cardHeightAnimation.value,
    (currentValue, previousValue) => {
      // avoid spamming identical values to parent
      // use shared value for comparison (works in worklets)
      if (lastReportedHeight.value === currentValue) return;
      
      // update shared value to track last reported height
      lastReportedHeight.value = currentValue;
      
      // use runOnJS to call the JS callback from native thread
      // this reports the animated card height on every meaningful tick
      // letting the timeline spacing animate in sync with the card
      runOnJS(reportHeight)(currentValue);
    },
    []
  );

  // create animated style for card height using reanimated
  // this runs on native thread for smooth 60fps animation on iOS
  const animatedContentStyle = useAnimatedStyle(() => {
    return {
      height: cardHeightAnimation.value,
    };
  });

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
  // also trigger fade-in animation if we're waiting for reposition after drag
  useEffect(() => {
    const positionChanged = previousPositionRef.current !== position;
    previousPositionRef.current = position;
    
    basePosition.current = position;
    translateY.setValue(0); // reset translation when position changes
    
    // if we're waiting for reposition after drag, trigger fade-in
    // this happens when the timeline recalculates and updates the task's position
    // we trigger even if position didn't change (in case dragged back to same spot)
    if (waitingForRepositionRef.current) {
      waitingForRepositionRef.current = false; // clear the flag
      
      // clear fallback timeout since position update happened
      if (fadeInTimeoutRef.current) {
        clearTimeout(fadeInTimeoutRef.current);
        fadeInTimeoutRef.current = null;
      }
      
      // fade in from 0 to 1 when the card repositions after drag
      // this provides visual feedback that the drag completed and card is in new position
      Animated.timing(fadeAnimation, {
        toValue: 1, // fade to fully visible
        duration: 500, // smooth 300ms fade-in animation
        useNativeDriver: true, // use native driver for better performance
      }).start();
    }
  }, [position, translateY, fadeAnimation]);
  
  // cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (fadeInTimeoutRef.current) {
        clearTimeout(fadeInTimeoutRef.current);
      }
    };
  }, []);

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
      
      // check if this was actually a drag (not just a tap)
      // if translationY is significant, it was a drag
      const wasDrag = Math.abs(event.nativeEvent.translationY) > 5;
      
      // call onDrag callback with new position
      // TimelineView will handle converting to timeline position if needed
      onDrag(clampedY);
      
      // reset drag state
      setIsDragging(false);
      isDraggingRef.current = false;
      
      // if this was a drag, set flag to prevent modal from opening on release
      // this prevents the task modal from opening when user releases after dragging
      // also fade out the card and wait for position update to fade back in
      if (wasDrag) {
        justFinishedDragRef.current = true;
        // clear the flag after a short delay so future taps work normally
        // use setTimeout to reset after the press event would have fired
        setTimeout(() => {
          justFinishedDragRef.current = false;
        }, 100);
        
        // fade out the card immediately on drag end
        // we'll fade it back in when the position prop updates (after timeline recalculates)
        fadeAnimation.setValue(0); // fade to invisible
        waitingForRepositionRef.current = true; // mark that we're waiting for reposition
        
        // set fallback timeout to ensure fade-in always plays
        // if position doesn't change (e.g., dragged back to same spot), still fade in after delay
        // clear any existing timeout first
        if (fadeInTimeoutRef.current) {
          clearTimeout(fadeInTimeoutRef.current);
        }
        fadeInTimeoutRef.current = setTimeout(() => {
          // if we're still waiting for reposition, trigger fade-in anyway
          // this ensures the card never stays invisible
          if (waitingForRepositionRef.current) {
            waitingForRepositionRef.current = false;
            Animated.timing(fadeAnimation, {
              toValue: 1, // fade to fully visible
              duration: 500, // smooth 300ms fade-in animation
              useNativeDriver: true, // use native driver for better performance
            }).start();
          }
          fadeInTimeoutRef.current = null;
        }, 100); // wait 100ms for position update, then trigger fallback
      }
      
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
            // apply higher z-index when this task is being dragged so it appears above all others
            // reset to default (undefined) when drag ends
            // isDraggedTask prop comes from parent to track which task should be on top layer
            zIndex: isDraggedTask ? 1000 : undefined,
            // apply fade animation opacity - animates on drag release
            // starts at 1 (fully visible), fades to 0.7 then back to 1 when drag ends
            opacity: fadeAnimation,
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
        {/* using reanimated for height animation - runs on native thread for better performance */}
        <AnimatedReanimated.View
          style={[
            styles.content,
            animatedContentStyle, // animated height: base + (32px per subtask + 12px padding) when expanded
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
            <TimelineSubtaskButton
              task={task}
              isExpanded={isSubtasksExpanded}
              onToggle={handleSubtaskToggle}
            />
            
            {/* checkbox - absolutely positioned layer above task card for easy tapping */}
            <TimelineCheckbox
              task={task}
              taskColor={taskColor}
              onTaskComplete={onTaskComplete}
              minCardHeight={minCardHeight}
            />
          </Animated.View>
          
          {/* expanded area below the card - appears when subtasks are expanded */}
          <TimelineSubtaskList
            task={task}
            isExpanded={isSubtasksExpanded}
            taskColor={taskColor}
          />
        </AnimatedReanimated.View>
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

