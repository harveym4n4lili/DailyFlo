/**
 * TaskMetadata Component
 * 
 * Displays task metadata including due date, time, and duration.
 * Formats dates intelligently (Today, Tomorrow, X days ago) and applies
 * color logic for overdue dates (red) vs normal dates (tertiary).
 * 
 * This component is used by TaskCard to display date/time information.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors, useSemanticColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { formatDateWithTags, formatMetadataForToday, isOverdue } from '@/utils/taskFormatters';

interface TaskMetadataProps {
  // due date ISO string or null/undefined
  dueDate: string | null | undefined;
  // optional time string (format: "HH:MM")
  time?: string;
  // optional duration in minutes
  duration?: number;
  // whether the task is completed
  isCompleted: boolean;
  // whether to show category information
  showCategory?: boolean;
  // optional list ID
  listId?: string | null;
  // when 'today': hides "Today" text, shows time as "09:00 - 09:30" instead of "09:00 • 30 min"
  metadataVariant?: 'default' | 'today';
}

/**
 * TaskMetadata Component
 * 
 * Renders formatted date/time/duration information with appropriate colors.
 * Overdue dates are shown in red, completed tasks use tertiary color.
 */
export default function TaskMetadata({
  dueDate,
  time,
  duration,
  isCompleted,
  showCategory = false,
  listId,
  metadataVariant = 'default',
}: TaskMetadataProps) {
  const themeColors = useThemeColors();
  const semanticColors = useSemanticColors();
  const typography = useTypography();

  // create dynamic styles using theme colors and typography
  const styles = createStyles(themeColors, typography);

  // get formatted metadata text based on variant
  const formattedText =
    metadataVariant === 'today'
      ? formatMetadataForToday(dueDate ?? null, time, duration)
      : formatDateWithTags(dueDate ?? null, time, duration);

  // determine text color based on completion and overdue status
  // completed tasks use tertiary color, overdue dates use red, others use tertiary
  const getTextColor = () => {
    if (isCompleted) {
      return themeColors.text.tertiary();
    }
    if (isOverdue(dueDate)) {
      return semanticColors.error(); // red for overdue
    }
    return themeColors.text.tertiary(); // tertiary for all other dates
  };

  // don't render metadata section if we have nothing to show
  if (!showCategory && !formattedText) {
    return null;
  }

  return (
    <View style={styles.metadata}>
      {/* category section - conditionally rendered only if showCategory prop is true */}
      {showCategory && (
        <View style={styles.metadataItem}>
          <Text style={styles.metadataLabel}>List:</Text>
          <Text style={[styles.metadataValue, { color: themeColors.text.tertiary() }]}>
            {listId ? 'In List' : 'Inbox'} {/* conditionally shows 'In List' or 'Inbox' based on listId */}
          </Text>
        </View>
      )}

      {/* due date section - only show when we have text to display */}
      {formattedText ? (
        <View style={styles.bottomMetadata}>
          <View style={styles.metadataItem}>
            <Text style={[styles.metadataValue, { color: getTextColor() }]}>
              {formattedText}
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

// create dynamic styles using theme colors and typography
const createStyles = (
  themeColors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useTypography>
) => StyleSheet.create({
  // --- LAYOUT STYLES ---
  metadata: {
    flexDirection: 'column', // vertical layout for category and bottom metadata
    marginTop: 4, // spacing from title (reduced for closer spacing)
  },

  // individual metadata item
  metadataItem: {
    flexDirection: 'row', // horizontal layout for label and value
    alignItems: 'center', // center align
  },

  // bottom metadata container (due date only)
  bottomMetadata: {
    flexDirection: 'row', // horizontal layout
    alignItems: 'center',
  },

  // --- TYPOGRAPHY STYLES ---
  metadataLabel: {
    ...typography.getTextStyle('body-large'),
    color: themeColors.text.tertiary(),
    marginRight: 4,
  },
  metadataValue: {
    ...typography.getTextStyle('body-medium'),
  },
});

