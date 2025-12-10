/**
 * TaskViewModal
 * 
 * Draggable modal for viewing task details.
 * Uses WrappedDraggableModal for slide animation (Modal wrapper).
 * Currently blank with only a close button on the left.
 */

// REACT IMPORTS
// react: core react library for building components
import React from 'react';

// REACT NATIVE IMPORTS
import { View, Text, StyleSheet, Animated } from 'react-native';

// LAYOUT COMPONENTS IMPORTS
// WrappedDraggableModal: draggable modal wrapped in Modal for slide animation
// ModalHeader: header component with close button and drag indicator
import { WrappedDraggableModal, ModalHeader } from '@/components/layout/ModalLayout';

// TASK VIEW SECTIONS IMPORTS
// FirstSection: section containing task icon, title, and description
// DateSection: section displaying task due date with dynamic messaging
// ListSection: section displaying task's associated list name and icon
// PickerButtonsSection: horizontal scrollable section with form picker buttons
import { FirstSection, DateSection, ListSection, PickerButtonsSection } from './sections';

// CUSTOM HOOKS IMPORTS
// hooks for accessing design system and theme
import { useThemeColors } from '@/hooks/useColorPalette';

// TYPES IMPORTS
// typescript types for type safety
import type { TaskColor, Task } from '@/types';
import { FontWeight } from '@/constants/Typography';

/**
 * Props for the TaskViewModal component
 */
export interface TaskViewModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  
  /** Callback when modal should close */
  onClose: () => void;
  
  /** Task color for styling */
  taskColor?: TaskColor;
  
  /** Task ID to display (will be used to fetch task data) */
  taskId?: string;
  
  /** Task data (optional, if provided will be used instead of fetching) */
  task?: Task;
}

/**
 * TaskViewModal Component
 * 
 * Uses WrappedDraggableModal for slide animation (Modal wrapper).
 * Currently blank with only a close button on the left.
 */
export function TaskViewModal({ 
  visible, 
  onClose,
  taskColor = 'blue',
  taskId,
  task,
}: TaskViewModalProps) {
  // HOOKS
  // get theme-aware colors for styling
  const themeColors = useThemeColors();

  // COMPONENT RENDER
  // using WrappedDraggableModal for slide animation
  // backdrop is rendered separately in parent component (TodayScreen) so it fades in independently
  return (
    <WrappedDraggableModal
      visible={visible}
      onClose={onClose}
      snapPoints={[0.3, 0.65, 0.9]}
      initialSnapPoint={1}
    >
      {/* modal header with close button on left and drag indicator */}
      <ModalHeader
        showCloseButton={true}
        closeButtonPosition="left"
        showDragIndicator={true}
        onClose={onClose}
        showBorder={false}
      />

      {/* main content area */}
      <View style={styles.contentContainer}>
        {/* first section: icon + title, description, and form picker buttons - all contained */}
        <View style={[styles.firstSection, { backgroundColor: themeColors.background.elevated() }]}>
          {/* first section: task icon, title, and description */}
          <FirstSection task={task} />

          {/* border below description */}
          <View style={[styles.sectionBorder, { borderBottomColor: themeColors.border.primary() }]} />

          {/* list section: displays task's associated list name and icon */}
          <View style={styles.listSection}>
            <ListSection 
              listId={task?.listId || null}
              listName={undefined} // TODO: fetch list name from listId
              listIcon={undefined} // TODO: fetch list icon from listId
            />
          </View>

          {/* border below list section */}
          <View style={[styles.sectionBorder, { borderBottomColor: themeColors.border.primary() }]} />

          {/* date section: displays task due date with dynamic messaging */}
          <View style={styles.dateSection}>
            <DateSection dueDate={task?.dueDate || null} />
          </View>

          {/* form picker button section */}
          <View style={styles.pickerButtonsSection}>
            <PickerButtonsSection
              values={{
                icon: task?.icon,
                color: task?.color || taskColor,
                dueDate: task?.dueDate || undefined,
                time: task?.time,
                duration: task?.duration,
                alerts: [],
              }}
              iconButtonHighlightOpacity={new Animated.Value(0)}
              dateButtonHighlightOpacity={new Animated.Value(0)}
              timeButtonHighlightOpacity={new Animated.Value(0)}
              alertsButtonHighlightOpacity={new Animated.Value(0)}
              onShowIconColorPicker={() => {}}
              onShowDatePicker={() => {}}
              onShowTimeDurationPicker={() => {}}
              onShowAlertsPicker={() => {}}
            />
          </View>
        </View>
      </View>
    </WrappedDraggableModal>
  );
}

// STYLES
// stylesheet for component styling
const styles = StyleSheet.create({
  // main content container - fills available space
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20, // horizontal padding from screen edges
  },
  
  // first section - contains icon + title and description
  firstSection: {
    borderRadius: 24, // rounded corners for modern look
    padding: 16, // padding inside the container
    
  },
  
  // border below description (inside elevated container)
  // borders have no spacing - sections handle their own padding
  sectionBorder: {
    borderBottomWidth: 1,
    marginTop: 16, // no top margin - borders have no spacing
    marginBottom: 0, // no bottom margin - borders have no spacing
  },
  
  // date section - displays task due date
  // equal vertical padding for all sections
  dateSection: {
    paddingTop: 16, // equal vertical padding for sections
  },
  
  // list section - displays task's associated list
  // equal vertical padding for all sections
  listSection: {
    paddingTop: 16, // equal vertical padding for sections
  },
  
  // form picker button section
  // negative margins counteract parent container padding to extend to edges
  pickerButtonsSection: {
    marginHorizontal: -16, // negative margin to counteract contentContainer padding (16px)
    paddingTop: 20,
  },
  
});

export default TaskViewModal;

