/**
 * WeekView Component
 * 
 * A weekly calendar grid component for date navigation.
 * Displays a week view (Mon-Sun) with a formatted date header.
 * 
 * HOW IT WORKS:
 * 1. Takes a selected date and displays the week containing that date
 * 2. Shows 7 days (Mon-Sun) with dates
 * 3. Displays formatted date header (e.g., "11 January 2026")
 * 4. Highlights selected date with animated background
 * 5. Calls onSelectDate when user taps any date
 */

// react: core react library for component state and memoization
import React, { useState, useMemo, useEffect, useLayoutEffect, useRef, useCallback } from 'react';

// react native components for building the calendar UI
import { View, Text, Pressable, TouchableOpacity, StyleSheet, Animated, FlatList, useWindowDimensions } from 'react-native';

// expo vector icons for chevron symbol
import { Ionicons } from '@expo/vector-icons';

// typography system for consistent text styling across the calendar
import { getTextStyle } from '@/constants/Typography';

// hooks for theme-aware colors that adapt to light/dark mode
import { useThemeColors } from '@/hooks/useColorPalette';
import { Paddings } from '@/constants/Paddings';
import { useTypography } from '@/hooks/useTypography';

/**
 * Props for WeekView component
 * These props define what data the week view needs and how it communicates back
 */
export interface WeekViewProps {
  /**
   * Currently selected date (as ISO string)
   * This helps us highlight which date is currently selected
   * Used to show visual feedback and determine which week to display
   */
  selectedDate: string;
  
  /**
   * Callback when a date is selected
   * @param date - The selected date as ISO string
   * This function is called whenever user taps on any date in the week view
   */
  onSelectDate: (date: string) => void;
  
  /**
   * Callback when header is pressed
   * This function is called when user taps on the date header to open calendar modal
   */
  onHeaderPress?: () => void;
}

/**
 * DayCell Component
 * Individual day cell with animated background highlight
 */
interface DayCellProps {
  date: Date;
  dayNumber: number;
  isSelected: boolean;
  isTodayDate: boolean;
  onSelectDate: (date: Date) => void;
  themeColors: ReturnType<typeof useThemeColors>;
  styles: ReturnType<typeof createStyles>;
}

const DayCell: React.FC<DayCellProps> = ({
  date,
  dayNumber,
  isSelected,
  isTodayDate,
  onSelectDate,
  themeColors,
  styles,
}) => {
  // animated values for zoom fade animation - start at 0 (hidden) or 1 (visible) based on initial selection state
  const scaleAnim = useRef(new Animated.Value(isSelected ? 1 : 0)).current;
  const opacityAnim = useRef(new Animated.Value(isSelected ? 1 : 0)).current;
  
  // trigger animation when selection state changes
  useEffect(() => {
    if (isSelected) {
      // animate in: scale from 0.8 to 1, fade from 0 to 1
      scaleAnim.setValue(0.8);
      opacityAnim.setValue(0);
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // animate out: scale to 0, fade to 0
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isSelected, scaleAnim, opacityAnim]);
  
  return (
    <View style={[
      styles.dateCellContainer,
      // dashed circular outline for non-selected days
      !isSelected && {
        borderWidth: 1,
        borderStyle: 'dashed',
        borderRadius: 19,
        borderColor: themeColors.text.tertiary(),

      },
    ]}>
      {/* animated background highlight */}
      <Animated.View
        style={[
          styles.dateCellBackground,
          {
            backgroundColor: themeColors.text.primary(),
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
          }
        ]}
      />
      
      {/* date number */}
      <Pressable
        onPress={() => onSelectDate(date)}
        style={styles.dateCellPressable}
        accessibilityRole="button"
        accessibilityLabel={`${dayNumber}, ${date.toLocaleDateString('en-US', { 
          month: 'long', 
          day: 'numeric',
          year: 'numeric' 
        })}`}
        accessibilityState={{ selected: isSelected }}
      >
        <Text style={[
          getTextStyle('heading-4'),
          styles.dateText,
          {
            color: isSelected
              ? themeColors.background.primary()
              : themeColors.text.primary(),
          }
        ]}>
          {dayNumber}
        </Text>
      </Pressable>
    </View>
  );
};

/**
 * WeekView Component
 * 
 * Displays a weekly calendar grid with navigation and date selection.
 * Shows the current week (Mon-Sun) with dates and navigation arrows.
 * 
 * COMPONENT STRUCTURE:
 * 1. Header: Month/year text + navigation arrows
 * 2. Week grid: 7 days (Mon-Sun) with date numbers
 */
export const WeekView: React.FC<WeekViewProps> = ({
  selectedDate,
  onSelectDate,
  onHeaderPress,
}) => {
  // get theme-aware colors for styling (adapts to light/dark mode)
  const themeColors = useThemeColors();
  
  // get typography system for consistent text styling
  const typography = useTypography();
  
  // create dynamic styles
  const styles = useMemo(() => createStyles(themeColors, typography), [themeColors, typography]);
  
  // animated value for header title fade animation
  const headerOpacity = useRef(new Animated.Value(1)).current;
  
  // track previous date to detect changes
  const prevDateRef = useRef<string>(selectedDate);
  
  // flat list ref for horizontal pagination
  const flatListRef = useRef<FlatList>(null);
  
  // track if user is currently swiping (to prevent selectedDate effect from interfering)
  const isUserSwipingRef = useRef<boolean>(false);
  
  // skip scroll on initial mount (we use initialScrollIndex={1} for that)
  const isInitialMountRef = useRef<boolean>(true);
  
  // get screen width for pagination calculations
  const { width: screenWidth } = useWindowDimensions();
  
  /**
   * Helper function to get Monday of the week for a given date
   */
  const getMondayOfWeek = (date: Date): Date => {
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // if Sunday, go back 6 days; otherwise go to Monday
    const monday = new Date(date);
    monday.setDate(date.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0); // reset time to start of day
    return monday;
  };
  
  // state for current displayed week - this is the Monday of the current week
  // useState with function initializer runs once on component mount
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    // if we have a selected date, show the week containing that date
    if (selectedDate) {
      return getMondayOfWeek(new Date(selectedDate));
    }
    
    // fallback: show current week (Monday of this week)
    return getMondayOfWeek(new Date());
  });
  
  /**
   * Calculate the three weeks to display: previous, current, next
   * These are rendered as pages in the FlatList
   */
  const previousWeekStart = useMemo(() => {
    const prev = new Date(currentWeekStart);
    prev.setDate(currentWeekStart.getDate() - 7);
    return prev;
  }, [currentWeekStart]);
  
  const nextWeekStart = useMemo(() => {
    const next = new Date(currentWeekStart);
    next.setDate(currentWeekStart.getDate() + 7);
    return next;
  }, [currentWeekStart]);
  
  /**
   * Helper function to get week data - array of 7 dates (Mon-Sun) for a given week start
   */
  const getWeekData = (weekStart: Date): Date[] => {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      week.push(date);
    }
    return week;
  };
  
  /**
   * FlatList data - array of week start dates for pagination
   * Each item represents one page (week) in the swipeable carousel
   */
  const weeksData = useMemo(() => [previousWeekStart, currentWeekStart, nextWeekStart], [previousWeekStart, currentWeekStart, nextWeekStart]);
  
  
  /**
   * Handle scroll end in FlatList
   * When user finishes swiping to a new page, update the current week and select the same day
   */
  // page width for paging - full screen so swipe isn't clipped by container padding
  const pageWidth = screenWidth;
  
  const handleMomentumScrollEnd = useCallback((event: any) => {
    const { contentOffset } = event.nativeEvent;
    const currentIndex = Math.round(contentOffset.x / pageWidth);
    
    // get the week start for the current page index
    const newWeekStart = weeksData[currentIndex];
    if (newWeekStart && newWeekStart.getTime() !== currentWeekStart.getTime()) {
      // mark that user is swiping to prevent selectedDate effect from interfering
      isUserSwipingRef.current = true;
      setCurrentWeekStart(newWeekStart);
      
      // if we have a selected date, find the same day of the week in the new week
      if (selectedDate) {
        const currentSelected = new Date(selectedDate);
        const currentDayOfWeek = currentSelected.getDay(); // 0 = Sunday, 1 = Monday, etc.
        // adjust for Monday-based week: 0 = Sunday becomes 6, 1 = Monday becomes 0, etc.
        const mondayBasedDay = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
        
        // create new date in the new week with the same day of the week
        const newSelectedDate = new Date(newWeekStart);
        newSelectedDate.setDate(newWeekStart.getDate() + mondayBasedDay);
        
        // update the selected date to the same day in the new week
        onSelectDate(newSelectedDate.toISOString());
      }
      
      // scroll to center happens in useLayoutEffect - runs before paint so no flash
    }
  }, [weeksData, currentWeekStart, screenWidth, selectedDate, onSelectDate]);
  
  /**
   * Get item layout for FlatList performance optimization
   * Each page is full screen width for correct paging (weekGrid stays centered with same visual spacing)
   */
  const getItemLayout = useCallback(
    (_: any, index: number) => {
      return {
        length: pageWidth,
        offset: pageWidth * index,
        index,
      };
    },
    [pageWidth]
  );
  
  /**
   * Scroll to center (index 1) whenever currentWeekStart changes.
   * Runs in useLayoutEffect = BEFORE paint, so user never sees wrong week flash.
   * Skips initial mount (initialScrollIndex={1} already handles that).
   */
  useLayoutEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }
    flatListRef.current?.scrollToIndex({ index: 1, animated: false });
    isUserSwipingRef.current = false;
  }, [currentWeekStart]);
  
  /**
   * Reset FlatList to center page (current week) when week changes externally
   * Only runs when selectedDate changes from outside (not during user swipes)
   */
  useEffect(() => {
    // don't interfere if user is currently swiping
    if (isUserSwipingRef.current) {
      return;
    }
    
    if (selectedDate) {
      const selected = new Date(selectedDate);
      const selectedWeekMonday = getMondayOfWeek(selected);
      // only update if the selected date is in a different week
      if (selectedWeekMonday.getTime() !== currentWeekStart.getTime()) {
        setCurrentWeekStart(selectedWeekMonday);
        // scroll happens in useLayoutEffect when currentWeekStart updates
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);
  
  /**
   * Get formatted date text for header (includes day)
   * Uses the selected date for display (e.g., "11 January 2026")
   */
  const formattedDateText = useMemo(() => {
    if (selectedDate) {
      const date = new Date(selectedDate);
      return date.toLocaleDateString('en-UK', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }
    // fallback to today's date if no date selected
    const today = new Date();
    return today.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }, [selectedDate]);
  
  /**
   * Animate header title fade when date changes
   * Fades in smoothly when date changes
   */
  useEffect(() => {
    // check if date actually changed (not just initial render)
    if (prevDateRef.current !== selectedDate && prevDateRef.current !== '') {
      // start from opacity 0, then fade in smoothly
      headerOpacity.setValue(0);
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
    // update previous date ref after checking
    prevDateRef.current = selectedDate;
  }, [selectedDate, headerOpacity]);
  
  /**
   * Check if a date is the selected date
   * Compares date strings (YYYY-MM-DD format) to avoid time zone issues
   */
  const isSelectedDate = (date: Date): boolean => {
    if (!selectedDate) return false;
    const selected = new Date(selectedDate);
    return date.getDate() === selected.getDate() &&
           date.getMonth() === selected.getMonth() &&
           date.getFullYear() === selected.getFullYear();
  };
  
  /**
   * Check if a date is today
   */
  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };
  
  /**
   * Handle date selection
   * Converts date to ISO string and calls onSelectDate callback
   */
  const handleDateSelect = (date: Date) => {
    onSelectDate(date.toISOString());
  };
  
  // day abbreviations for headers (Mon-Sun)
  const dayHeaders = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  return (
    <View>
      {/* 
        WEEK VIEW HEADER SECTION - separate from week grid, uses Paddings.screen for left spacing
        Contains: formatted date text (day month year)
        Styled to match today screen header title
      */}
      <TouchableOpacity 
        style={[styles.header, styles.headerContainer]}
        onPress={onHeaderPress}
        activeOpacity={0.7}
        disabled={!onHeaderPress}
      >
        <Animated.Text key={selectedDate} style={[styles.headerTitle, { opacity: headerOpacity }]}>
          {formattedDateText}
        </Animated.Text>
        <Ionicons 
          name="chevron-forward" 
          size={24} 
          color={themeColors.text.primary()} 
          style={styles.chevronIcon}
        />
      </TouchableOpacity>
      
      {/* 
        WEEK GRID SECTION
        Contains: 3 weeks (previous, current, next) in a horizontal FlatList with pagination
        Layout: Swipeable pages - one week per page
        listWrapper uses negative margin to break out of container padding so full pages are visible during swipe
      */}
      <View style={styles.weekSectionContainer}>
      <View style={styles.listWrapper}>
      <FlatList
        ref={flatListRef}
        data={weeksData}
        renderItem={({ item: weekStart }) => {
          // get week data for this page
          const weekData = getWeekData(weekStart);
          
          return (
            <View style={[styles.weekPage, { width: pageWidth }]}>
              <View style={[styles.weekGrid, { width: screenWidth - 32 }]}>
              {weekData.map((date, index) => {
                const dayNumber = date.getDate();
                const isSelected = isSelectedDate(date);
                const isTodayDate = isToday(date);
                
                return (
                  <View key={index} style={styles.dayColumn}>
                    <Pressable
                      onPress={() => handleDateSelect(date)}
                      style={styles.dayHeaderPressable}
                      accessibilityRole="button"
                      accessibilityLabel={`Select ${dayHeaders[index]}, ${date.toLocaleDateString('en-US', { 
                        month: 'long', 
                        day: 'numeric',
                        year: 'numeric' 
                      })}`}
                    >
                      <Text 
                        numberOfLines={1}
                        style={[
                          getTextStyle('body-medium'),
                          styles.dayHeaderText,
                          { 
                            color: themeColors.text.tertiary?.() || themeColors.text.secondary(),
                          }
                        ]}>
                        {dayHeaders[index]}
                      </Text>
                    </Pressable>
                    
                    <DayCell
                      date={date}
                      dayNumber={dayNumber}
                      isSelected={isSelected}
                      isTodayDate={isTodayDate}
                      onSelectDate={handleDateSelect}
                      themeColors={themeColors}
                      styles={styles}
                    />
                  </View>
                );
              })}
              </View>
            </View>
          );
        }}
        keyExtractor={(item) => item.getTime().toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        getItemLayout={getItemLayout}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        initialScrollIndex={1} // start at center page (current week)
        decelerationRate="fast"
        scrollEventThrottle={16}
      />
      </View>
      </View>
    </View>
  );
};

/**
 * Styles for WeekView
 * 
 * STYLING PHILOSOPHY:
 * 1. Use flexbox for responsive layouts
 * 2. Consistent spacing and sizing
 * 3. Touch-friendly tap targets (minimum 44px)
 * 4. Visual hierarchy with typography and colors
 */
const createStyles = (
  themeColors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useTypography>
) => StyleSheet.create({
  // --- LAYOUT STYLES ---
  // header container - separate from week grid, left spacing from Paddings.screen
  headerContainer: {
    paddingLeft: Paddings.screen,
  },
  
  // week view header - contains formatted date text and chevron icon
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  
  // chevron icon styling - positioned to the right of the date header
  chevronIcon: {
    marginLeft: 8,
  },
  
  // week grid section - padding for the swipeable list (listWrapper breaks out with negative margin)
  weekSectionContainer: {
    paddingHorizontal: 16,
    paddingVertical: Paddings.card,
    paddingBottom: Paddings.card - 12,
  },
  
  // breaks out of container padding so FlatList scrolls full-width (no cut-off during swipe)
  // margin matches weekSectionContainer padding (16) so list extends to screen edges for pagination
  listWrapper: {
    marginHorizontal: -16,
  },
  
  // full-width page wrapper - centers weekGrid to preserve visual spacing
  weekPage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // week grid container - holds all the day columns for a single week
  weekGrid: {
    flexDirection: 'row',
    gap: 4,
  },
  
  // individual day column - contains day header and date cell
  dayColumn: {
    flex: 1,
    alignItems: 'center',
  },
  
  // day header pressable - clickable area for day header
  dayHeaderPressable: {
    marginBottom: 8,
    paddingVertical: Paddings.none,
    paddingHorizontal: Paddings.touchTarget,
  },
  
  // day header text styling
  dayHeaderText: {
    textAlign: 'center',
  },
  
  // date cell container - holds background and pressable
  dateCellContainer: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  
  // animated background highlight
  dateCellBackground: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 19,
  },
  
  // date cell pressable - clickable area
  dateCellPressable: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  
  // date number text styling
  dateText: {},

  // --- TYPOGRAPHY STYLES ---
  headerTitle: {
    ...typography.getTextStyle('heading-2'),
    color: themeColors.text.primary(),
    marginLeft: 0,
  },
});

export default WeekView;