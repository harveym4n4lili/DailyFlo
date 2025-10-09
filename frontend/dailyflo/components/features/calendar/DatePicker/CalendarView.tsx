/**
 * CalendarView Component
 * 
 * A monthly calendar grid component for date selection.
 * Displays a standard calendar view with month navigation and date selection.
 * 
 * HOW IT WORKS:
 * 1. Takes a selected date and displays the month containing that date
 * 2. Generates a 6x7 grid (42 cells) to show the full month layout
 * 3. Fills previous/next month dates in empty cells for visual completeness
 * 4. Allows navigation between months with arrow buttons
 * 5. Highlights selected date and today's date differently
 * 6. Calls onSelectDate when user taps any date
 */

// react: core react library for component state and memoization
import React, { useState, useMemo } from 'react';

// react native components for building the calendar UI
import { View, Text, Pressable, StyleSheet } from 'react-native';

// icons from expo for navigation arrows (left/right chevrons)
import { Ionicons } from '@expo/vector-icons';

// typography system for consistent text styling across the calendar
import { getTextStyle } from '@/constants/Typography';

// hooks for theme-aware colors that adapt to light/dark mode
import { useThemeColors } from '@/hooks/useColorPalette';

/**
 * Props for CalendarView component
 * These props define what data the calendar needs and how it communicates back
 */
export interface CalendarViewProps {
  /**
   * Currently selected date (as ISO string)
   * This helps us highlight which date is currently selected
   * Used to show visual feedback and determine initial month display
   */
  selectedDate: string;
  
  /**
   * Callback when a date is selected
   * @param date - The selected date as ISO string
   * This function is called whenever user taps on any date in the calendar
   */
  onSelectDate: (date: string) => void;
  
  /**
   * Optional initial month to display (as Date object)
   * If not provided, defaults to the month containing the selected date
   * Useful for showing a specific month when calendar first opens
   */
  initialMonth?: Date;
}

/**
 * CalendarView Component
 * 
 * Displays a monthly calendar grid with navigation and date selection.
 * Shows the current month with proper day headers and date cells.
 * 
 * COMPONENT STRUCTURE:
 * 1. Header: Month/year text + navigation arrows
 * 2. Day headers: Sun, Mon, Tue, etc.
 * 3. Calendar grid: 6 weeks x 7 days = 42 date cells
 */
export const CalendarView: React.FC<CalendarViewProps> = ({
  selectedDate,
  onSelectDate,
  initialMonth,
}) => {
  // get theme-aware colors for styling (adapts to light/dark mode)
  const themeColors = useThemeColors();
  
  // state for current displayed month - this is what month the calendar shows
  // useState with function initializer runs once on component mount
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    // priority order: initialMonth > selectedDate month > current month
    if (initialMonth) return initialMonth;
    
    // if we have a selected date, show the month containing that date
    if (selectedDate) {
      const date = new Date(selectedDate);
      return new Date(date.getFullYear(), date.getMonth(), 1); // 1st day of that month
    }
    
    // fallback: show current month
    return new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  });
  
  /**
   * Navigate to previous month
   * Called when user taps the left arrow button
   * Updates currentMonth state which triggers calendarData recalculation
   */
  const goToPreviousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };
  
  /**
   * Navigate to next month
   * Called when user taps the right arrow button
   * Updates currentMonth state which triggers calendarData recalculation
   */
  const goToNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };
  
  /**
   * Get calendar data for the current month
   * Returns an array of weeks, where each week is an array of dates
   * 
   * CALENDAR GRID LOGIC:
   * 1. Always shows 6 weeks (42 cells) for consistent layout
   * 2. Fills empty cells with dates from previous/next month
   * 3. Creates a rectangular grid that looks like a real calendar
   * 
   * useMemo prevents recalculation unless currentMonth changes
   */
  const calendarData = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // get first day of month and how many days in the month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0); // day 0 = last day of previous month
    const daysInMonth = lastDay.getDate();
    
    // get what day of week the first day falls on (0 = Sunday, 1 = Monday, etc.)
    const startDayOfWeek = firstDay.getDay();
    
    // create calendar grid (6 weeks x 7 days = 42 cells)
    const weeks: (Date | null)[][] = [];
    let currentWeek: (Date | null)[] = [];
    
    // STEP 1: fill in days from previous month (if needed)
    // if month starts on Wednesday (3), fill Mon(1), Tue(2) with prev month dates
    for (let i = 0; i < startDayOfWeek; i++) {
      const prevMonthDay = new Date(year, month, -startDayOfWeek + i + 1);
      currentWeek.push(prevMonthDay);
    }
    
    // STEP 2: fill in days from current month
    for (let day = 1; day <= daysInMonth; day++) {
      currentWeek.push(new Date(year, month, day));
      
      // if we've filled a week (7 days), start a new week
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    
    // STEP 3: fill in remaining days from next month (if needed)
    // complete the last week to make it 7 days
    const remainingCells = 7 - currentWeek.length;
    for (let i = 1; i <= remainingCells; i++) {
      currentWeek.push(new Date(year, month + 1, i));
    }
    
    // add the final week if it has any days
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }
    
    return weeks;
  }, [currentMonth]); // recalculate when currentMonth changes
  
  /**
   * Check if a date is today
   * Used to highlight today's date with bold text
   */
  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };
  
  /**
   * Check if a date is selected
   * Used to highlight the selected date with dark background and white text
   */
  const isSelected = (date: Date): boolean => {
    if (!selectedDate) return false;
    const selected = new Date(selectedDate);
    return date.toDateString() === selected.toDateString();
  };
  
  /**
   * Check if a date is in the current month
   * Used to style current month dates differently from prev/next month dates
   */
  const isCurrentMonth = (date: Date): boolean => {
    return date.getMonth() === currentMonth.getMonth();
  };
  
  /**
   * Handle date selection
   * Called when user taps on any date cell
   * Normalizes time to start of day and calls parent's onSelectDate
   */
  const handleDateSelect = (date: Date) => {
    // set time to start of day for clean comparison (removes hours/minutes/seconds)
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);
    onSelectDate(selectedDate.toISOString()); // convert to ISO string for parent
  };
  
  /**
   * Day headers for the calendar
   * Array of day abbreviations shown at the top of each column
   */
  const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  /**
   * Get month and year display text
   * Formats the current month for display in the header (e.g., "September 2025")
   */
  const monthYearText = currentMonth.toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });
  
  return (
    <View style={styles.container}>
      {/* 
        CALENDAR HEADER SECTION
        Contains: month/year text on left + navigation arrows on right
        Layout: flexDirection: 'row', justifyContent: 'space-between'
      */}
      <View style={styles.header}>
        {/* month/year text - shows current month and year */}
        <Text style={[
          getTextStyle('heading-3'),
          styles.monthYearText,
          { color: themeColors.text.primary() }
        ]}>
          {monthYearText}
        </Text>
        
        {/* navigation arrows - allows month switching */}
        <View style={styles.navigation}>
          {/* previous month button - left arrow */}
          <Pressable
            onPress={goToPreviousMonth}
            style={({ pressed }) => [
              styles.navButton,
              {
                backgroundColor: pressed 
                  ? themeColors.background.tertiary()
                  : 'transparent',
              }
            ]}
            accessibilityRole="button"
            accessibilityLabel="Previous month"
          >
            <Ionicons 
              name="chevron-back" 
              size={20} 
              color={themeColors.text.primary()} 
            />
          </Pressable>
          
          {/* next month button - right arrow */}
          <Pressable
            onPress={goToNextMonth}
            style={({ pressed }) => [
              styles.navButton,
              {
                backgroundColor: pressed 
                  ? themeColors.background.tertiary()
                  : 'transparent',
              }
            ]}
            accessibilityRole="button"
            accessibilityLabel="Next month"
          >
            <Ionicons 
              name="chevron-forward" 
              size={20} 
              color={themeColors.text.primary()} 
            />
          </Pressable>
        </View>
      </View>
      
      {/* 
        DAY HEADERS SECTION
        Shows: Sun, Mon, Tue, Wed, Thu, Fri, Sat
        Layout: flexDirection: 'row' with 7 equal-width columns
        Styling: uppercase, secondary text color, centered
      */}
      <View style={styles.dayHeaders}>
        {dayHeaders.map((day) => (
          <View key={day} style={styles.dayHeader}>
            <Text style={[
              getTextStyle('body-large'),
              styles.dayHeaderText,
              { color: themeColors.text.tertiary?.() || themeColors.text.secondary() }
            ]}>
              {day}
            </Text>
          </View>
        ))}
      </View>
      
      {/* 
        CALENDAR GRID SECTION
        Contains: 6 weeks x 7 days = 42 date cells
        Layout: Each week is a row, each day is a pressable cell
        Logic: Renders calendarData array generated by useMemo
      */}
      <View style={styles.calendarGrid}>
        {calendarData.map((week, weekIndex) => (
          <View key={weekIndex} style={styles.week}>
            {week.map((date, dayIndex) => {
              // handle empty cells (shouldn't happen with our logic, but safety check)
              if (!date) return <View key={dayIndex} style={styles.dayCell} />;
              
              // extract date info for styling and interaction
              const dayNumber = date.getDate();
              const isCurrentMonthDay = isCurrentMonth(date);
              const isSelectedDate = isSelected(date);
              const isTodayDate = isToday(date);
              
              return (
                <Pressable
                  key={`${date.getFullYear()}-${date.getMonth()}-${dayNumber}`}
                  onPress={() => handleDateSelect(date)}
                  style={({ pressed }) => [
                    styles.dayCell,
                    {
                      // background color logic:
                      // pressed = temporary highlight
                      // selected = dark background with white text
                      // default = transparent
                      backgroundColor: pressed 
                        ? themeColors.background.tertiary()
                        : isSelectedDate
                        ? themeColors.text.primary()
                        : 'transparent',
                    }
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`${dayNumber}, ${date.toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric',
                    year: 'numeric' 
                  })}`}
                  accessibilityState={{ selected: isSelectedDate }}
                >
                  <Text style={[
                    getTextStyle('heading-4'),
                    styles.dayText,
                    {
                      // text color logic:
                      // selected = white text on dark background
                      // current month = primary text color
                      // other months = secondary text color
                      color: isSelectedDate
                        ? themeColors.background.primary()
                        : isCurrentMonthDay
                        ? themeColors.text.primary()
                        : themeColors.text.tertiary?.() || themeColors.text.secondary(),
                      // today's date gets bold font weight
                      fontWeight: isTodayDate ? '700' : '400',
                    }
                  ]}>
                    {dayNumber}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
};

/**
 * Styles for CalendarView
 * 
 * STYLING PHILOSOPHY:
 * 1. Use flexbox for responsive layouts
 * 2. Consistent spacing and sizing
 * 3. Touch-friendly tap targets (minimum 44px)
 * 4. Visual hierarchy with typography and colors
 */
const styles = StyleSheet.create({
  // main container - provides padding around entire calendar
  container: {
    paddingHorizontal: 16, // side padding for content
    paddingVertical: 8,    // top/bottom padding for breathing room
  },
  
  // calendar header - contains month/year text and navigation arrows
  header: {
    flexDirection: 'row',      // horizontal layout
    justifyContent: 'space-between', // text on left, arrows on right
    alignItems: 'center',      // vertically center all elements
    marginBottom: 8,           // space below header
  },
  
  // month/year text styling
  monthYearText: {
    fontWeight: '700',         // bold for emphasis
  },
  
  // navigation buttons container - holds both arrow buttons
  navigation: {
    flexDirection: 'row',      // horizontal layout for buttons
    gap: 8,                    // space between buttons
  },
  
  // individual navigation button - circular button for arrows
  navButton: {
    width: 32,                 // touch-friendly size
    height: 32,                // square button
    borderRadius: 16,          // makes it circular
    alignItems: 'center',      // center icon horizontally
    justifyContent: 'center',  // center icon vertically
  },
  
  // day headers row - contains Sun, Mon, Tue, etc.
  dayHeaders: {
    flexDirection: 'row',      // horizontal layout
    marginBottom: 0,           // no bottom margin (touches calendar)
  },
  
  // individual day header - each day abbreviation
  dayHeader: {
    flex: 1,                   // equal width for all 7 days
    alignItems: 'center',      // center text horizontally
    paddingVertical: 8,        // top/bottom padding for touch target
  },
  
  // day header text styling
  dayHeaderText: {
    fontWeight: '600',         // semi-bold for readability
    textTransform: 'uppercase', // SUN, MON, TUE format
  },
  
  // calendar grid container - holds all the date cells
  calendarGrid: {
    // no additional styles needed, flexbox handles layout
  },
  
  // individual week row - contains 7 day cells
  week: {
    flexDirection: 'row',      // horizontal layout for days
    marginBottom: 4,           // space between weeks
  },
  
  // individual day cell - each date number
  dayCell: {
    flex: 1,                   // equal width for all 7 days
    aspectRatio: 1,            // square cells (height = width)
    alignItems: 'center',      // center date number horizontally
    justifyContent: 'center',  // center date number vertically
    borderRadius: 24,          // rounded corners for modern look
    marginHorizontal: 4,       // space between cells
  },
  
  // day number text styling
  dayText: {
    fontWeight: '400',         // normal weight (bold applied conditionally)
  },
});

export default CalendarView;
