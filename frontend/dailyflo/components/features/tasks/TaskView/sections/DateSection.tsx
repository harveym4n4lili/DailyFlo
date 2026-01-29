/**
 * DateSection Component
 * 
 * Displays the task due date with dynamic messaging.
 * Shows the same dynamic messages as the date form picker button:
 * - "No Date" when no date is selected
 * - "Today", "Tomorrow", "Yesterday", etc. for relative dates
 * - Formatted date for custom dates
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CalendarIcon } from '@/components/ui/Icon';
import { useColorPalette, useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { getDatePickerDisplay } from '@/components/ui/Button';

export interface DateSectionProps {
  /** Due date as ISO string or undefined */
  dueDate?: string | null;
}

/**
 * DateSection Component
 * 
 * Displays the task due date with dynamic messaging and appropriate colors.
 */
export const DateSection: React.FC<DateSectionProps> = ({ dueDate }) => {
  // HOOKS
  // get theme-aware colors for styling
  const themeColors = useThemeColors();
  // get color palette for semantic colors
  const colors = useColorPalette();
  // get typography system for text styling
  const typography = useTypography();

  // get display information for the date
  // this provides the dynamic messaging (Today, Tomorrow, etc.) and colors
  const displayInfo = getDatePickerDisplay(
    dueDate || undefined,
    colors,
    themeColors
  );

  // determine the text to display
  // always show the text from displayInfo (includes "No Date" when no date is selected)
  const displayText = displayInfo.text;

  return (
    <View style={styles.container}>
      {/* calendar icon - displayed on the left */}
      <View style={styles.icon}>
        <CalendarIcon size={16} color={displayInfo.iconColor} />
      </View>
      
      {/* date text - displays dynamic message or "No Date" */}
      <Text 
        style={[
          styles.dateText,
          { color: displayInfo.color },
          typography.getTextStyle('heading-4'),
          { fontWeight: '400' as const } // reduced weight from default heading-4 weight
        ]}
      >
        {displayText}
      </Text>
    </View>
  );
};

// STYLES
// stylesheet for component styling
const styles = StyleSheet.create({
  // container - horizontal layout for icon and text
  container: {
    flexDirection: 'row', // horizontal layout for icon and text
    alignItems: 'center', // vertically center icon and text
  },
  
  // icon style - spacing for calendar icon
  icon: {
    marginRight: 8, // space between icon and text
  },
  
  // date text style
  dateText: {
    // typography is applied inline via getTextStyle
  },
});

export default DateSection;

