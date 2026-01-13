/**
 * TimeLabel Component
 * 
 * Displays a time label on the left side of the timeline.
 * Shows the time in a readable format (e.g., "9:00 AM").
 * 
 * This component is used by TimelineView to display time markers.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';

interface TimeLabelProps {
  // time string in HH:MM format
  time: string;
  // Y position on the timeline in pixels
  position: number;
  // whether this is an end time label (for tasks with duration)
  isEndTime?: boolean;
  // whether this is a drag label (shown during drag)
  isDragLabel?: boolean;
}

/**
 * TimeLabel Component
 * 
 * Renders a time label at the specified position on the timeline.
 */
export default function TimeLabel({ time, position, isEndTime = false, isDragLabel = false }: TimeLabelProps) {
  const themeColors = useThemeColors();
  const typography = useTypography();

  // create dynamic styles using theme colors and typography
  const styles = useMemo(() => createStyles(themeColors, typography), [themeColors, typography]);

  // format time for display (24-hour format)
  const formattedTime = useMemo(() => {
    const [hours, minutes] = time.split(':').map(Number);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }, [time]);

  return (
    <View style={[styles.container, { top: position - 10 }]}>
      <Text style={[
        styles.timeText,
        isEndTime && styles.endTimeText,
        isDragLabel && styles.dragTimeText
      ]}>{formattedTime}</Text>
    </View>
  );
}

// create dynamic styles using theme colors and typography
const createStyles = (
  themeColors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useTypography>
) => StyleSheet.create({
  // container for the time label
  container: {
    position: 'absolute',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: 4,
    minHeight: 16,
  },

  // time text styling - more compact
  timeText: {
    // use smaller font size for compact display
    fontSize: 11,
    color: themeColors.text.tertiary(),
    fontWeight: '600',
    lineHeight: 14,
  },

  // end time text styling (lighter/smaller for end times)
  endTimeText: {
    fontSize: 9,
    opacity: 0.7,
    lineHeight: 12,
  },

  // drag time text styling (highlighted during drag)
  dragTimeText: {
    color: themeColors.interactive.primary(),
    fontWeight: '700',
    fontSize: 11,
    lineHeight: 14,
  },
});

