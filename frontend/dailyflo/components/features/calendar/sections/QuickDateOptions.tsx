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

// icons from expo vector icons
import { Ionicons } from '@expo/vector-icons';

// typography system for consistent text styling
import { getTextStyle } from '@/constants/Typography';

// hooks for theme-aware colors
import { useThemeColors, useTaskColors, useSemanticColors } from '@/hooks/useColorPalette';

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
  const taskColors = useTaskColors();
  const semanticColors = useSemanticColors();
  
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
    // handle empty strings (no deadline case)
    if (!selectedDate && !dateToCheck) return true;
    if (!selectedDate || !dateToCheck) return false;
    
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
   * Helper function to get the date for this weekend (next Saturday)
   * @returns ISO string of this weekend's date
   */
  // this function calculates the next Saturday (this weekend)
  const getThisWeekendDate = (): string => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
    const daysUntilSaturday = dayOfWeek === 0 ? 6 : 6 - dayOfWeek; // if today is Sunday, next Saturday is 6 days away
    
    const weekendDate = new Date(today);
    weekendDate.setDate(today.getDate() + daysUntilSaturday);
    weekendDate.setHours(0, 0, 0, 0);
    return weekendDate.toISOString();
  };

  /**
   * Quick date options configuration
   * Each option has a label, the number of days from today, and an icon
   */
  // this array defines all the quick date options we want to show
  // each option calculates its date relative to today using daysFromToday
  const quickOptions: { 
    label: string; 
    daysFromToday: number | null; 
    icon: keyof typeof Ionicons.glyphMap;
    iconColor: () => string;
    isSpecial?: 'weekend' | 'no-deadline'; // special handling for non-standard dates
  }[] = [
    { label: 'Today', daysFromToday: 0, icon: 'calendar-outline', iconColor: () => semanticColors.success() }, // green
    { label: 'Tomorrow', daysFromToday: 1, icon: 'sunny-outline', iconColor: () => semanticColors.warning() }, // yellow
    { label: 'This Weekend', daysFromToday: null, icon: 'calendar-outline', iconColor: () => semanticColors.info(), isSpecial: 'weekend' }, // blue (special case)
    { label: 'Next Week', daysFromToday: 7, icon: 'arrow-forward-outline', iconColor: () => taskColors.purple() }, // purple
    { label: 'No Deadline', daysFromToday: null, icon: 'remove-circle-outline', iconColor: () => themeColors.text.tertiary(), isSpecial: 'no-deadline' }, // grey
  ];
  
  return (
    <View style={styles.container}>
      {/* quick date options list */}
      {quickOptions.map((option) => {
        // calculate the actual date for this option
        // special handling for "This Weekend" and "No Deadline"
        let optionDate = '';
        if (option.isSpecial === 'weekend') {
          optionDate = getThisWeekendDate();
        } else if (option.isSpecial === 'no-deadline') {
          optionDate = ''; // empty string represents no deadline
        } else {
          optionDate = getDateFromToday(option.daysFromToday);
        }
        
        // get the day of week for this date (empty for "No Deadline")
        const dayOfWeek = option.isSpecial === 'no-deadline' ? '—' : getDayOfWeek(optionDate);

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
            {/* icon and label on the left with proper spacing */}
            <View style={styles.leftContent}>
              <View style={styles.iconContainer}>
                <Ionicons 
                  name={option.icon} 
                  size={20} 
                  color={option.iconColor()}
                />
              </View>
              
              {/* option label next to the icon */}
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
            </View>
            
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
    
    // use flexbox to position left content (icon + label) and right content (day)
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    
    paddingVertical: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  // container for icon and label on the left
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1, // take up available space
  },
  // container for the icon on the left
  iconContainer: {
    width: 20, // fixed width to align icons consistently
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12, // space between icon and label
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

