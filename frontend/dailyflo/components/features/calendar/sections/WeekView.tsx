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
import { View, Text, Pressable, TouchableOpacity, StyleSheet, FlatList, useWindowDimensions, Animated } from 'react-native';

// expo vector icons for chevron symbol
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

// week selector typography + colors — edit PLANNER_WEEK_SELECTOR_CHROME in constants/plannerWeekSelectorChrome.ts
import {
  resolvePlannerWeekSelectorChrome,
  resolveStableWeekSelectorTextStyle,
  type ResolvedWeekSelectorChrome,
} from '@/constants/plannerWeekSelectorChrome';

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
   * Callback when the date header is tapped – opens the monthly selector stack screen.
   * When provided, the header (e.g. "6 March 2026") is tappable and pushes the planner's
   * month-select stack screen so the user can pick a date from the full month view.
   */
  onOpenMonthSelect?: () => void;

  /**
   * when true, omit the month/chevron row (e.g. planner shows it in the native stack headerTitle on ios).
   */
  hideMonthHeader?: boolean;
}

/**
 * Single day column — letter + date number stacked; selected state uses a vertical pill behind both.
 */
interface WeekDayColumnProps {
  date: Date;
  dayLetter: string;
  dayNumber: number;
  isSelected: boolean;
  onSelectDate: (date: Date) => void;
  chrome: ResolvedWeekSelectorChrome;
  styles: ReturnType<typeof createStyles>;
}

const WeekDayColumn: React.FC<WeekDayColumnProps> = ({
  date,
  dayLetter,
  dayNumber,
  isSelected,
  onSelectDate,
  chrome,
  styles,
}) => {
  const selectionOpacity = useRef(new Animated.Value(isSelected ? 1 : 0)).current;
  const selectionAnimationRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (selectionAnimationRef.current) {
      selectionAnimationRef.current.stop();
      selectionAnimationRef.current = null;
    }

    if (isSelected) {
      const animation = Animated.timing(selectionOpacity, {
        toValue: 1,
        duration: 140,
        useNativeDriver: true,
      });
      selectionAnimationRef.current = animation;
      animation.start(({ finished }) => {
        if (finished) {
          selectionAnimationRef.current = null;
        }
      });
    } else {
      selectionOpacity.setValue(0);
    }
  }, [isSelected, selectionOpacity]);

  // same line box for default + selected — only color changes so the row never jumps on swipe
  const letterTextStyle = resolveStableWeekSelectorTextStyle(
    chrome.dayLetter.default,
    chrome.dayLetter.selected,
    isSelected
  );
  const numberTextStyle = resolveStableWeekSelectorTextStyle(
    chrome.dayNumber.default,
    chrome.dayNumber.selected,
    isSelected
  );

  return (
    <Pressable
      onPress={() => onSelectDate(date)}
      style={styles.dayColumnPressable}
      hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
      accessibilityRole="button"
      accessibilityLabel={`${dayLetter}, ${dayNumber}, ${date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })}`}
      accessibilityState={{ selected: isSelected }}
    >
      {isSelected ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.dayColumnPill,
            {
              backgroundColor: chrome.selectedBackgroundColor,
              opacity: selectionOpacity,
            },
          ]}
        />
      ) : null}
      <Text style={[styles.dayLetterText, letterTextStyle]}>{dayLetter}</Text>
      <Text style={[styles.dayNumberText, numberTextStyle]}>{dayNumber}</Text>
    </Pressable>
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
  onOpenMonthSelect,
  hideMonthHeader = false,
}) => {
  // get theme-aware colors for styling (adapts to light/dark mode)
  const themeColors = useThemeColors();
  
  // get typography system for consistent text styling
  const typography = useTypography();

  // resolves day letter/number typography + selected pill from plannerWeekSelectorChrome.ts
  const selectorChrome = useMemo(
    () => resolvePlannerWeekSelectorChrome(themeColors, typography),
    [themeColors, typography]
  );
  
  // layout-only styles — all text typography comes from selectorChrome (Typography.ts tokens)
  const styles = useMemo(
    () => createStyles(selectorChrome.layout),
    [selectorChrome.layout]
  );
  
  // flat list ref for horizontal pagination
  const flatListRef = useRef<FlatList>(null);

  // keep latest callback without re-running layout effects when parent re-renders
  const onSelectDateRef = useRef(onSelectDate);
  onSelectDateRef.current = onSelectDate;

  // track if user is currently swiping (to prevent selectedDate effect from interfering)
  const isUserSwipingRef = useRef<boolean>(false);

  // skip scroll on initial mount (we use initialScrollIndex={1} for that)
  const isInitialMountRef = useRef<boolean>(true);

  // only recenter when the anchor week actually changes (avoids redundant scrollToOffset calls)
  const lastRecenteredWeekMsRef = useRef<number>(0);
  const needsScrollBackupRef = useRef<boolean>(false);
  
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

    if (currentIndex === 1) {
      return;
    }

    // get the week start for the current page index
    const newWeekStart = weeksData[currentIndex];
    if (!newWeekStart || newWeekStart.getTime() === currentWeekStart.getTime()) {
      return;
    }

    isUserSwipingRef.current = true;
    needsScrollBackupRef.current = true;

    let newSelectedDateIso: string | null = null;
    if (selectedDate) {
      const currentSelected = new Date(selectedDate);
      const currentDayOfWeek = currentSelected.getDay();
      const mondayBasedDay = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
      const newSelectedDate = new Date(newWeekStart);
      newSelectedDate.setDate(newWeekStart.getDate() + mondayBasedDay);
      newSelectedDateIso = newSelectedDate.toISOString();
    }

    setCurrentWeekStart(newWeekStart);

    if (newSelectedDateIso) {
      onSelectDateRef.current(newSelectedDateIso);
    }
  }, [weeksData, currentWeekStart, pageWidth, selectedDate]);
  
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
      lastRecenteredWeekMsRef.current = currentWeekStart.getTime();
      return;
    }

    const weekMs = currentWeekStart.getTime();
    if (lastRecenteredWeekMsRef.current === weekMs) {
      return;
    }
    lastRecenteredWeekMsRef.current = weekMs;

    flatListRef.current?.scrollToOffset({ offset: pageWidth, animated: false });

    if (needsScrollBackupRef.current) {
      needsScrollBackupRef.current = false;
      requestAnimationFrame(() => {
        flatListRef.current?.scrollToOffset({ offset: pageWidth, animated: false });
      });
    }
  }, [currentWeekStart, pageWidth]);
  
  /**
   * Reset FlatList to center page (current week) when week changes externally
   * Only runs when selectedDate changes from outside (not during user swipes)
   */
  useEffect(() => {
    // swipe commit already moved the anchor week — skip syncing from selectedDate on that same tick
    if (isUserSwipingRef.current) {
      isUserSwipingRef.current = false;
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

  // split day/month vs year so year can use marple 600 while the chevron uses marple 500
  const headerDateParts = useMemo(() => {
    const date = selectedDate ? new Date(selectedDate) : new Date();
    const locale = selectedDate ? 'en-UK' : 'en-US';
    const month = date.toLocaleDateString(locale, { month: 'long' });

    return {
      dayMonthLabel: `${date.getDate()} ${month} `,
      yearLabel: String(date.getFullYear()),
    };
  }, [selectedDate]);
  
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
   * Handle date selection
   * Converts date to ISO string and calls onSelectDate callback
   */
  const handleDateSelect = (date: Date) => {
    // light tap feedback when the planner week picker moves to a different day
    if (selectedDate) {
      const previous = new Date(selectedDate);
      const isSameCalendarDay =
        previous.getFullYear() === date.getFullYear() &&
        previous.getMonth() === date.getMonth() &&
        previous.getDate() === date.getDate();
      if (!isSameCalendarDay) {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } else {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onSelectDate(date.toISOString());
  };
  
  // single-letter labels (Mon–Sun) — matches compact week picker reference
  const dayLetters = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  
  return (
    <View>
      {!hideMonthHeader ? (
        <>
          {/* 
            HEADER: tap to open monthly selector stack screen.
            Shows formatted date (e.g. "6 March 2026") and chevron; when tapped, pushes
            the planner's month-select screen so the user can pick a date from the full month view.
          */}
          <TouchableOpacity
            style={[styles.header, styles.headerContainer]}
            onPress={onOpenMonthSelect}
            activeOpacity={0.7}
            disabled={!onOpenMonthSelect}
            accessibilityRole="button"
            accessibilityLabel={`${formattedDateText}. Opens monthly calendar`}
            accessibilityHint="Double tap to open the monthly date picker"
          >
            <Text key={selectedDate} style={{ flexShrink: 1 }}>
              <Text style={selectorChrome.monthHeader.dayMonth}>{headerDateParts.dayMonthLabel}</Text>
              <Text style={selectorChrome.monthHeader.year}>{headerDateParts.yearLabel}</Text>
            </Text>
            <Ionicons
              name="chevron-forward"
              size={selectorChrome.monthHeaderChevronSize}
              color={selectorChrome.monthHeaderChevronColor}
              style={{ marginLeft: selectorChrome.monthHeaderChevronGapFromYear }}
            />
          </TouchableOpacity>
        </>
      ) : null}

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

                return (
                  <View key={index} style={styles.dayColumn}>
                    <WeekDayColumn
                      date={date}
                      dayLetter={dayLetters[index]}
                      dayNumber={dayNumber}
                      isSelected={isSelected}
                      onSelectDate={handleDateSelect}
                      chrome={selectorChrome}
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
        removeClippedSubviews={false}
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
const createStyles = (layout: ResolvedWeekSelectorChrome['layout']) => StyleSheet.create({
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

  // week grid section — top/bottom padding from plannerWeekSelectorChrome layout tokens
  weekSectionContainer: {
    paddingHorizontal: 16,
    paddingTop: layout.sectionPaddingTop,
    paddingBottom: layout.sectionPaddingBottom,
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
  
  // week grid container — columns center their pill; minHeight keeps the row stable when selection moves
  weekGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    minHeight: layout.columnMinHeight,
  },

  // individual day column - letter + number stack with optional pill highlight
  dayColumn: {
    flex: 1,
    alignItems: 'center',
  },

  dayColumnPressable: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: layout.columnMinWidth,
    minHeight: layout.columnMinHeight,
    paddingVertical: layout.columnPaddingVertical,
    paddingHorizontal: layout.columnPaddingHorizontal,
    position: 'relative',
  },

  // vertical capsule hugging letter + number (not full column width)
  dayColumnPill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: layout.pillBorderRadius,
  },

  dayLetterText: {
    textAlign: 'center',
    marginBottom: layout.letterNumberGap,
  },

  dayNumberText: {
    textAlign: 'center',
  },
});

export default WeekView;