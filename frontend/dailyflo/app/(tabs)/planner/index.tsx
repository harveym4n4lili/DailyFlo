
import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

// import our custom layout components
import { ScreenContainer } from '@/components';
import { FloatingActionButton } from '@/components/ui/Button';
import { ModalBackdrop } from '@/components/layout/ModalLayout';
import { CalendarNavigationModal } from '@/components/features/calendar/modals';
import { WeekView } from '@/components/features/calendar/sections';

// import color palette system for consistent theming
import { useThemeColors } from '@/hooks/useColorPalette';

// import typography system for consistent text styling
import { useTypography } from '@/hooks/useTypography';

// safe area context for handling devices with notches/home indicators
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PlannerScreen() {
  // CALENDAR MODAL STATE - Controls the visibility of the calendar modal
  const [isCalendarModalVisible, setIsCalendarModalVisible] = useState(false);
  
  // SELECTED DATE STATE - Currently selected date for calendar navigation
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // default to today's date as ISO string
    return new Date().toISOString();
  });
  
  // COLOR PALETTE USAGE - Getting theme-aware colors
  const themeColors = useThemeColors();
  
  // TYPOGRAPHY USAGE - Getting typography system for consistent text styling
  const typography = useTypography();
  
  // SAFE AREA INSETS - Get safe area insets for proper positioning
  const insets = useSafeAreaInsets();
  
  // create dynamic styles using the color palette system and typography system
  const styles = useMemo(() => createStyles(themeColors, typography, insets), [themeColors, typography, insets]);

  // CALENDAR HANDLERS
  // handle calendar modal close
  const handleCalendarClose = () => {
    setIsCalendarModalVisible(false);
  };

  // handle date selection from calendar modal or week view
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

      <ScreenContainer 
        scrollable={false}
        paddingHorizontal={0}
        safeAreaTop={false}
        safeAreaBottom={false}
        paddingVertical={0}
      >
        {/* Week View - weekly calendar navigation */}
        <View style={styles.weekViewContainer}>
          <WeekView
            selectedDate={selectedDate}
            onSelectDate={handleDateSelect}
            onHeaderPress={() => setIsCalendarModalVisible(true)}
          />
        </View>
        
        {/* Content area */}
        <View style={styles.contentContainer}>
          {/* Planner content will go here */}
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
  // week view container - positioned at top with safe area padding
  weekViewContainer: {
    paddingTop: insets.top,
    backgroundColor: themeColors.background.primary(),
  },

  // content container
  contentContainer: {
    flex: 1,
  },
});