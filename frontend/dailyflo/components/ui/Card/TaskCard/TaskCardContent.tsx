/**
 * TaskCardContent Component
 * 
 * Displays the main content area of a task card, including the task icon and title.
 * Handles press interactions and applies completion styling when the task is completed.
 * 
 * This component is used by TaskCard to display the core task information.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Task } from '@/types';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';

interface TaskCardContentProps {
  // task data to display
  task: Task;
  // task color value (hex string) - not used but kept for consistency
  taskColor: string;
  // whether to use compact layout - not used but kept for consistency
  compact?: boolean;
}

/**
 * TaskCardContent Component
 * 
 * Renders the main content area with icon and title. Applies completion styling
 * when the task is completed (strikethrough, dimmed color).
 * 
 * Note: Press handling is done by the parent TouchableOpacity, so this component
 * is just a View to avoid nested pressables.
 */
export default function TaskCardContent({
  task,
  taskColor,
  compact = false,
}: TaskCardContentProps) {
  const themeColors = useThemeColors();
  const typography = useTypography();

  // create dynamic styles using theme colors and typography
  const styles = createStyles(themeColors, typography);

  return (
    <View style={styles.content}>
      {/* task title - conditionally applies strikethrough styling when completed */}
      {/* single line with ellipsis if it reaches second line */}
      <Text
        style={[
          styles.title,
          task.isCompleted && styles.completedTitle, // strikethrough and dimmed color when completed
        ]}
        numberOfLines={1} // limits title to single line
        ellipsizeMode="tail" // adds ellipsis at end if text overflows
      >
        {task.title}
      </Text>
    </View>
  );
}

// create dynamic styles using theme colors and typography
const createStyles = (
  themeColors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useTypography>
) => StyleSheet.create({
  // content area (title only)
  content: {
    flex: 1, // take available space
  },

  // task title text styling
  // using typography system for consistent text styling
  title: {
    // use the heading-4 text style from typography system (16px, bold, satoshi font)
    ...typography.getTextStyle('heading-4'),
    // use theme-aware primary text color from color system
    color: themeColors.text.primary(),
    marginBottom: 2, // spacing between title and metadata (reduced for closer spacing)
  },

  // completed title styling
  completedTitle: {
    textDecorationLine: 'line-through', // strikethrough for completed tasks
    color: themeColors.text.secondary(), // dimmed color for completed
  },
});

