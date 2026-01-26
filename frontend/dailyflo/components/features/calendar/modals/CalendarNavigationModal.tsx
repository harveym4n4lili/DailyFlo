/**
 * CalendarNavigationModal Component
 * 
 * A modal for navigating to a specific date to view tasks.
 * Uses WrappedDraggableModal for slide-up animation and drag functionality.
 * Contains CalendarView for date selection.
 * 
 * HOW IT WORKS:
 * 1. User opens modal to navigate to a different date
 * 2. CalendarView displays month grid with navigation
 * 3. When user selects a date, onSelectDate is called and modal closes
 * 4. Parent component handles navigation to the selected date
 */

// react: core react library for component state
import React from 'react';

// react native components for building the modal UI
import { View, StyleSheet } from 'react-native';

// safe area context for handling devices with notches/home indicators
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// modal layout components - WrappedDraggableModal provides slide animation and drag functionality
import { WrappedDraggableModal, ModalHeader, LockableScrollView } from '@/components/layout/ModalLayout';

// calendar view component for date selection
import { CalendarView } from '../sections/CalendarView';

// hooks for theme-aware colors that adapt to light/dark mode
import { useThemeColors } from '@/hooks/useColorPalette';

/**
 * Props for CalendarNavigationModal component
 * These props define what data the modal needs and how it communicates back
 */
export interface CalendarNavigationModalProps {
  /**
   * Whether the modal is visible
   * Controls whether the modal is shown or hidden
   */
  visible: boolean;
  
  /**
   * Currently selected date (as ISO string)
   * Used to highlight the currently selected date in the calendar
   * Also determines which month to display initially
   */
  selectedDate: string;
  
  /**
   * Callback when modal should close
   * Called when user drags modal down, taps backdrop, or closes via button
   */
  onClose: () => void;
  
  /**
   * Callback when a date is selected
   * @param date - The selected date as ISO string
   * Called when user taps on a date in the calendar
   * Modal closes after selection
   */
  onSelectDate: (date: string) => void;
  
  /**
   * Optional title for the modal header
   * @default "Select Date"
   */
  title?: string;
}

/**
 * CalendarNavigationModal Component
 * 
 * Modal for navigating to a specific date to view tasks.
 * Displays a calendar grid for date selection.
 */
export const CalendarNavigationModal: React.FC<CalendarNavigationModalProps> = ({
  visible,
  selectedDate,
  onClose,
  onSelectDate,
  title = 'Select Date',
}) => {
  // get theme-aware colors for styling (adapts to light/dark mode)
  const themeColors = useThemeColors();
  
  // get safe area insets to handle devices with notches/home indicators
  const insets = useSafeAreaInsets();
  
  /**
   * Handle date selection from calendar view
   * Applies the selected date but keeps the modal open
   */
  // when user picks a date from the calendar, we apply it but keep the modal open
  // flow: user taps calendar date → applies date to parent → modal stays open
  const handleDateSelect = (date: string) => {
    onSelectDate(date); // apply date to parent (parent handles navigation)
    // modal stays open - user can select another date or close manually
  };
  
  /**
   * Handle modal close (backdrop/drag/button)
   */
  const handleModalClose = () => {
    onClose();
  };
  
  return (
    <WrappedDraggableModal
      visible={visible}
      onClose={handleModalClose}
      // snap points: close at 30%, initial at 60%, expanded at 90%
      // lowest snap point (30%) will dismiss the modal when dragged down
      snapPoints={[0.3, 0.6, 0.9]}
      // start at the middle snap point (60%)
      initialSnapPoint={1}
      // background color matches theme
      backgroundColor={themeColors.background.elevated()}
      // disable drag gestures - modal cannot be dragged
      disableGestures={true}
    >
      {/* modal header with close button only (no title, border, or drag indicator) */}
      <ModalHeader
        showActionButtons={false}
        showCloseButton={true}
        onClose={onClose}
        showDragIndicator={false}
        showBorder={false}
      />
      
      {/* scrollable content container - LockableScrollView automatically locks scrolling when modal is not at top anchor */}
      <LockableScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: insets.bottom + 16 }, // add bottom padding for safe area
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* calendar view for date selection */}
        <CalendarView
          selectedDate={selectedDate}
          onSelectDate={handleDateSelect}
          initialMonth={selectedDate ? new Date(selectedDate) : undefined}
        />
      </LockableScrollView>
    </WrappedDraggableModal>
  );
};

/**
 * Styles for CalendarNavigationModal
 * 
 * STYLING PHILOSOPHY:
 * 1. Use flexbox for responsive layouts
 * 2. Consistent spacing and padding
 * 3. Safe area handling for devices with notches
 */
const styles = StyleSheet.create({
  // scroll view container
  scrollView: {
    flex: 1,
  },
  
  // content container - no padding (CalendarView handles its own padding)
  contentContainer: {
    flexGrow: 1, // stretch to fill available space
    // no paddingHorizontal - CalendarView container handles padding
  },
});
