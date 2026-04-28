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
import AnimatedReanimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  useAnimatedReaction,
  runOnJS,
  cancelAnimation,
  Easing,
  interpolateColor,
  type SharedValue,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { Paddings } from '@/constants/Paddings';
import { Task } from '@/types';
import { getTaskColorValue } from '@/utils/taskColors';
import TaskIcon from '@/components/ui/Card/TaskCard/TaskIcon';
import { RepeatIcon } from '@/components/ui/Icon';
import { Checkbox, CHECKBOX_SIZE_DEFAULT, CHECKBOX_SIZE_SMALL } from '@/components/ui/Button';
import { getTaskCardHeight, formatTimeRange } from '../timelineUtils';
import { isRecurringTask } from '@/utils/recurrenceUtils';
import { TimelineCheckbox } from './sections';
import { taskDisplayEquals } from '@/utils/taskDisplayEquals';
import { getStrikethroughDuration, STRIKETHROUGH_MIN_MS } from '@/constants/Checkbox';

// line data from Text onTextLayout - x, y, width, height per line (normally 1 line for timeline title)
type TextLineLayout = { x: number; y: number; width: number; height: number };

// Animated.Text created from reanimated so we can animate color + draw overlay lines without changing layout
const AnimatedText = AnimatedReanimated.createAnimatedComponent(Text);

/** single strikethrough line for one text line - animates width left-to-right, positioned at line's vertical center */
function StrikethroughLine({
  line,
  strikeProgress,
  lineStyle,
  yOffset = 0,
}: {
  line: TextLineLayout;
  strikeProgress: SharedValue<number>;
  lineStyle: object;
  yOffset?: number;
}) {
  const animatedStyle = useAnimatedStyle(() => ({
    width: line.width * strikeProgress.value,
  }));

  return (
    <AnimatedReanimated.View
      style={[
        lineStyle,
        { left: line.x, top: line.y + line.height / 2 - 1 + yOffset },
        animatedStyle,
      ]}
      pointerEvents="none"
    />
  );
}

interface TimelineItemProps {
  // task to display
  task: Task;
  // center Y position on the timeline in pixels (used to derive top = center - height/2 so height changes don't cause slide)
  centerPosition: number;
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
  // callback when task completion checkbox is pressed (targetCompleted = explicit target for debounced rapid taps)
  onTaskComplete?: (task: Task, targetCompleted?: boolean) => void;
  // called immediately on tap (e.g. for local UI); backend sync still delayed
  onTaskCompleteImmediate?: (task: Task, targetCompleted?: boolean) => void;
  // whether this task is currently being dragged (for z-index management)
  // this prop comes from parent to track which task should be on top layer
  isDraggedTask?: boolean;
  // when part of overlapping group: 'first' = top task, 'middle' = between, 'last' = bottom task
  // used to flatten border radius where cards connect (first: bottom 0, last: top 0, middle: all 0)
  overlapPosition?: 'first' | 'middle' | 'last';
  // selection mode - when true, show selection checkbox and tap toggles selection
  selectionMode?: boolean;
  isSelected?: boolean;
}

// compare by value so sibling Redux updates don't interrupt checkbox/animations
// skip callback comparison - parent often passes inline fns; we only need to avoid re-renders when task/centerPosition unchanged
function timelineItemPropsAreEqual(prev: TimelineItemProps, next: TimelineItemProps) {
  if (!taskDisplayEquals(prev.task, next.task)) return false;
  if (prev.centerPosition !== next.centerPosition) return false;
  if (prev.duration !== next.duration) return false;
  if (prev.pixelsPerMinute !== next.pixelsPerMinute) return false;
  if (prev.startHour !== next.startHour) return false;
  if (prev.isDraggedTask !== next.isDraggedTask) return false;
  if (prev.overlapPosition !== next.overlapPosition) return false;
  if (prev.selectionMode !== next.selectionMode) return false;
  if (prev.isSelected !== next.isSelected) return false;
  return true;
}

/**
 * TimelineItem Component
 * 
 * Renders a task item on the timeline with drag functionality.
 * Shows icon in circular container, time range, and title.
 */
const TimelineItem = React.memo(function TimelineItem({
  task,
  centerPosition,
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
  onTaskCompleteImmediate,
  isDraggedTask = false,
  overlapPosition,
  selectionMode = false,
  isSelected = false,
}: TimelineItemProps) {
  const themeColors = useThemeColors();
  const typography = useTypography();

  // get task color value from color palette system
  const taskColor = useMemo(() => getTaskColorValue(task.color), [task.color]);

  // create dynamic styles using theme colors and typography
  const styles = useMemo(() => createStyles(themeColors, typography, taskColor), [themeColors, typography, taskColor]);

  // border radius for overlapping cards - flatten corners where cards connect
  // first: bottom corners 0; last: top corners 0; middle: all corners 0
  const overlapBorderRadius = useMemo(() => {
    if (!overlapPosition) return null;
    switch (overlapPosition) {
      case 'first': return { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 };
      case 'last': return { borderTopLeftRadius: 0, borderTopRightRadius: 0 };
      case 'middle': return { borderRadius: 0 };
      default: return null;
    }
  }, [overlapPosition]);

  // animated value for drag position using reanimated - runs on native thread for better performance
  // starts at 0, tracks drag offset during gesture
  const translateY = useSharedValue(0);
  
  // track the base position (current top = center - height/2) for drag - synced from center + height in reaction below
  const basePosition = useSharedValue(centerPosition - (getTaskCardHeight(duration) / 2));
  
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
  
  // center position as shared value - only changes when CENTER changes (e.g. task above resized), not when our height changes
  // so when we only measure height, top = center - height/2 updates in worklet without any prop change = no slide
  const centerPositionAnimation = useSharedValue(centerPosition);
  
  // animated value for fade-in animation using reanimated - runs on native thread for better performance
  // starts at 1 (fully visible), fades to 0 on drag end, then fades back to 1 when position updates
  const fadeAnimation = useSharedValue(1);
  
  // animated value for drag indicator opacity using reanimated - runs on native thread for better performance
  // starts at 1 (fully visible), smoothly fades to 0.5 when dragging starts
  // can be interrupted if drag ends before animation completes
  const dragIndicatorOpacity = useSharedValue(1);
  
  // track previous center to detect when center position updates (e.g. task above expanded)
  const previousCenterRef = useRef(centerPosition);
  
  // skip center-position animation during initial load so timeline appears in final position (no slide)
  const mountTimeRef = useRef(Date.now());
  const centerUpdateCountRef = useRef(0);
  
  // track if we're waiting for position update after drag to trigger fade-in
  const waitingForRepositionRef = useRef(false);
  
  // store timeout ref for fallback fade-in animation
  // this ensures animation always plays even if position doesn't change
  const fadeInTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
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
  
  // calculate minimum card height based on duration
  const minCardHeight = useMemo(() => getTaskCardHeight(duration), [duration]);

  // time range for display - shown above title when in overlapping tasks
  const timeRangeText = task.time && overlapPosition ? formatTimeRange(task.time, duration) : '';
  
  // displayCompleted from TimelineCheckbox for title styling (optimistic ui)
  const [displayCompleted, setDisplayCompleted] = useState(task.isCompleted);
  useEffect(() => {
    setDisplayCompleted(task.isCompleted);
  }, [task.id]);

  // store per-line layout info from title onTextLayout so we can render animated strikethrough lines
  const [titleLines, setTitleLines] = useState<TextLineLayout[]>([]);

  // reanimated shared value: 0 = no strikethrough, 1 = full strikethrough (drives left-to-right animation per line)
  const strikeProgress = useSharedValue(displayCompleted ? 1 : 0);

  // when completion display changes (including optimistic), animate the strikethrough progress
  // duration scales with text width so visual speed feels consistent; ease-in-out = accelerate then decelerate
  useEffect(() => {
    if (displayCompleted) {
      const duration = titleLines.length ? getStrikethroughDuration(titleLines) : STRIKETHROUGH_MIN_MS;
      strikeProgress.value = withTiming(1, {
        duration,
        easing: Easing.inOut(Easing.cubic),
      });
    } else {
      strikeProgress.value = withTiming(0, {
        duration: 250,
        easing: Easing.in(Easing.cubic),
      });
    }
  }, [displayCompleted, strikeProgress]);

  // onTextLayout provides x, y, width, height for each rendered line - used to position strikethrough per line
  const handleTitleLayout = (e: { nativeEvent: { lines: TextLineLayout[] } }) => {
    setTitleLines(e.nativeEvent.lines ?? []);
  };

  // animate title color from primary to secondary (dimmed) as strikeProgress goes 0→1 - syncs with strikethrough
  const primaryTitleColor = themeColors.text.primary();
  const secondaryTitleColor = themeColors.text.secondary();
  const titleAnimatedStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      strikeProgress.value,
      [0, 1],
      [primaryTitleColor, secondaryTitleColor]
    ),
  }));

  // subtask count for display (0/X format)
  // when task is displayed as complete (optimistic or from backend), treat all subtasks as complete
  const subtasksCount = task.metadata?.subtasks?.length ?? 0;
  const completedSubtasksCount = displayCompleted
    ? subtasksCount
    : (task.metadata?.subtasks?.filter(st => st.isCompleted).length ?? 0);
  const allSubtasksComplete = subtasksCount > 0 && completedSubtasksCount === subtasksCount;

  // recurrence display text - same labels as TaskIndicators
  // use isRecurringTask to handle edge cases (undefined routineType, etc.)
  const recurrenceLabel = useMemo(() => {
    if (!isRecurringTask(task)) return null;
    switch (task.routineType) {
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
      case 'yearly': return 'Yearly';
      default: return null;
    }
  }, [task]);
  
  // use correct height from first frame - prevents flash of 64px before effects run
  const cardHeightAnimation = useSharedValue(minCardHeight);
  
  // update animation value when minCardHeight changes (for initial render or when task properties change)
  // using reanimated shared value - runs on native thread for better performance
  useEffect(() => {
    // only update if minCardHeight is a valid number
    if (typeof minCardHeight === 'number' && minCardHeight > 0) {
      cardHeightAnimation.value = minCardHeight;
    }
  }, [minCardHeight]);
  
  // update card height when minCardHeight changes (e.g. duration prop change)
  useEffect(() => {
    if (typeof minCardHeight !== 'number' || minCardHeight <= 0) return;
    
    if (Date.now() - mountTimeRef.current < 2000) {
      cardHeightAnimation.value = minCardHeight;
    } else {
      cardHeightAnimation.value = withTiming(minCardHeight, { duration: 75 });
    }
  }, [minCardHeight]);
  

  // notify parent of card height when it changes
  // use shared value to track last reported height (works in worklets)
  // report the card height so timeline spacing adjusts
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
  // top is derived from center - height/2 so when only our height changes (fallback→measured) there's no prop change = no slide
  // when another task's height changes, parent passes new center and we animate that
  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      top: centerPositionAnimation.value - (cardHeightAnimation.value / 2),
      opacity: fadeAnimation.value, // fade animation for drag feedback
    };
  });

  // keep basePosition (current top) in sync for drag callbacks - derived from center and height
  useAnimatedReaction(
    () => ({ center: centerPositionAnimation.value, height: cardHeightAnimation.value }),
    ({ center, height }) => {
      basePosition.value = center - (height / 2);
    },
    []
  );
  
  // create animated style for drag indicator
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
      // during initial layout, sync displayed height to measured immediately to prevent short-then-grow flash
      if (Date.now() - mountTimeRef.current < 2000) {
        cardHeightAnimation.value = height;
      }
      // report the measured height to parent so timeline spacing adjusts
      if (onHeightMeasuredRef.current) {
        onHeightMeasuredRef.current(height);
        lastReportedHeight.value = height;
      }
    }
  };

  // reset height when task content changes (triggers remeasurement)
  useEffect(() => {
    setMeasuredContentHeight(null);
    lastReportedHeight.value = null;
  }, [task.title, duration, task.id]);

  // update center position when prop changes (e.g. when task above expands) - animates smooth move
  // when only THIS task's height changes, centerPosition prop is unchanged so this effect doesn't run = no slide
  useEffect(() => {
    previousCenterRef.current = centerPosition;
    centerPositionAnimation.value = centerPosition; // always set so worklet has latest
    translateY.value = 0; // reset translation when position changes
    
    // if we're waiting for reposition after drag, set center and fade immediately (no animation)
    if (waitingForRepositionRef.current) {
      waitingForRepositionRef.current = false;
      if (fadeInTimeoutRef.current) {
        clearTimeout(fadeInTimeoutRef.current);
        fadeInTimeoutRef.current = null;
      }
      cancelAnimation(centerPositionAnimation);
      cancelAnimation(fadeAnimation);
      centerPositionAnimation.value = centerPosition;
      fadeAnimation.value = 1;
    } else if (Date.now() - mountTimeRef.current < 2000 || centerUpdateCountRef.current < 30) {
      // initial load - set immediately so timeline appears in final position (no animation)
      if (centerUpdateCountRef.current < 30) centerUpdateCountRef.current += 1;
      cancelAnimation(centerPositionAnimation);
      centerPositionAnimation.value = centerPosition;
    } else {
      // animate center when it changes (e.g. task above expanded)
      centerPositionAnimation.value = withTiming(centerPosition, { duration: 75 });
    }
  }, [centerPosition]);
  
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
  // when selectionMode: disable drag - use empty gesture so tap still works via TouchableOpacity
  const combinedGesture = selectionMode ? Gesture.Tap() : Gesture.Simultaneous(longPressGesture, panGesture);

  return (
    <GestureDetector gesture={combinedGesture}>
      <AnimatedReanimated.View
        style={[
          styles.container,
          styles.containerPadding,
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
        {/* height is fixed at base height */}
        {/* background color is task color, icon color is primary */}
        {task.icon && (
          <AnimatedReanimated.View style={[styles.iconContainer, styles.iconContainerPadding, { height: minCardHeight }, overlapBorderRadius, animatedDragIndicatorStyle]}>
            <TaskIcon icon={task.icon} color={themeColors.background.invertedPrimary()} size={20} />
          </AnimatedReanimated.View>
        )}

        {/* content column - contains task content */}
        <AnimatedReanimated.View
          style={[
            styles.content,
            overlapBorderRadius,
            animatedContentStyle,
            animatedDragIndicatorStyle,
          ]}
          onLayout={handleContentLayout}
        >
          <Animated.View style={[styles.combinedContainer, styles.combinedContainerPadding, { height: minCardHeight }, overlapBorderRadius]}>
            <TouchableOpacity
              style={styles.touchableContent}
              onPress={handleTaskPress}
              activeOpacity={0.7}
            >
              <View style={styles.checkboxWrapper}>
                {/* single TimelineCheckbox: completion when !selectionMode, selection when selectionMode; animates shape on enter/exit */}
                <TimelineCheckbox
                  task={task}
                  onTaskComplete={onTaskComplete}
                  onTaskCompleteImmediate={onTaskCompleteImmediate}
                  onDisplayChange={setDisplayCompleted}
                  selectionMode={selectionMode}
                  isSelected={isSelected}
                  onSelect={selectionMode ? onPress : undefined}
                />
              </View>
              <View style={styles.taskContent}>
                {/* time display above title - only when in overlapping tasks */}
                {timeRangeText ? (
                  <View style={styles.timeRangeRow}>
                    <Text style={styles.timeRange}>{timeRangeText}</Text>
                  </View>
                ) : null}
                <View style={styles.titleRow}>
                  <AnimatedText
                    style={[styles.title, titleAnimatedStyle]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    onTextLayout={handleTitleLayout}
                  >
                    {task.title}
                  </AnimatedText>
                  <View style={styles.indicatorsRow}>
                    {subtasksCount > 0 && (
                      <View style={styles.subtaskCountRow}>
                        <Checkbox
                          size={CHECKBOX_SIZE_SMALL}
                          checked={allSubtasksComplete}
                          disabled
                        />
                        <Text style={styles.subtaskCount}>
                          {completedSubtasksCount}/{subtasksCount}
                        </Text>
                      </View>
                    )}
                    {recurrenceLabel && (
                      <View style={styles.recurrenceRow}>
                        <RepeatIcon
                          size={CHECKBOX_SIZE_SMALL}
                          color={themeColors.text.tertiary()}
                        />
                        <Text style={styles.recurrenceText}>{recurrenceLabel}</Text>
                      </View>
                    )}
                  </View>
                  {/* strikethrough overlay - absolute so it doesn't affect layout of title + metadata */}
                  <View pointerEvents="none" style={styles.strikeOverlay}>
                    {titleLines.map((line, index) => (
                      <StrikethroughLine
                        key={index}
                        line={line}
                        strikeProgress={strikeProgress}
                        lineStyle={styles.strikethroughLine}
                        yOffset={timeRangeText ? 1 : 9}
                      />
                    ))}
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </AnimatedReanimated.View>
      </AnimatedReanimated.View>
    </GestureDetector>
  );
}, timelineItemPropsAreEqual);

// create dynamic styles using theme colors and typography
const createStyles = (
  themeColors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useTypography>,
  taskColor: string
) => StyleSheet.create({
  // --- LAYOUT STYLES ---
  // main container for the task item
  // row layout: icon container on left, content column on right
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  // icon container - separate background for the icon
  // positioned on the left in the row layout
  // background color is task color, icon color is primary
  iconContainer: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: taskColor,
    borderRadius: 24,
    marginRight: 12,
  },

  // content column - contains task content
  content: {
    flex: 1, // take up remaining available width within container
    flexDirection: 'column', // stack combinedContainer and expandedArea vertically
    position: 'relative',
    overflow: 'visible',
    borderRadius: 24, // outer border radius for the entire card
  },
  
  // combined container for task content - fixed height, stays at top
  // borderRadius here so corners render
  combinedContainer: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'stretch',
    position: 'relative',
    backgroundColor: themeColors.background.primarySecondaryBlend(),
    borderRadius: 24,
  },
  
  // touchable content area - row: checkbox on left, task content on right (matches TaskCard layout)
  touchableContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12, // checkbox-to-title spacing - matches TaskCard checkboxWrapper marginRight: 12
  },

  // checkbox wrapper - left of task content
  checkboxWrapper: {
    width: CHECKBOX_SIZE_DEFAULT,
    height: CHECKBOX_SIZE_DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // task content container - title and indicators, right of checkbox
  taskContent: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
  },

  // time range row - above title when in overlapping tasks (matches DragOverlay)
  timeRangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },

  // title row - title on left, subtask and recurrence indicators on the right (same line)
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },

  // indicators on the right - subtask count and recurrence label
  indicatorsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },

  // absolute overlay that sits on top of the title row so we can draw animated strikethrough lines
  // without changing the layout of the title + metadata
  strikeOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },

  // base style for strikethrough - left/top set per-line by StrikethroughLine using onTextLayout data
  strikethroughLine: {
    position: 'absolute',
    height: 2,
    marginTop: 1, // slight offset so line visually matches text baseline
    backgroundColor: themeColors.text.secondary(),
    borderRadius: 1,
  },

  // subtask count - checkbox icon + 0/X text
  subtaskCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  // recurrence - repeat icon + label
  recurrenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  // --- PADDING STYLES ---
  containerPadding: {
    paddingLeft: Paddings.none,
    paddingRight: Paddings.card,
  },
  iconContainerPadding: {
    paddingHorizontal: Paddings.cardCompact,
  },
  combinedContainerPadding: {
    paddingHorizontal: Paddings.card,
    paddingVertical: Paddings.listItemVertical,
  },

  // --- TYPOGRAPHY STYLES ---
  timeRange: {
    ...typography.getTextStyle('body-medium'),
    color: themeColors.text.tertiary(),
  },
  title: {
    ...typography.getTextStyle('heading-4'),
    color: themeColors.text.primary(),
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  subtaskCount: {
    ...typography.getTextStyle('body-medium'),
    color: themeColors.text.tertiary(),
  },
  recurrenceText: {
    ...typography.getTextStyle('body-medium'),
    color: themeColors.text.tertiary(),
  },
});

export default TimelineItem;
