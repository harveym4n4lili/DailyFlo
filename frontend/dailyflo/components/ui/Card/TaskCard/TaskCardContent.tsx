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
import { formatTimeRange } from '@/utils/taskFormatters';

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

  // format time label - shows time range if available
  const timeLabel = formatTimeRange(task.time, task.duration);

  return (
    <View style={styles.content}>
      {/* row container for title and time label */}
      <View style={styles.titleRow}>
        {/* task title - conditionally applies strikethrough styling when completed */}
        {/* can display up to 2 lines with ellipsis if it reaches third line */}
        <Text
          style={[
            styles.title,
            task.isCompleted && styles.completedTitle, // strikethrough and dimmed color when completed
          ]}
          numberOfLines={2} // limits title to 2 lines
          ellipsizeMode="tail" // adds ellipsis at end if text overflows
        >
          {task.title}
        </Text>

        {/* time label on the right - shows time range if available */}
        {timeLabel ? (
          <Text
            style={[
              styles.timeLabel,
              task.isCompleted && styles.completedTimeLabel, // dimmed color when completed
            ]}
            numberOfLines={1}
          >
            {timeLabel}
          </Text>
        ) : (
          <View style={styles.timeLabelPlaceholder} />
        )}
      </View>
    </View>
  );
}

// create dynamic styles using theme colors and typography
const createStyles = (
  themeColors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useTypography>
) => StyleSheet.create({
  // --- LAYOUT STYLES ---
  content: {
    flex: 1, // take available space
  },

  // row container for title and time label
  titleRow: {
    flexDirection: 'row', // horizontal layout for title and time label
    alignItems: 'center', // vertically center title and time label
    justifyContent: 'space-between', // space between title and time label
    gap: 12, // spacing between title and time label
  },

  // completed title styling
  completedTitle: {
    textDecorationLine: 'line-through', // strikethrough for completed tasks
    color: themeColors.text.secondary(), // dimmed color for completed
  },

  // completed time label styling
  completedTimeLabel: {
    color: themeColors.text.tertiary(), // dimmed color for completed
    opacity: 0.6, // additional dimming for completed tasks
  },

  // placeholder for time label when no time is available (maintains spacing)
  timeLabelPlaceholder: {
    width: 90, // same width as time label to maintain consistent layout
    flexShrink: 0, // prevent placeholder from shrinking
  },

  // --- TYPOGRAPHY STYLES ---
  title: {
    ...typography.getTextStyle('heading-4'),
    color: themeColors.text.primary(),
    marginTop: 1,
    flex: 1,
    flexShrink: 1,
  },
  timeLabel: {
    ...typography.getTextStyle('body-medium'),
    color: themeColors.text.tertiary(),
    width: 90,
    textAlign: 'right',
    flexShrink: 0,
  },
});

