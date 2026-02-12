/**
 * TimelineCheckbox Component
 * 
 * Displays a completion checkbox for timeline tasks.
 * Features animated fill and scale animations on press.
 * Positioned absolutely on the right side of the task card.
 * 
 * This component is used by TimelineItem to show task completion status.
 */

import React, { useRef, useEffect, useMemo } from 'react';
import { TouchableOpacity, Animated, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/hooks/useColorPalette';
import { Task } from '@/types';

interface TimelineCheckboxProps {
  // task to display checkbox for
  task: Task;
  // task color for checkbox fill
  taskColor: string;
  // callback when checkbox is pressed
  onTaskComplete?: (task: Task) => void;
  // minimum card height for vertical centering
  minCardHeight: number;
}

/**
 * TimelineCheckbox Component
 * 
 * Renders an animated checkbox that shows task completion status.
 * Animates fill color and scale on press for visual feedback.
 */
export default function TimelineCheckbox({
  task,
  taskColor,
  onTaskComplete,
  minCardHeight,
}: TimelineCheckboxProps) {
  const themeColors = useThemeColors();

  // animated value for checkbox fill animation (0 = unchecked/grey, 1 = checked/task color)
  const checkboxFillAnimation = useRef(new Animated.Value(task.isCompleted ? 1 : 0)).current;
  
  // animated value for checkbox scale animation (for tap feedback)
  const checkboxScaleAnimation = useRef(new Animated.Value(1)).current;

  // update animation when task completion status changes
  useEffect(() => {
    Animated.timing(checkboxFillAnimation, {
      toValue: task.isCompleted ? 1 : 0,
      duration: 200, // animation duration in milliseconds
      useNativeDriver: false, // backgroundColor animation doesn't support native driver
    }).start();
  }, [task.isCompleted, checkboxFillAnimation]);

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

  // create dynamic styles using theme colors
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);

  return (
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
  );
}

// create dynamic styles using theme colors
const createStyles = (
  themeColors: ReturnType<typeof useThemeColors>
) => StyleSheet.create({
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
    zIndex: 20,
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
});

