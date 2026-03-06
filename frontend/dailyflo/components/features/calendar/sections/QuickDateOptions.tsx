/**
 * QuickDateOptions Component
 * 
 * Provides quick date selection buttons for common date choices.
 * Options include: Today, Tomorrow, In 3 Days, Next Week, and Next Month.
 */

// react: core react library
import React from 'react';

// react native components we need for the UI
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

// icons from expo vector icons (fallback on Android/Web where SF Symbols unavailable)
import { Ionicons } from '@expo/vector-icons';
// SF Symbols on iOS, custom/vector icons as fallback
import { CalendarIcon, SFSymbolIcon } from '@/components/ui/icon';

// typography system for consistent text styling
import { getTextStyle } from '@/constants/Typography';

// hooks for theme-aware colors
import { useThemeColors } from '@/hooks/useColorPalette';
// dashed separator component
import { DashedSeparator } from '@/components/ui/borders';
// padding constants for consistent spacing
import { Paddings } from '@/constants/Paddings';

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

  /**
   * When true, option buttons use transparent background (e.g. when parent has elevated background).
   * @default false
   */
  transparentOptionBackground?: boolean;
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
  transparentOptionBackground = false,
}) => {
  // get theme-aware colors for styling buttons and icons
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
   * Each option has a label, days from today, SF Symbol name (iOS), and fallback icon (Android/Web)
   */
  // this array defines all the quick date options we want to show
  // each option calculates its date relative to today using daysFromToday
  // icon color matches label text - ensures visibility in both light and dark modes
  const iconColor = themeColors.text.primary();
  const quickOptions: { 
    label: string; 
    daysFromToday: number | null; 
    systemImage: string; // SF Symbol name (filled variants for iOS)
    fallbackIcon: keyof typeof Ionicons.glyphMap; // Ionicons filled variant for Android/Web
    isSpecial?: 'weekend' | 'no-deadline'; // special handling for non-standard dates
  }[] = [
    { label: 'Today', daysFromToday: 0, systemImage: 'calendar', fallbackIcon: 'calendar' },
    { label: 'Tomorrow', daysFromToday: 1, systemImage: 'sun.max.fill', fallbackIcon: 'sunny' },
    { label: 'This Weekend', daysFromToday: null, systemImage: 'calendar.badge.clock', fallbackIcon: 'calendar-outline', isSpecial: 'weekend' },
    { label: 'Next Week', daysFromToday: 7, systemImage: 'arrow.right', fallbackIcon: 'arrow-forward' },
    { label: 'No Deadline', daysFromToday: null, systemImage: 'xmark.circle.fill', fallbackIcon: 'remove-circle', isSpecial: 'no-deadline' },
  ];
  
  return (
    <View style={styles.container}>
      {/* quick date options list */}
      {quickOptions.map((option, index) => {
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

        const isLastOption = index === quickOptions.length - 1;
        
        return (
          <View key={option.label}>
            <TouchableOpacity
              onPress={() => onSelectDate(optionDate, option.label)}
              activeOpacity={0.6}
              style={[
                styles.optionButton,
                {
                  // no press highlight - background stays static; TouchableOpacity fades icon and text on press
                  backgroundColor: transparentOptionBackground ? 'transparent' : themeColors.background.elevated(),
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Select ${option.label}${dayOfWeek ? ", " + dayOfWeek : ''}`}
              accessibilityState={{ selected: false }}
            >
              {/* icon and label on the left with proper spacing */}
              <View style={styles.leftContent}>
                <View style={styles.iconContainer}>
                  <SFSymbolIcon
                    name={option.systemImage}
                    size={20}
                    color={iconColor}
                    fallback={
                      option.systemImage === 'calendar_today' ? (
                        <CalendarIcon size={20} color={iconColor} isSolid />
                      ) : (
                        <Ionicons name={option.fallbackIcon} size={20} color={iconColor} />
                      )
                    }
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
            </TouchableOpacity>
            {/* dashed separator below each option - wrapped in same padding as option buttons so left/right align */}
            {!isLastOption && (
              <View style={styles.separatorWrapper}>
                <DashedSeparator paddingHorizontal={0} />
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
};

/**
 * Styles for QuickDateOptions
 */
const styles = StyleSheet.create({
  // --- LAYOUT STYLES ---
  container: {
    paddingHorizontal: Paddings.none,
    marginBottom: 12,
  },
  // same horizontal padding as option buttons - ensures separator aligns left and right
  separatorWrapper: {
    paddingHorizontal: Paddings.card,
  },
  // container for icon and label on the left
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1, // take up available space
  },
  // container for the icon on the left (20px icon size)
  iconContainer: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  // --- PADDING STYLES ---
  optionButton: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Paddings.listItemVertical,
    paddingHorizontal: Paddings.card,
    height: 48,
  },

  // --- TYPOGRAPHY STYLES ---
  optionText: {},
  optionTextSelected: {},
  dayOfWeekText: {},
});

export default QuickDateOptions;

