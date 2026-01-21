/**
 * TimelineSubtaskList Component
 * 
 * Displays an expandable list of subtasks for a timeline task.
 * Shows subtasks in rows with checkboxes that can be toggled.
 * Height animates smoothly when expanded/collapsed.
 * 
 * This component is used by TimelineItem to show task subtasks.
 */

import React, { useMemo, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { Task } from '@/types';
import { useAppDispatch } from '@/store';
import { updateTask } from '@/store/slices/tasks/tasksSlice';

interface TimelineSubtaskListProps {
  // task to display subtasks for
  task: Task;
  // whether subtasks are currently expanded
  isExpanded: boolean;
  // task color for completed subtask checkboxes
  taskColor: string;
}

/**
 * TimelineSubtaskList Component
 * 
 * Renders an animated list of subtasks that expands/collapses smoothly.
 * Each subtask can be toggled to mark as complete/incomplete.
 */
export default function TimelineSubtaskList({
  task,
  isExpanded,
  taskColor,
}: TimelineSubtaskListProps) {
  const themeColors = useThemeColors();
  const typography = useTypography();
  
  // get Redux dispatch function for updating tasks
  const dispatch = useAppDispatch();

  // calculate subtask count for dynamic expansion height
  // each subtask adds 32px to the expanded height
  const subtasksCount = useMemo(() => {
    return task.metadata?.subtasks?.length ?? 0;
  }, [task.metadata?.subtasks?.length]);

  // animated value for expanded area height using reanimated - runs on native thread for better performance
  // 0 when collapsed, 32px per subtask + 12px padding when expanded
  const expandedAreaHeightAnimation = useSharedValue(0);

  // create animated style for expanded area height using reanimated
  // this runs on native thread for smooth 60fps animation on iOS
  const animatedExpandedAreaStyle = useAnimatedStyle(() => {
    return {
      height: expandedAreaHeightAnimation.value,
    };
  });

  // animate expanded area height when expansion state changes
  // height is calculated as 32px per subtask + 12px padding
  // using withTiming for smooth animation - runs on native thread
  useEffect(() => {
    const expandedHeight = isExpanded ? (subtasksCount * 32) + 12 : 0;
    // use withTiming for smooth animation - runs on native thread
    // duration 200ms for smooth, visible expansion animation
    expandedAreaHeightAnimation.value = withTiming(expandedHeight, {
      duration: 75,
    });
  }, [isExpanded, subtasksCount]);

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

  // create dynamic styles using theme colors and typography
  const styles = useMemo(() => createStyles(themeColors, typography), [themeColors, typography]);

  // don't render if no subtasks
  if (subtasksCount === 0) return null;

  return (
    <Animated.View
      style={[
        styles.expandedArea,
        animatedExpandedAreaStyle, // animate from 0 to (subtasksCount * 32px + 12px) using reanimated
        { overflow: 'hidden' }, // hide subtasks when collapsed
      ]}
    >
      {/* render each subtask in a 32px tall row */}
      {isExpanded && task.metadata?.subtasks && task.metadata.subtasks.length > 0 && (
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
  );
}

// create dynamic styles using theme colors and typography
const createStyles = (
  themeColors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useTypography>
) => StyleSheet.create({
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
});

