/**
 * DatePickerModal Component
 * 
 * A modal for selecting dates with quick options.
 * This modal provides an intuitive interface for date selection in task creation/editing.
 * 
 * Features:
 * - Quick date options (Today, Tomorrow, In 3 Days, Next Week, Next Month)
 * - Theme-aware styling
 * - Smooth animations
 */

// react: core react library
import React from 'react';

// react native components for the UI
import {
  Modal,
  ScrollView,
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';

// safe area handling for devices with notches/home indicators
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// modal layout components
import { ModalContainer, ModalHeader } from '@/components/layout/ModalLayout';

// quick date options component
import { QuickDateOptions } from './QuickDateOptions';

// calendar view component
import { CalendarView } from './CalendarView';

// icons from expo vector icons
import { Ionicons } from '@expo/vector-icons';

// typography system for consistent text styling
import { getTextStyle } from '@/constants/Typography';

// hooks for theme-aware colors
import { useThemeColors, useTaskColors } from '@/hooks/useColorPalette';

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
}) => {
  // get theme-aware colors for styling
  const themeColors = useThemeColors();
  const taskColors = useTaskColors();
  
  // get safe area insets to handle devices with notches/home indicators
  const insets = useSafeAreaInsets();
  
  /**
   * Handle date selection from quick options
   * This immediately confirms the selection and closes the modal
   */
  // when user picks a quick option (Today, Tomorrow, etc), we immediately apply it
  // flow: user taps quick option → this function runs → parent receives new date → modal closes
  const handleQuickDateSelect = (date: string, optionName: string) => {
    console.log(`Quick date selected: ${optionName}`);
    onSelectDate(date); // notify parent component
    onClose(); // close modal
  };
  
  /**
   * Handle date selection from calendar view
   * This immediately confirms the selection and closes the modal
   */
  // when user picks a specific date from the calendar, we immediately apply it
  // flow: user taps calendar date → this function runs → parent receives new date → modal closes
  const handleCalendarDateSelect = (date: string) => {
    console.log(`Calendar date selected: ${date}`);
    onSelectDate(date); // notify parent component
    onClose(); // close modal
  };
  
  /**
   * Handle modal close
   */
  const handleModalClose = () => {
    onClose();
  };
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleModalClose}
    >
      <ModalContainer
        presentationStyle="pageSheet"
        noPadding={true}
      >
        {/* custom header for date picker modal */}
        <ModalHeader
          title={title}
          onClose={handleModalClose}
          showCloseButton={true}
          showBorder={true}
        />
        
        <ScrollView
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
        
        </ScrollView>
        
        {/* 
          REPEATING OPTION SECTION
          Anchored to bottom of modal, outside of ScrollView
          Same styling as quick date options but no functionality
          Uses safe area insets to avoid home indicator overlap
        */}
        <View style={[styles.repeatingSection, { paddingBottom: insets.bottom + 24 }]}>
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
      </ModalContainer>
    </Modal>
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
    // removed padding to allow full-width buttons
    // removed gap to allow buttons to touch each other
  },
  
  // repeating section container - anchored to bottom
  repeatingSection: {
    // no margin/padding needed - anchored to bottom
  },
  
  // repeating button styling (matches quick date options)
  repeatingButton: {
    width: '100%',             // full width to touch edges
    borderTopWidth: 1,         // border at top to separate from content
    borderBottomWidth: 1,      // border at bottom to match other options
    flexDirection: 'row',      // horizontal layout
    alignItems: 'center',      // center vertically
    paddingVertical: 12,       // top/bottom padding
    paddingHorizontal: 16,     // left/right padding
    height: 48,                // consistent height
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

