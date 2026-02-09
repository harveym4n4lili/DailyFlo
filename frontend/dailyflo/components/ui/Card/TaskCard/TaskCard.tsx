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
import { useSwipeAnimation } from '../SwipeableCard/SwipeableCard';

// import task card sub-components
import TaskCardContent from './TaskCardContent';
import TaskMetadata from './TaskMetadata';
import TaskIndicators from './TaskIndicators';
import TaskIcon from './TaskIcon';

// import checkbox component
import { Checkbox } from '@/components/ui/button';

// import border components
import { DashedSeparator } from '@/components/ui/borders';

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
  showIcon?: boolean; // whether to show the task icon on the left (default true)
  showIndicators?: boolean; // whether to show bottom-right list/routine indicators (default true)
  showMetadata?: boolean; // whether to show date/time/duration metadata (default true)
  metadataVariant?: 'default' | 'today'; // 'today' = no date text, time as "09:00 - 09:30"
  cardSpacing?: number; // spacing between cards (default 20)
  showDashedSeparator?: boolean; // whether to show a dashed separator below the card (default false)
  separatorPaddingHorizontal?: number; // horizontal padding for separator to match list padding (default 0)
  hideBackground?: boolean; // whether to hide the card background (default false)
  removeInnerPadding?: boolean; // whether to remove horizontal padding inside the card (default false)
  checkboxSize?: number; // size of the checkbox (default 24)
  isLastItem?: boolean; // whether this is the last item in the list (default false)
  isFirstItem?: boolean; // whether this is the first item in the list (default false)
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
 * - Checkbox: Displays completion checkbox on the left
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
  showIcon = true,
  showIndicators = true,
  showMetadata = true,
  metadataVariant = 'default',
  cardSpacing = 20,
  showDashedSeparator = false,
  separatorPaddingHorizontal = 0,
  hideBackground = false,
  removeInnerPadding = false,
  checkboxSize = 16,
  isLastItem = false,
  isFirstItem = false,
}: TaskCardProps) {
  // COLOR PALETTE USAGE - Getting theme-aware colors
  const themeColors = useThemeColors();

  // get task color value from color palette system
  const taskColor = useMemo(() => getTaskColorValue(task.color), [task.color]);

  // create dynamic styles using the color palette system
  const styles = useMemo(() => createStyles(themeColors, cardSpacing), [themeColors, cardSpacing]);

  // get translateX animation value from SwipeableCard context to animate border radius
  const translateX = useSwipeAnimation();

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
        borderRadius={0}
      >
        {/* main card touchable area - applies conditional styles based on compact and completion state */}
        <TouchableOpacity
          style={[
            styles.card,
            compact && styles.compactCard, // conditionally applies compact padding when compact prop is true
            task.isCompleted && styles.completedCard, // conditionally applies transparent background when task is completed
            hideBackground && styles.transparentBackground, // conditionally applies transparent background when hideBackground is true
            removeInnerPadding && styles.noInnerPadding, // conditionally removes horizontal padding when removeInnerPadding is true
            // animate border radius based on swipe distance - increases as card is swiped
            translateX && {
              borderRadius: translateX.interpolate({
                inputRange: [-200, 0, 200], // swipe range from -200px to +200px
                outputRange: [28, 12, 28], // border radius animates from 12px (initial) to 28px when swiped
                extrapolate: 'clamp', // clamp values outside the range
              }),
            },
          ]}
          onPress={() => onPress?.(task)} // calls onPress callback with task data when tapped
          activeOpacity={1} // prevent background opacity change
        >
          {/* row container for checkbox, icon and content - ensures proper alignment */}
          <View style={styles.contentRow}>
            {/* checkbox on the left - for task completion */}
            <View style={styles.checkboxWrapper}>
              <Checkbox
                checked={task.isCompleted}
                onPress={() => onComplete?.(task)}
                size={checkboxSize}
                borderRadius={6}
              />
            </View>

            {/* task icon on the left - conditionally rendered when showIcon prop is true */}
            {showIcon && task.icon && (
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

              {/* task metadata - date, time, duration (hidden when showMetadata is false) */}
              {showMetadata && (
                <TaskMetadata
                  dueDate={task.dueDate}
                  time={task.time}
                  duration={task.duration}
                  isCompleted={task.isCompleted}
                  showCategory={showCategory}
                  listId={task.listId}
                  metadataVariant={metadataVariant}
                />
              )}
            </View>
          </View>
        </TouchableOpacity>

        {/* bottom indicators - routine type and list/inbox status (hidden when showIndicators is false) */}
        {showIndicators && (
          <TaskIndicators routineType={task.routineType} listId={task.listId} />
        )}
      </SwipeableCard>
      
      {/* dashed separator below card - shown when showDashedSeparator is true and not the last item */}
      {showDashedSeparator && !isLastItem && (
        <DashedSeparator 
          paddingHorizontal={separatorPaddingHorizontal} // separator padding matches list padding
        />
      )}
    </View>
  );
}

// create dynamic styles using the color palette system
const createStyles = (
  themeColors: ReturnType<typeof useThemeColors>,
  cardSpacing: number
) => {
  const styles = StyleSheet.create({
    // card container with margin bottom for spacing
    cardContainer: {
      width: '100%', // ensure full width
      marginBottom: cardSpacing, // spacing between cards (configurable via prop)
      position: 'relative', // needed for absolute positioning
      alignItems: 'stretch', // ensure children take full width
    },

    // main card container
    card: {
      width: '100%', // ensure full width
      backgroundColor: themeColors.background.elevated(), // use theme-aware elevated background
      borderRadius: 0, // no border radius for flat card appearance
      padding: 16,
      paddingRight: 56, // add right padding to avoid overlap with completion indicator (24px indicator + 16px margin + 16px spacing)
      position: 'relative', // needed for absolute positioning of completion indicator and bottom indicators
      overflow: 'visible', // ensure content is visible
    },

    // row container for checkbox, icon and content - ensures proper alignment
    contentRow: {
      flexDirection: 'row', // horizontal layout for checkbox, icon and content
      alignItems: 'center', // vertically center all items (checkbox, icon, content)
    },

    // checkbox wrapper - provides spacing for checkbox and ensures vertical centering
    checkboxWrapper: {
      marginRight: 12, // spacing between checkbox and icon/content
      justifyContent: 'center', // vertically center checkbox within wrapper
      alignItems: 'center', // horizontally center checkbox within wrapper
      alignSelf: 'center', // ensure wrapper itself is centered vertically in the row
    },

    // icon wrapper - provides spacing for icon
    iconWrapper: {
      marginRight: 16, // spacing between icon and content
    },

    // content column - contains title and metadata
    contentColumn: {
      flex: 1, // take remaining space
      flexDirection: 'column', // vertical layout for title and metadata
      justifyContent: 'center', // vertically center content within the column
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

    // transparent background styling (when hideBackground is true)
    transparentBackground: {
      backgroundColor: 'transparent', // transparent background to hide card background
    },

    // no inner padding styling (when removeInnerPadding is true)
    noInnerPadding: {
      paddingHorizontal: 0, // remove horizontal padding inside the card
      paddingLeft: 0,
      paddingRight: 0,
      paddingTop: 16, // maintain vertical padding of 16px
      paddingBottom: 16, // maintain vertical padding of 16px
    },
  });

  return styles;
};

