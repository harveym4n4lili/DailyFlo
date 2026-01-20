/**
 * TaskCard Component
 * 
 * This component displays an individual task in a card format.
 * It orchestrates smaller sub-components to display task information and handle interactions.
 * 
 * This component demonstrates the composition pattern - it composes smaller components
 * (TaskCardContent, TaskMetadata, TaskIndicators, etc.) into a complete task card.
 * 
 * Swipe Gestures:
 * - Swipe left: triggers onSwipeLeft callback (e.g., for complete action)
 * - Swipe right: triggers onSwipeRight callback (e.g., for delete action)
 * - Swipe threshold: 60 pixels minimum distance to trigger action
 * - Smooth animations: card moves with finger and springs back to center
 * 
 * This component demonstrates the flow from Redux store → Component → User interaction.
 */

import React, { useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';

// TYPES FOLDER IMPORTS - TypeScript type definitions
import { Task } from '@/types';

// import color palette system for consistent theming
import { useThemeColors } from '@/hooks/useColorPalette';

// import utility functions for task formatting and colors
import { getTaskColorValue } from '@/utils/taskColors';

// import reusable swipeable card component
import { SwipeableCard, SwipeAction } from '../SwipeableCard';

// import task card sub-components
import TaskCardContent from './TaskCardContent';
import TaskMetadata from './TaskMetadata';
import TaskIndicators from './TaskIndicators';
import CompletionIndicator from './CompletionIndicator';
import TaskIcon from './TaskIcon';

/**
 * Props interface for TaskCard component
 * 
 * This defines what data the component needs to display a task
 * and what functions it can call when the user interacts with it.
 */
export interface TaskCardProps {
  // task data to display
  task: Task;

  // callback functions for user interactions
  onPress?: (task: Task) => void; // called when user taps the card
  onComplete?: (task: Task) => void; // called when user marks task as complete
  onEdit?: (task: Task) => void; // called when user wants to edit task
  onDelete?: (task: Task) => void; // called when user wants to delete task

  // swipe gesture callback functions
  onSwipeLeft?: (task: Task) => void; // called when user swipes left on the card
  onSwipeRight?: (task: Task) => void; // called when user swipes right on the card

  // optional display options
  showCategory?: boolean; // whether to show the list/category name
  compact?: boolean; // whether to use compact layout
}

/**
 * TaskCard Component
 * 
 * This is a presentational component that receives task data as props
 * and displays it in a styled card format. It doesn't directly interact
 * with Redux - instead, it calls callback functions that are passed down
 * from parent components that do handle Redux state.
 * 
 * This component uses composition to build the task card from smaller components:
 * - SwipeableCard: Adds swipe gesture functionality
 * - TaskCardContent: Displays icon and title
 * - TaskMetadata: Displays date/time/duration
 * - TaskIndicators: Displays routine type and list/inbox status
 * - CompletionIndicator: Displays completion checkmark
 */
export default function TaskCard({
  task,
  onPress,
  onComplete,
  onEdit,
  onDelete,
  onSwipeLeft,
  onSwipeRight,
  showCategory = false,
  compact = false,
}: TaskCardProps) {
  // COLOR PALETTE USAGE - Getting theme-aware colors
  const themeColors = useThemeColors();

  // get task color value from color palette system
  const taskColor = useMemo(() => getTaskColorValue(task.color), [task.color]);

  // create dynamic styles using the color palette system
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);

  // configure swipe actions for SwipeableCard
  // left swipe (negative translation) = complete action (green)
  const leftSwipeAction: SwipeAction | undefined = onSwipeLeft
    ? {
        backgroundColor: '#34C759', // iOS green color for completion
        icon: 'checkmark',
        iconColor: 'white',
        iconSize: 24,
      }
    : undefined;

  // right swipe (positive translation) = delete action (red)
  const rightSwipeAction: SwipeAction | undefined = onSwipeRight
    ? {
        backgroundColor: '#FF3B30', // iOS red color
        icon: 'trash-outline',
        iconColor: 'white',
        iconSize: 24,
      }
    : undefined;

  // handle swipe left callback - complete task directly (no confirmation)
  const handleSwipeLeft = () => {
    if (onSwipeLeft) {
      onSwipeLeft(task);
    }
  };

  // handle swipe right callback
  const handleSwipeRight = () => {
    if (onSwipeRight) {
      onSwipeRight(task);
    }
  };

  return (
    <View style={styles.cardContainer}>
      {/* swipeable card wrapper - adds swipe gesture functionality */}
      <SwipeableCard
        onSwipeLeft={handleSwipeLeft}
        onSwipeRight={handleSwipeRight}
        swipeThreshold={60}
        leftAction={leftSwipeAction}
        rightAction={rightSwipeAction}
        borderRadius={28}
      >
        {/* main card touchable area - applies conditional styles based on compact and completion state */}
        <TouchableOpacity
          style={[
            styles.card,
            compact && styles.compactCard, // conditionally applies compact padding when compact prop is true
            task.isCompleted && styles.completedCard, // conditionally applies transparent background when task is completed
          ]}
          onPress={() => onPress?.(task)} // calls onPress callback with task data when tapped
          activeOpacity={1} // prevent background opacity change
        >
          {/* row container for icon and content - ensures proper alignment */}
          <View style={styles.contentRow}>
            {/* task icon on the left - conditionally rendered */}
            {task.icon && (
              <View style={styles.iconWrapper}>
                <TaskIcon icon={task.icon} color={taskColor} />
              </View>
            )}

            {/* content column - title and metadata */}
            <View style={styles.contentColumn}>
              {/* main content area - title */}
              <TaskCardContent
                task={task}
                taskColor={taskColor}
                compact={compact}
              />

              {/* task metadata - date, time, duration */}
              <TaskMetadata
                dueDate={task.dueDate}
                time={task.time}
                duration={task.duration}
                isCompleted={task.isCompleted}
                showCategory={showCategory}
                listId={task.listId}
              />
            </View>
          </View>
        </TouchableOpacity>

        {/* completion indicator - shows green tick icon when completed */}
        <CompletionIndicator isCompleted={task.isCompleted} />

        {/* bottom indicators - routine type and list/inbox status */}
        <TaskIndicators routineType={task.routineType} listId={task.listId} />
      </SwipeableCard>
    </View>
  );
}

// create dynamic styles using the color palette system
const createStyles = (themeColors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    // card container with margin bottom for spacing
    cardContainer: {
      width: '100%', // ensure full width
      marginBottom: 20, // spacing between cards
      position: 'relative', // needed for absolute positioning
      alignItems: 'stretch', // ensure children take full width
    },

    // main card container
    card: {
      width: '100%', // ensure full width
      backgroundColor: themeColors.background.elevated(), // use theme-aware elevated background
      borderRadius: 28, // border radius of 28 for modern card appearance (increased by 8px)
      padding: 16,
      paddingRight: 56, // add right padding to avoid overlap with completion indicator (24px indicator + 16px margin + 16px spacing)
      position: 'relative', // needed for absolute positioning of completion indicator and bottom indicators
      overflow: 'visible', // ensure content is visible
    },

    // row container for icon and content - ensures proper alignment
    contentRow: {
      flexDirection: 'row', // horizontal layout for icon and content
      alignItems: 'center', // vertically center icon with content
    },

    // icon wrapper - provides spacing for icon
    iconWrapper: {
      marginRight: 16, // spacing between icon and content
    },

    // content column - contains title and metadata
    contentColumn: {
      flex: 1, // take remaining space
      flexDirection: 'column', // vertical layout for title and metadata
    },

    // compact version for smaller displays
    compactCard: {
      padding: 12,
      paddingRight: 52, // add right padding for compact version too (24px indicator + 16px margin + 12px spacing)
      marginBottom: 8,
    },

    // completed task styling
    completedCard: {
      backgroundColor: themeColors.background.primary(), // use primary background color (same as today screen)
    },
  });

