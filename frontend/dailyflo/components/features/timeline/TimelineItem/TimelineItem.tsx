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
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import AnimatedReanimated, { useSharedValue, useAnimatedStyle, withTiming, useAnimatedReaction, runOnJS, cancelAnimation } from 'react-native-reanimated';
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

  // animated value for drag position using reanimated - runs on native thread for better performance
  // starts at 0, tracks drag offset during gesture
  const translateY = useSharedValue(0);
  
  // track the base position (initial position before drag) - used for calculating absolute position
  // using shared value so it can be accessed in worklets
  const basePosition = useSharedValue(position);
  
  // track drag start position - used to calculate drag offset relative to start
  const startY = useSharedValue(0);
  
  // track if currently dragging - used for callbacks
  const [isDragging, setIsDragging] = React.useState(false);
  
  // use ref to track dragging state for callbacks
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
  
  // animated value for position using reanimated - runs on native thread for better performance
  // this makes tasks smoothly move when other tasks expand/collapse
  const positionAnimation = useSharedValue(position);
  
  // animated value for fade-in animation using reanimated - runs on native thread for better performance
  // starts at 1 (fully visible), fades to 0 on drag end, then fades back to 1 when position updates
  const fadeAnimation = useSharedValue(1);
  
  // animated value for drag indicator opacity using reanimated - runs on native thread for better performance
  // starts at 1 (fully visible), smoothly fades to 0.5 when dragging starts
  // can be interrupted if drag ends before animation completes
  const dragIndicatorOpacity = useSharedValue(1);
  
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
  // this wrapper ensures haptic feedback fires even if gesture handler intercepts the touch
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
      // duration 200ms for smooth, visible expansion animation
      cardHeightAnimation.value = withTiming(cardHeight, {
        duration: 75,
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

  // create animated style for position and fade using reanimated
  // combines position animation (when other tasks expand) with fade
  // note: we no longer apply translateY transform - the card stays in place during drag
  // instead, a drag overlay follows the thumb position (handled in TimelineView)
  // this runs on native thread for smooth 60fps performance
  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      top: positionAnimation.value,
      // removed translateY transform - card stays in place during drag
      opacity: fadeAnimation.value, // fade animation for drag feedback
    };
  });
  
  // create animated style for drag indicator (reduced opacity when dragging)
  // this provides visual feedback that the task is selected for dragging
  // uses smooth iOS-style animation that can be interrupted if drag ends early
  const animatedDragIndicatorStyle = useAnimatedStyle(() => {
    return {
      opacity: dragIndicatorOpacity.value, // use animated shared value for smooth fade
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
        // update shared value for tracking (used in worklet)
        lastReportedHeight.value = height;
      }
    }
  };

  // reset height when task content changes (triggers remeasurement)
  // use subtasks length instead of array reference to avoid unnecessary re-renders during hot reload
  // include task.metadata and isSubtasksExpanded to ensure re-render when expansion state changes
  useEffect(() => {
    setMeasuredContentHeight(null);
    lastReportedHeight.value = null; // reset shared value for tracking
  }, [task.metadata?.subtasks?.length ?? 0, task.title, duration, task.id, task.metadata, isSubtasksExpanded]);

  // update base position when prop changes
  // also trigger fade-in animation if we're waiting for reposition after drag
  // animate position smoothly when it changes (e.g., when other tasks expand)
  useEffect(() => {
    const positionChanged = previousPositionRef.current !== position;
    previousPositionRef.current = position;
    
    basePosition.value = position; // update shared value for worklet access
    translateY.value = 0; // reset translation when position changes
    
    // if we're waiting for reposition after drag, set position and fade immediately (no animation)
    // this prevents the slide glitch when dragging out of overlapping tasks
    if (waitingForRepositionRef.current) {
      waitingForRepositionRef.current = false; // clear the flag
      
      // clear fallback timeout since position update happened
      if (fadeInTimeoutRef.current) {
        clearTimeout(fadeInTimeoutRef.current);
        fadeInTimeoutRef.current = null;
      }
      
      // set position and fade immediately without animation to prevent slide glitch
      cancelAnimation(positionAnimation);
      cancelAnimation(fadeAnimation);
      positionAnimation.value = position; // set immediately, no animation
      fadeAnimation.value = 1; // set immediately, no fade animation
    } else {
      // animate position smoothly when it changes using reanimated
      // this makes tasks smoothly move when other tasks expand/collapse
      // duration 200ms matches the card height animation for synchronized movement
      positionAnimation.value = withTiming(position, {
        duration: 75,
      });
    }
  }, [position]);
  
  // cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (fadeInTimeoutRef.current) {
        clearTimeout(fadeInTimeoutRef.current);
      }
    };
  }, []);

  // callback functions for drag events - must be defined outside worklets
  // these run on JS thread and can safely access refs and call parent callbacks
  const handleDragStartCallback = () => {
    setIsDragging(true);
    isDraggingRef.current = true;
    
    // animate drag indicator opacity to 0.05 with smooth iOS-style animation
    // cancel any ongoing animation first to allow interruption
    cancelAnimation(dragIndicatorOpacity);
    dragIndicatorOpacity.value = withTiming(0.05, {
      duration: 800, // smooth 800ms fade
    });
    
    // notify parent that drag started
    if (onDragStart) {
      onDragStart();
    }
    
    // notify parent of initial drag position
    // use shared value to get current base position
    if (onDragPositionChange) {
      onDragPositionChange(basePosition.value);
    }
  };

  const handleDragUpdateCallback = (currentY: number) => {
    // notify parent of drag position change - parent will calculate time with offsets
    if (onDragPositionChange && isDraggingRef.current) {
      onDragPositionChange(currentY);
    }
  };

  const handleDragEndCallback = (newY: number, wasDrag: boolean) => {
    // reset drag state
    setIsDragging(false);
    isDraggingRef.current = false;
    
    // animate drag indicator opacity back to 1 with smooth animation
    // cancel any ongoing animation first to allow interruption
    cancelAnimation(dragIndicatorOpacity);
    dragIndicatorOpacity.value = withTiming(1, {
      duration: 800, // smooth 800ms fade back to full opacity
    });
    
    // call onDrag callback with new position
    onDrag(newY);
    
    // if this was a drag, set flag to prevent modal from opening on release
    if (wasDrag) {
      justFinishedDragRef.current = true;
      setTimeout(() => {
        justFinishedDragRef.current = false;
      }, 100);
      
        // fade out the card immediately on drag end using reanimated
        // cancel any ongoing fade animation first to allow interruption
        cancelAnimation(fadeAnimation);
        fadeAnimation.value = 0;
        waitingForRepositionRef.current = true;
        
        // set fallback timeout to ensure fade-in always plays
        if (fadeInTimeoutRef.current) {
          clearTimeout(fadeInTimeoutRef.current);
        }
        fadeInTimeoutRef.current = setTimeout(() => {
          if (waitingForRepositionRef.current) {
            waitingForRepositionRef.current = false;
            // fade in using reanimated with smooth 800ms animation
            // cancel any ongoing animation first to allow interruption
            cancelAnimation(fadeAnimation);
            fadeAnimation.value = withTiming(1, {
              duration: 800, // smooth 800ms fade-in animation
            });
          }
          fadeInTimeoutRef.current = null;
        }, 100);
    }
    
    // notify parent that drag ended
    if (onDragEnd) {
      onDragEnd();
    }
    
    // reset translation (position will be updated via prop)
    translateY.value = 0;
  };

  // format time range for display (e.g., "9:00 AM - 10:30 AM")
  const timeRangeText = useMemo(() => {
    if (!task.time) return '';
    return formatTimeRange(task.time, duration);
  }, [task.time, duration]);

  // track if long press has activated - pan gesture only works after long press
  // this allows drag to start only after holding for iOS standard duration
  const longPressActivated = useSharedValue(false);
  
  // track if pan gesture is currently active
  // this prevents canceling drag when long press ends if user is actively dragging
  const panIsActive = useSharedValue(false);
  
  // long press gesture handler - iOS standard 500ms hold to start drag
  // this provides the "pick up" interaction before dragging begins
  const longPressGesture = Gesture.LongPress()
    .minDuration(500) // iOS standard long press duration (500ms)
    .onStart(() => {
      'worklet';
      // long press activated - enable dragging
      longPressActivated.value = true;
      
      // provide medium haptic feedback when long press activates
      // this gives tactile feedback that drag mode is now active
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
      
      // notify parent that drag started (overlay appears, card fades)
      runOnJS(handleDragStartCallback)();
    })
    .onEnd(() => {
      'worklet';
      // if long press ends but pan is active, don't cancel - let pan handle it
      // only cancel if user releases without starting to drag
      // check both panIsActive and if there's been any significant movement
      const hasMovement = Math.abs(translateY.value) >= 5;
      if (!panIsActive.value && !hasMovement) {
        // user released long press without dragging - cancel drag
        longPressActivated.value = false;
        translateY.value = 0;
        runOnJS(handleDragEndCallback)(basePosition.value, false);
      }
      // if pan is active or there's movement, do nothing - pan will handle the drag end
    });
  
  // pan gesture handler for dragging using reanimated
  // works after long press has activated
  // runs on native thread for smooth 60fps drag performance
  const panGesture = Gesture.Pan()
    .activeOffsetY([-0, 0]) // require 2px movement before activating (very sensitive)
    .onBegin(() => {
      'worklet';
      // remember the starting position when pan begins
      // this happens even before long press activates
      startY.value = translateY.value;
    })
    .onStart(() => {
      'worklet';
      // pan gesture started - check if long press has already activated
      // if so, mark pan as active immediately
      // if not, pan will be marked active in onUpdate when long press activates
      if (longPressActivated.value) {
        panIsActive.value = true;
        // provide light haptic feedback when pan activates
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
      }
    })
    .onUpdate((event) => {
      'worklet';
      // only process drag updates if long press has activated
      // this ensures drag only works after the hold period
      if (!longPressActivated.value) {
        return;
      }
      // mark pan as active once we start updating (user is dragging)
      // this ensures pan is marked active even if onStart was called before long press activated
      panIsActive.value = true;
      
      // apply the drag offset - translationY is relative to gesture start
      // this works correctly even if pan started before long press activated
      translateY.value = event.translationY;
      
      // calculate current Y position using shared value (accessible in worklets)
      const currentY = basePosition.value + event.translationY;
      runOnJS(handleDragUpdateCallback)(currentY);
    })
    .onTouchesMove((event, stateManager) => {
      'worklet';
      // if long press has activated, allow pan to continue
      // this ensures pan can work even if it started before long press
      if (longPressActivated.value) {
        stateManager.activate();
      } else {
        // if long press hasn't activated yet, fail the pan gesture
        // this prevents accidental drags before the hold period
        stateManager.fail();
      }
    })
    .onEnd((event) => {
      'worklet';
      // only process drag end if long press has activated and pan was active
      if (!longPressActivated.value || !panIsActive.value) {
        // reset states if drag didn't complete
        if (longPressActivated.value && !panIsActive.value) {
          // long press activated but pan never started - cancel
          longPressActivated.value = false;
          translateY.value = 0;
          runOnJS(handleDragEndCallback)(basePosition.value, false);
        }
        return;
      }
      // gesture ended - calculate new absolute position using shared value
      const newY = basePosition.value + event.translationY;
      const clampedY = Math.max(0, newY);
      
      // check if this was actually a drag (not just a tap)
      const wasDrag = Math.abs(event.translationY) > 5;
      
      // reset activation states
      longPressActivated.value = false;
      panIsActive.value = false;
      
      // notify parent and handle drag end
      runOnJS(handleDragEndCallback)(clampedY, wasDrag);
    });
  
  // combine long press and pan gestures using Simultaneous
  // long press activates first, then pan takes over for dragging
  // both gestures can be active at the same time
  const combinedGesture = Gesture.Simultaneous(longPressGesture, panGesture);

  return (
    <GestureDetector gesture={combinedGesture}>
      <AnimatedReanimated.View
        style={[
          styles.container,
          animatedContainerStyle, // animated position, drag transform, and fade - runs on native thread
          {
            // apply higher z-index when this task is being dragged so it appears above all others
            // reset to default (undefined) when drag ends
            // isDraggedTask prop comes from parent to track which task should be on top layer
            zIndex: isDraggedTask ? 1000 : undefined,
          },
        ]}
      >
        {/* icon container - separate background for the icon */}
        {/* positioned on the left side in the row layout */}
        {/* height is fixed at base height, does not expand with subtasks */}
        {/* background color is task color, icon color is primary */}
        {task.icon && (
          <AnimatedReanimated.View style={[styles.iconContainer, { height: minCardHeight }, animatedDragIndicatorStyle]}>
            <TaskIcon icon={task.icon} color={themeColors.background.invertedPrimary()} size={20} />
          </AnimatedReanimated.View>
        )}

        {/* content column - contains combined container and subtask list */}
        {/* positioned on the right side in the row layout */}
        {/* using reanimated for height animation - runs on native thread for better performance */}
        <AnimatedReanimated.View
          style={[
            styles.content,
            animatedContentStyle, // animated height: base + (32px per subtask + 12px padding) when expanded
            animatedDragIndicatorStyle, // drag indicator: reduced opacity when dragging
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
      </AnimatedReanimated.View>
    </GestureDetector>
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

