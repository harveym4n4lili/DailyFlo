/**
 * QuickDateOptions Component
 * 
 * Provides quick date selection buttons for common date choices.
 * Options include: Today, Tomorrow, In 3 Days, Next Week, and Next Month.
 */

// react: core react library
import React from 'react';

// react native components we need for the UI
import { View, Text, Pressable, StyleSheet } from 'react-native';

// typography system for consistent text styling
import { getTextStyle } from '@/constants/Typography';

// hooks for theme-aware colors
import { useThemeColors } from '@/hooks/useColorPalette';

/**
 * Props for QuickDateOptions component
 */
export interface QuickDateOptionsProps {
  /**
   * Currently selected date (as ISO string)
   * This helps us highlight which option is currently selected
   */
  selectedDate: string;
  
  /**
   * Callback when a quick date option is selected
   * @param date - The selected date as ISO string
   * @param optionName - The name of the option selected (for analytics/debugging)
   */
  onSelectDate: (date: string, optionName: string) => void;
}

/**
 * QuickDateOptions Component
 * 
 * Displays a list of quick date selection buttons.
 * Each button calculates its date relative to today and passes it to onSelectDate.
 */
export const QuickDateOptions: React.FC<QuickDateOptionsProps> = ({
  selectedDate,
  onSelectDate,
}) => {
  // get theme-aware colors for styling buttons
  const themeColors = useThemeColors();
  
  /**
   * Helper function to calculate a date relative to today
   * @param daysFromToday - Number of days to add to today (can be negative)
   * @returns ISO string of the calculated date
   */
  // this function helps us calculate dates like "tomorrow" (today + 1) or "next week" (today + 7)
  const getDateFromToday = (daysFromToday: number | null): string => {
    if (daysFromToday === null) return '';
    const date = new Date();
    date.setDate(date.getDate() + daysFromToday);
    date.setHours(0, 0, 0, 0); // reset time to start of day for clean comparison
    return date.toISOString();
  };
  
  /**
   * Helper function to check if a date matches the selected date
   * @param dateToCheck - ISO string of date to check
   * @returns true if the date matches the selected date (ignoring time)
   */
  // this helps us highlight the currently selected option
  const isDateSelected = (dateToCheck: string): boolean => {
    const selectedDay = new Date(selectedDate).setHours(0, 0, 0, 0);
    const checkDay = new Date(dateToCheck).setHours(0, 0, 0, 0);
    return selectedDay === checkDay;
  };
  
  /**
   * Helper function to get day of week abbreviation
   * @param dateString - ISO string of the date
   * @returns Day of week abbreviation (e.g., "Mon", "Tue", "Wed")
   */
  // this function takes a date and returns the day name like "Wed" or "Thu"
  const getDayOfWeek = (dateString: string): string => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    // toLocaleDateString with weekday: 'short' gives us "Mon", "Tue", etc.
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };
  
  /**
   * Quick date options configuration
   * Each option has a label, the number of days from today, and an icon
   */
  // this array defines all the quick date options we want to show
  // each option calculates its date relative to today using daysFromToday
  const quickOptions: { label: string; daysFromToday: number | null }[] = [
    { label: 'Today', daysFromToday: 0 },
    { label: 'Tomorrow', daysFromToday: 1 },
    { label: 'Next Week', daysFromToday: 7 },
    { label: 'Next Month', daysFromToday: 30 },
    { label: 'No Deadline', daysFromToday: null },
  ];
  
  return (
    <View style={styles.container}>
      {/* quick date options list */}
      {quickOptions.map((option) => {
        // calculate the actual date for this option
        const optionDate = getDateFromToday(option.daysFromToday);
        
        // get the day of week for this date
        const dayOfWeek = getDayOfWeek(optionDate);

        return (
          <Pressable
            key={option.label}
            onPress={() => onSelectDate(optionDate, option.label)}
            style={({ pressed }) => [
              styles.optionButton,
              {
                // Highlight background only while pressing
                backgroundColor: pressed
                  ? themeColors.background.tertiary()
                  : themeColors.background.elevated(),
                borderColor: themeColors.border.primary(),
              },
            ]}
            // accessibility features for screen readers
            accessibilityRole="button"
            accessibilityLabel={`Select ${option.label}${dayOfWeek ? ", " + dayOfWeek : ''}`}
            accessibilityState={{ selected: false }}
          >
            {/* option label on the left */}
            <Text
              style={[
                getTextStyle('body-large'),
                styles.optionText,
                {
                  color: themeColors.text.primary()
                },
              ]}
            >
              {option.label}
            </Text>
            
            {/* day of week on the right */}
            <Text
              style={[
                getTextStyle('body-large'),
                styles.dayOfWeekText,
                {
                  color: themeColors.text.tertiary?.() || themeColors.text.secondary(),
                },
              ]}
            >
              {dayOfWeek}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

/**
 * Styles for QuickDateOptions
 */
const styles = StyleSheet.create({
  // container for all quick date options
  container: {
    paddingHorizontal: 0,
  },
  
  // individual option button styling
  optionButton: {
    // full width to touch edges
    width: '100%',
    
    // border
    borderBottomWidth: 1,
    
    // use flexbox to position label on left and day on right
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    
    paddingVertical: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  // text style for option label
  optionText: {
    fontWeight: '700',
  },
  optionTextSelected: {
    fontWeight: '600',
  },
  // text style for day of week (right side)
  dayOfWeekText: {
    fontWeight: '700',
  },
});

export default QuickDateOptions;
