
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// import our custom layout components
import { ScreenContainer } from '@/components';
import { DropdownList } from '@/components/ui/List';
import { FloatingActionButton } from '@/components/ui/Button';
import { ModalBackdrop } from '@/components/layout/ModalLayout';
import { CalendarNavigationModal } from '@/components/features/calendar/modals';

// import color palette system for consistent theming
import { useThemeColors } from '@/hooks/useColorPalette';

// import typography system for consistent text styling
import { useTypography } from '@/hooks/useTypography';

// useThemeColor: hook that provides the global theme color selected by the user
import { useThemeColor } from '@/hooks/useThemeColor';

// safe area context for handling devices with notches/home indicators
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PlannerScreen() {
  // DROPDOWN STATE - Controls the visibility of the dropdown menu
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  
  // TITLE STATE - Controls the visibility of the title header
  const [showTitle, setShowTitle] = useState(false);
  
  // CALENDAR MODAL STATE - Controls the visibility of the calendar modal
  const [isCalendarModalVisible, setIsCalendarModalVisible] = useState(false);
  
  // SELECTED DATE STATE - Currently selected date for calendar navigation
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // default to today's date as ISO string
    return new Date().toISOString();
  });
  
  // Animated value for title fade effect
  const titleOpacity = useRef(new Animated.Value(0)).current;
  
  // Ref to track if animation is currently running
  const isAnimatingRef = useRef(false);
  
  // COLOR PALETTE USAGE - Getting theme-aware colors
  const themeColors = useThemeColors();
  
  // TYPOGRAPHY USAGE - Getting typography system for consistent text styling
  const typography = useTypography();
  
  // THEME COLOR USAGE
  // get the global theme color selected by the user (default: red)
  // this is used for interactive elements like the ellipse button
  const { getThemeColorValue } = useThemeColor();
  const themeColor = getThemeColorValue(500); // use shade 500 for ellipse button color
  
  // SAFE AREA INSETS - Get safe area insets for proper positioning
  const insets = useSafeAreaInsets();
  
  // create dynamic styles using the color palette system and typography system
  const styles = useMemo(() => createStyles(themeColors, typography, insets), [themeColors, typography, insets]);
  
  // SCROLL DETECTION EFFECT
  // Monitor scroll position and show title when screen title is covered
  useEffect(() => {
    const handleScrollChange = (scrollY: number) => {
      // lower threshold (more negative) makes the title appear earlier when scrolling up
      const titleThreshold = insets.top - 60;
      
      if (scrollY >= titleThreshold && !showTitle && !isAnimatingRef.current) {
        setShowTitle(true);
        isAnimatingRef.current = true;
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          isAnimatingRef.current = false;
        });
      } else if (scrollY < titleThreshold && showTitle && !isAnimatingRef.current) {
        isAnimatingRef.current = true;
        Animated.timing(titleOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setShowTitle(false);
          isAnimatingRef.current = false;
        });
      }
    };

    (global as any).trackScrollToPlannerLayout = handleScrollChange;

    return () => {
      delete (global as any).trackScrollToPlannerLayout;
    };
  }, [insets.top, showTitle, titleOpacity]);

  // DROPDOWN HANDLERS
  // handle ellipse button press - toggles dropdown menu visibility
  const handleEllipsePress = () => {
    setIsDropdownVisible(!isDropdownVisible);
  };

  // create dropdown menu items array (empty for now)
  const dropdownMenuItems: any[] = [];

  // CALENDAR HANDLERS
  // handle show calendar button press - opens calendar modal
  const handleShowCalendar = () => {
    setIsCalendarModalVisible(true);
  };

  // handle calendar modal close
  const handleCalendarClose = () => {
    setIsCalendarModalVisible(false);
  };

  // handle date selection from calendar modal
  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    // print the selected day to console
    const selectedDay = new Date(date);
    console.log('Selected day:', selectedDay.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }));
  };

  // render main content
  return (
    <View style={{ flex: 1 }}>
      

      {/* dropdown list - using reusable DropdownList component */}
      <DropdownList
        visible={isDropdownVisible}
        onClose={() => setIsDropdownVisible(false)}
        items={dropdownMenuItems}
        anchorPosition="top-right"
        topOffset={72}
        rightOffset={20}
      />

      <ScreenContainer 
        scrollable={false}
        paddingHorizontal={0}
        safeAreaTop={false}
        safeAreaBottom={false}
        paddingVertical={0}
      >
        {/* Content area */}
        <View style={styles.contentContainer}>
          {/* Show Calendar Button */}
          <Pressable
            style={({ pressed }) => [
              styles.showCalendarButton,
              {
                backgroundColor: pressed 
                  ? themeColors.background.tertiary()
                  : themeColors.background.secondary(),
              }
            ]}
            onPress={handleShowCalendar}
            accessibilityRole="button"
            accessibilityLabel="Show calendar"
          >
            <Ionicons 
              name="calendar-outline" 
              size={20} 
              color={themeColors.text.primary()} 
              style={styles.buttonIcon}
            />
            <Text style={styles.buttonText}>Show Calendar</Text>
          </Pressable>
        </View>

        {/* Floating Action Button for quick task creation */}
        <FloatingActionButton
          onPress={() => {
            console.log('FAB Pressed - Ready to create new task!');
            // TODO: Navigate to task creation modal
          }}
          accessibilityLabel="Add new task"
          accessibilityHint="Double tap to create a new task"
        />
      </ScreenContainer>

      {/* separate backdrop that fades in independently behind the modal */}
      <ModalBackdrop
        isVisible={isCalendarModalVisible}
        onPress={handleCalendarClose}
        zIndex={10000}
      />
      
      {/* Calendar Navigation Modal */}
      <CalendarNavigationModal
        visible={isCalendarModalVisible}
        selectedDate={selectedDate}
        onClose={handleCalendarClose}
        onSelectDate={handleDateSelect}
        title="Select Date"
      />
    </View>
  );
}

// create dynamic styles using the color palette system and typography system
const createStyles = (
  themeColors: ReturnType<typeof useThemeColors>, 
  typography: ReturnType<typeof useTypography>,
  insets: ReturnType<typeof useSafeAreaInsets>
) => StyleSheet.create({
  // fixed top section with ellipse button - stays at top of screen
  fixedTopSection: {
    position: 'absolute',
    top: insets.top,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingHorizontal: 20,
    height: insets.top + 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // animated background layer that fades in
  fixedTopSectionBackground: {
    position: 'absolute',
    top: -insets.top,
    left: 0,
    right: 0,
    bottom: 0,
    height: insets.top + insets.top + 10,
    zIndex: -1,
  },
  
  // animated border layer that fades in
  fixedTopSectionBorder: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: -1,
  },

  // title container - ensures consistent layout structure
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // title header styling
  titleHeader: {
    ...typography.getTextStyle('heading-2'),
    color: themeColors.text.primary(),
    fontWeight: '600',
  },

  // ellipse button styling
  ellipseButton: {
    position: 'absolute',
    right: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // content container
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  // show calendar button styling
  showCalendarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    minHeight: 44,
    gap: 8,
  },

  // button icon styling
  buttonIcon: {
    marginRight: 4,
  },

  // button text styling
  buttonText: {
    ...typography.getTextStyle('body-large'),
    color: themeColors.text.primary(),
    fontWeight: '600',
  },
});