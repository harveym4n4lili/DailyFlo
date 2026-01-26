/**
 * DatePickerModal Component
 * 
 * A draggable modal for selecting dates with quick options.
 * This modal provides an intuitive interface for date selection in task creation/editing.
 * Uses DraggableModal for smooth drag-to-dismiss and snap point functionality.
 * 
 * Features:
 * - Quick date options (Today, Tomorrow, In 3 Days, Next Week, Next Month)
 * - Draggable bottom sheet with snap points
 * - Theme-aware styling
 * - Smooth animations
 */

// react: core react library
import React, { useState, useEffect } from 'react';

// react native components for the UI
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
} from 'react-native';

// safe area handling for devices with notches/home indicators
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// modal layout components
import { DraggableModal, WrappedDraggableModal, ModalHeader, LockableScrollView } from '@/components/layout/ModalLayout';

// quick date options component
import { QuickDateOptions } from '../sections/QuickDateOptions';

// calendar view component
import { CalendarView } from '../sections/CalendarView';

// icons from expo vector icons
import { Ionicons } from '@expo/vector-icons';

// typography system for consistent text styling
import { getTextStyle } from '@/constants/Typography';

// hooks for theme-aware colors
import { useThemeColors, useTaskColors } from '@/hooks/useColorPalette';

// types for type safety
import type { TaskColor } from '@/types';

/**
 * Props for DatePickerModal component
 */
export interface DatePickerModalProps {
  /**
   * Whether the modal is visible
   */
  visible: boolean;
  
  /**
   * Currently selected date (as ISO string)
   * This is the date that will be highlighted in the picker
   */
  selectedDate?: string;
  
  /**
   * Callback when the modal is closed
   */
  onClose: () => void;
  
  /**
   * Callback when a date is selected
   * @param date - The selected date as ISO string
   */
  onSelectDate: (date: string) => void;
  
  /**
   * Optional title for the modal
   * @default "Select Date"
   */
  title?: string;
  
  /**
   * Task category color for button styling
   */
  taskCategoryColor?: TaskColor;
  
  /**
   * Whether to use WrappedDraggableModal (with slide animation) instead of DraggableModal
   * When true, use WrappedDraggableModal which provides slide-up animation from Modal component
   * When false (default), use DraggableModal directly for custom animation
   * @default false
   */
  useWrappedModal?: boolean;
}

/**
 * DatePickerModal Component
 * 
 * Main modal for date selection. Displays quick date options.
 */
export const DatePickerModal: React.FC<DatePickerModalProps> = ({
  visible,
  selectedDate,
  onClose,
  onSelectDate,
  title = 'Select Date',
  taskCategoryColor,
  useWrappedModal = false,
}) => {
  // CONSOLE DEBUGGING
  // console.log('📅 DatePickerModal - visible:', visible);
  
  // get theme-aware colors for styling
  const themeColors = useThemeColors();
  const taskColors = useTaskColors();
  
  // get safe area insets to handle devices with notches/home indicators
  const insets = useSafeAreaInsets();
  
  // changes are now applied instantly - no temporary state needed
  
  /**
   * Handle date selection from quick options
   * Immediately applies the date and closes the modal
   */
  // when user picks a quick option (Today, Tomorrow, etc), we apply it immediately
  // flow: user taps quick option → applies date to parent → modal closes
  const handleQuickDateSelect = (date: string, optionName: string) => {
    // console.log(`Quick date selected: ${optionName}`);
    onSelectDate(date); // apply date to parent immediately
    onClose(); // close modal immediately
  };
  
  /**
   * Handle date selection from calendar view
   * Applies changes instantly - no save button needed
   */
  // when user picks a specific date from the calendar, we apply it immediately
  // flow: user taps calendar date → applies date to parent immediately → modal stays open
  const handleCalendarDateSelect = (date: string) => {
    // console.log(`Calendar date selected: ${date}`);
    onSelectDate(date); // apply date to parent immediately
  };
  
  /**
   * Handle modal close (backdrop/drag)
   */
  const handleModalClose = () => {
    onClose();
  };
  
  // create the repeating section as a separate element to pass to DraggableModal
  // this floating container stays fixed at bottom while modal drags
  const repeatingContainer = (
    <View style={[
      styles.repeatingSection, 
      { 
        paddingBottom: insets.bottom,
        backgroundColor: themeColors.background.elevated(),
      }
    ]}>
      <Pressable
        onPress={() => {
          // repeating option has no functionality - do nothing
        }}
        style={({ pressed }) => [
          styles.repeatingButton,
          {
            backgroundColor: pressed
              ? themeColors.background.tertiary()
              : themeColors.background.elevated(),
            borderColor: themeColors.border.primary(),
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Repeating task option"
      >
        {/* icon and label on the left with proper spacing */}
        <View style={styles.repeatingLeftContent}>
          <View style={styles.repeatingIconContainer}>
            <Ionicons 
              name="repeat-outline" 
              size={20} 
              color={taskColors.teal()}
            />
          </View>
          
          {/* repeating label next to the icon */}
          <Text
            style={[
              getTextStyle('body-large'),
              styles.repeatingText,
              {
                color: themeColors.text.primary()
              },
            ]}
          >
            Repeating
          </Text>
        </View>
      </Pressable>
    </View>
  );
  
  // modal content - shared between both modal types
  const modalContent = (
    <>
      {/* custom header for date picker modal - no action buttons needed (changes apply instantly) */}
      <ModalHeader
        title={title}
        showActionButtons={false}
        showCloseButton={true}
        onClose={onClose}
        showDragIndicator={true}
        showBorder={true}
        taskCategoryColor={taskCategoryColor}
      />
        
        {/* LockableScrollView automatically locks scrolling when modal is not at top anchor */}
        <LockableScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* quick date options */}
          <QuickDateOptions
            selectedDate={selectedDate || ''}
            onSelectDate={handleQuickDateSelect}
          />
          
          {/* calendar view for specific date selection */}
          <CalendarView
            selectedDate={selectedDate || ''}
            onSelectDate={handleCalendarDateSelect}
            initialMonth={selectedDate ? new Date(selectedDate) : undefined}
          />
        
        </LockableScrollView>
    </>
  );

  // use WrappedDraggableModal when useWrappedModal prop is true (for slide animation)
  // use DraggableModal directly when false (for custom animation, default behavior)
  if (useWrappedModal) {
    return (
      <WrappedDraggableModal
        visible={visible}
        onClose={handleModalClose}
        // snap points: close at 30%, initial at 60%, expanded at 95%
        // lowest snap point (30%) will dismiss the modal
        snapPoints={[0.3, 0.6, 0.9]}
        // start at the middle snap point (60%)
        initialSnapPoint={1}
        // pass the repeating container as sticky footer - stays fixed at bottom while modal drags
        stickyFooter={repeatingContainer}
        // backdrop is handled separately by ModalBackdrop component in parent
        backgroundColor={themeColors.background.elevated()}
      >
        {modalContent}
      </WrappedDraggableModal>
    );
  }

  return (
    <>
      <DraggableModal
        visible={visible}
        onClose={handleModalClose}
        // snap points: close at 30%, initial at 60%, expanded at 95%
        // lowest snap point (30%) will dismiss the modal
        snapPoints={[0.3, 0.6, 0.9]}
        // start at the middle snap point (60%)
        initialSnapPoint={1}
        // pass the repeating container as sticky footer - stays fixed at bottom while modal drags
        stickyFooter={repeatingContainer}
        // showBackdrop=true: DraggableModal handles its own backdrop
        showBackdrop={true}
      >
        {modalContent}
      </DraggableModal>
    </>
  );
};

/**
 * Styles for DatePickerModal
 */
const styles = StyleSheet.create({
  // scroll view
  scrollView: {
    flex: 1,
  },
  
  // content container
  contentContainer: {
    flexGrow: 1, // stretch to fill available space
    // removed padding to allow full-width buttons
    // removed gap to allow buttons to touch each other
  },
  
  // repeating section container - fixed at bottom, independent of modal drag
  // stretches all the way to the bottom edge of the screen
  repeatingSection: {
    position: 'absolute',        // fixed relative to screen viewport
    left: 0,                     // align to left edge
    right: 0,                    // align to right edge
    bottom: 0,                   // stretch to bottom edge
    zIndex: 100,                 // very high z-index to be above modal content
  },
  
  // repeating button styling (matches quick date options)
  repeatingButton: {
    width: '100%',             // full width to touch edges
    borderTopWidth: 1,         // border at top to separate from content
    flexDirection: 'row',      // horizontal layout
    alignItems: 'center',      // center vertically
    paddingVertical: 12,       // top/bottom padding
    paddingHorizontal: 16,     // left/right padding
    minHeight: 48,             // minimum height for tap target
    // shadow for floating effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,              // shadow for Android
  },
  
  // container for icon and label on the left
  repeatingLeftContent: {
    flexDirection: 'row',      // horizontal layout
    alignItems: 'center',      // center vertically
    flex: 1,                   // take up available space
  },
  
  // container for the icon on the left
  repeatingIconContainer: {
    width: 20,                 // fixed width to align icons consistently
    alignItems: 'center',      // center icon horizontally
    justifyContent: 'center',  // center icon vertically
    marginRight: 12,           // space between icon and label
  },
  
  // repeating text styling
  repeatingText: {
    fontWeight: '700',         // bold for emphasis
  },
});

export default DatePickerModal;

