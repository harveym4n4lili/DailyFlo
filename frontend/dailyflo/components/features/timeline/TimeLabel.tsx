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
  // height for containerized labels (spans task card height)
  height?: number;
}

/**
 * TimeLabel Component
 * 
 * Renders a time label at the specified position on the timeline.
 */
export default function TimeLabel({ time, position, isEndTime = false, isDragLabel = false, height }: TimeLabelProps) {
  const themeColors = useThemeColors();
  const typography = useTypography();

  // create dynamic styles using theme colors and typography
  const styles = useMemo(() => createStyles(themeColors, typography), [themeColors, typography]);

  // format time for display (24-hour format)
  const formattedTime = useMemo(() => {
    const [hours, minutes] = time.split(':').map(Number);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }, [time]);

  // position label at the top edge of the card
  // position is the top edge of the card
  // simply position container at the top edge
  const containerStyle = height 
    ? [styles.container, styles.containerized, { top: position, height }]
    : [styles.container, styles.topAlignedContainer, { top: position }];

  const textStyle = [
    styles.timeText,
    isEndTime && styles.endTimeText,
    isDragLabel && styles.dragTimeText,
  ];

  return (
    <View style={containerStyle}>
      <Text style={textStyle}>
        {formattedTime}
      </Text>
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
  },

  // top-aligned container - positions label at top edge of card
  topAlignedContainer: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start', // align text to top
    paddingRight: 4,
  },

  // containerized label that spans task card height
  containerized: {
    justifyContent: 'center',
    paddingRight: 4,
  },

  // end time container - aligns bottom edge of label with bottom edge of task card
  // position is already adjusted to account for text lineHeight (12px)
  // so we just need to ensure the text aligns to the bottom
  endTimeContainer: {
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingRight: 4,
    height: 12, // match lineHeight of end time text for precise alignment
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

