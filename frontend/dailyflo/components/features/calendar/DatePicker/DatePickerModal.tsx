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
  StyleSheet,
} from 'react-native';

// modal layout components
import { ModalContainer, ModalHeader } from '@/components/layout/ModalLayout';

// quick date options component
import { QuickDateOptions } from './QuickDateOptions';

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
        
        </ScrollView>
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
});

export default DatePickerModal;

