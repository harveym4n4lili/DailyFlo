/**
 * TaskViewModal
 * 
 * Draggable modal for viewing task details.
 * Uses WrappedDraggableModal for slide animation (Modal wrapper).
 * Currently blank with only a close button on the left.
 */

// REACT IMPORTS
// react: core react library for building components
import React, { useRef, useState, useRef as useReactRef } from 'react';

// REACT NATIVE IMPORTS
import { View, Text, StyleSheet, Animated, Pressable, Keyboard } from 'react-native';

// LAYOUT COMPONENTS IMPORTS
// WrappedDraggableModal: draggable modal wrapped in Modal for slide animation
// ModalHeader: header component with close button and drag indicator
// DraggableModalRef: ref type for programmatic control of draggable modal
import { WrappedDraggableModal, ModalHeader } from '@/components/layout/ModalLayout';
import type { DraggableModalRef } from '@/components/layout/ModalLayout/DraggableModal';

// TASK VIEW SECTIONS IMPORTS
// FirstSection: section containing task icon, title, and description
// DateSection: section displaying task due date with dynamic messaging
// ListSection: section displaying task's associated list name and icon
// PickerButtonsSection: horizontal scrollable section with form picker buttons
import { FirstSection, DateSection, ListSection, PickerButtonsSection } from './sections';

// UI COMPONENTS IMPORTS
// GroupedList: flexible iOS-style grouped list component
import { GroupedList } from '@/components/ui/List/GroupedList';

// FEATURE COMPONENTS IMPORTS
// modals for date, time/duration, and alerts pickers
import { DatePickerModal } from '@/components/features/calendar';
import { TimeDurationModal, AlertModal } from '../TaskCreation/modals';

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

  // REF FOR DRAGGABLE MODAL
  // used to programmatically control modal position (e.g., snap to top when section is tapped)
  const draggableModalRef = useRef<DraggableModalRef>(null);

  // FORM STATE
  // local state for form values - initialized from task prop
  // these values are used to populate picker modals and can be updated
  const [formValues, setFormValues] = useState({
    dueDate: task?.dueDate || undefined,
    time: task?.time || undefined,
    duration: task?.duration || undefined,
    alerts: [] as string[], // TODO: convert from TaskReminder[] when alerts are implemented
  });

  // update form values when task prop changes
  // this ensures the form reflects the latest task data
  React.useEffect(() => {
    if (task) {
      setFormValues({
        dueDate: task.dueDate || undefined,
        time: task.time || undefined,
        duration: task.duration || undefined,
        alerts: [], // TODO: convert from TaskReminder[] when alerts are implemented
      });
    }
  }, [task]);

  // PICKER MODAL VISIBILITY STATE
  // track visibility of all form picker modals
  // only one modal should be open at a time for better UX
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [isTimeDurationPickerVisible, setIsTimeDurationPickerVisible] = useState(false);
  const [isAlertsPickerVisible, setIsAlertsPickerVisible] = useState(false);

  // check if any picker modal is currently visible
  // used to disable dragging and scrolling on TaskViewModal when secondary modals are open
  const isAnyPickerVisible = isDatePickerVisible || isTimeDurationPickerVisible || isAlertsPickerVisible;

  // HELPER FUNCTION: Close all modals except the one being opened
  // this ensures seamless transitions by preventing multiple modals from being open
  const closeAllModalsExcept = (modalToKeep: string) => {
    if (modalToKeep !== 'date') setIsDatePickerVisible(false);
    if (modalToKeep !== 'time') setIsTimeDurationPickerVisible(false);
    if (modalToKeep !== 'alerts') setIsAlertsPickerVisible(false);
  };

  // DATE PICKER HANDLERS
  // handle opening and closing the date picker modal
  const handleShowDatePicker = () => {
    Keyboard.dismiss(); // close keyboard when opening date picker
    closeAllModalsExcept('date');
    setIsDatePickerVisible(true);
  };

  const handleDateSelect = (date: string) => {
    // update local form state when date is selected
    setFormValues(prev => ({ ...prev, dueDate: date }));
  };

  const handleDatePickerClose = () => {
    setIsDatePickerVisible(false);
  };

  // TIME/DURATION PICKER HANDLERS
  // handle opening and closing the time/duration picker modal
  const handleShowTimeDurationPicker = () => {
    Keyboard.dismiss(); // close keyboard when opening time/duration picker
    closeAllModalsExcept('time');
    setIsTimeDurationPickerVisible(true);
  };

  const handleTimeSelect = (time: string | undefined) => {
    // update local form state when time is selected
    setFormValues(prev => ({ ...prev, time }));
  };

  const handleDurationSelect = (duration: number | undefined) => {
    // update local form state when duration is selected
    setFormValues(prev => ({ ...prev, duration }));
  };

  const handleTimeDurationPickerClose = () => {
    setIsTimeDurationPickerVisible(false);
  };

  // ALERTS PICKER HANDLERS
  // handle opening and closing the alerts picker modal
  const handleShowAlertsPicker = () => {
    Keyboard.dismiss(); // close keyboard when opening alerts picker
    closeAllModalsExcept('alerts');
    setIsAlertsPickerVisible(true);
  };

  const handleAlertsPickerClose = () => {
    setIsAlertsPickerVisible(false);
  };

  const handleAlertsApply = (alertIds: string[]) => {
    // update local form state when alerts are applied
    setFormValues(prev => ({ ...prev, alerts: alertIds }));
  };

  // ANIMATION VALUES
  // animated values for darken highlight effect on section press
  // these control the opacity of text and icons when sections are pressed
  // 0 = normal brightness, 1 = darkened (reduced opacity)
  const firstSectionOpacity = useRef(new Animated.Value(1)).current;
  const listSectionOpacity = useRef(new Animated.Value(1)).current;
  const dateSectionOpacity = useRef(new Animated.Value(1)).current;

  // PRESS HANDLERS
  // handle press in/out animations for darken highlight effect
  // when pressed, animate opacity to 0.5 (darkened), when released, animate back to 1 (normal)
  const handleFirstSectionPressIn = () => {
    // animate to darkened state (0.5 opacity) when pressed
    Animated.timing(firstSectionOpacity, {
      toValue: 0.5, // reduced opacity makes content appear darker
      duration: 100, // quick animation for responsive feel
      useNativeDriver: true, // use native driver for better performance
    }).start();
  };

  const handleFirstSectionPressOut = () => {
    // animate back to normal state (1 opacity) when released
    Animated.timing(firstSectionOpacity, {
      toValue: 1, // full opacity (normal brightness)
      duration: 100, // quick animation for responsive feel
      useNativeDriver: true, // use native driver for better performance
    }).start();
  };

  // handle first section press - snap to top when tapped
  const handleFirstSectionPress = () => {
    snapToTop();
  };

  const handleListSectionPressIn = () => {
    // animate to darkened state (0.5 opacity) when pressed
    Animated.timing(listSectionOpacity, {
      toValue: 0.5, // reduced opacity makes content appear darker
      duration: 100, // quick animation for responsive feel
      useNativeDriver: true, // use native driver for better performance
    }).start();
  };

  const handleListSectionPressOut = () => {
    // animate back to normal state (1 opacity) when released
    Animated.timing(listSectionOpacity, {
      toValue: 1, // full opacity (normal brightness)
      duration: 100, // quick animation for responsive feel
      useNativeDriver: true, // use native driver for better performance
    }).start();
  };

  // handle list section press - snap to top when tapped
  const handleListSectionPress = () => {
    snapToTop();
  };

  const handleDateSectionPressIn = () => {
    // animate to darkened state (0.5 opacity) when pressed
    Animated.timing(dateSectionOpacity, {
      toValue: 0.5, // reduced opacity makes content appear darker
      duration: 100, // quick animation for responsive feel
      useNativeDriver: true, // use native driver for better performance
    }).start();
  };

  const handleDateSectionPressOut = () => {
    // animate back to normal state (1 opacity) when released
    Animated.timing(dateSectionOpacity, {
      toValue: 1, // full opacity (normal brightness)
      duration: 100, // quick animation for responsive feel
      useNativeDriver: true, // use native driver for better performance
    }).start();
  };

  // update date section press handler to also open date picker and snap modal to top
  const handleDateSectionPress = () => {
    // snap modal to top (fully expanded) when date section is tapped
    snapToTop();
    handleShowDatePicker();
  };

  // helper function to snap modal to top when any section is tapped
  // this ensures the modal is fully expanded when user interacts with sections
  const snapToTop = () => {
    draggableModalRef.current?.snapToTop();
  };

  // COMPONENT RENDER
  // using WrappedDraggableModal for slide animation
  // backdrop is rendered separately in parent component (TodayScreen) so it fades in independently
  return (
    <WrappedDraggableModal
      ref={draggableModalRef}
      visible={visible}
      onClose={onClose}
      snapPoints={[0.3, 0.65, 0.9]}
      initialSnapPoint={1}
      backgroundColor={themeColors.background.primary()}
      disableGestures={isAnyPickerVisible} // disable dragging when any picker modal is open
    >
      {/* modal header with MainCloseButton on left and drag indicator */}
      <ModalHeader
        showCloseButton={true}
        closeButtonPosition="left"
        showDragIndicator={true}
        onClose={onClose}
        showBorder={false}
        useMainCloseButton={true}
        taskCategoryColor={task?.color || taskColor}
      />

      {/* main content area */}
      <View style={styles.contentContainer}>
        {/* grouped list: contains first section, list section, and date + picker buttons section */}
        {/* each section is a GroupedList item with automatic border radius and separators */}
        <GroupedList borderRadius={24}>
          {/* first section: task icon, title, and description */}
          {/* pressable wrapper for darken highlight animation and auto-expand modal */}
          <Pressable
            onPressIn={handleFirstSectionPressIn}
            onPressOut={handleFirstSectionPressOut}
            onPress={snapToTop}
            style={styles.firstSectionWrapper}
          >
            <Animated.View style={{ opacity: firstSectionOpacity }}>
              <FirstSection 
                task={task} 
                taskColor={task?.color || taskColor}
              />
            </Animated.View>
          </Pressable>

          {/* list section: displays task's associated list name and icon */}
          {/* pressable wrapper for darken highlight animation and auto-expand modal */}
          <Pressable
            onPressIn={handleListSectionPressIn}
            onPressOut={handleListSectionPressOut}
            onPress={snapToTop}
            style={styles.listSection}
          >
            <Animated.View style={{ opacity: listSectionOpacity }}>
              <ListSection 
                listId={task?.listId || null}
                listName={undefined} // TODO: fetch list name from listId
                listIcon={undefined} // TODO: fetch list icon from listId
              />
            </Animated.View>
          </Pressable>

          {/* date + form picker button section: combined into one GroupedList item */}
          <View style={styles.datePickerSection}>
            {/* date section: displays task due date with dynamic messaging */}
            {/* pressable wrapper for darken highlight animation and opening date picker */}
            <Pressable
              onPressIn={handleDateSectionPressIn}
              onPressOut={handleDateSectionPressOut}
              onPress={handleDateSectionPress}
              style={styles.dateSection}
            >
              <Animated.View style={{ opacity: dateSectionOpacity }}>
                <DateSection dueDate={formValues.dueDate || null} />
              </Animated.View>
            </Pressable>

            {/* form picker button section */}
            <View style={styles.pickerButtonsSection}>
              <PickerButtonsSection
                values={{
                  icon: task?.icon,
                  color: task?.color || taskColor,
                  dueDate: formValues.dueDate || undefined,
                  time: formValues.time,
                  duration: formValues.duration,
                  alerts: formValues.alerts,
                }}
                iconButtonHighlightOpacity={new Animated.Value(0)}
                dateButtonHighlightOpacity={new Animated.Value(0)}
                timeButtonHighlightOpacity={new Animated.Value(0)}
                alertsButtonHighlightOpacity={new Animated.Value(0)}
                onShowIconColorPicker={() => {}} // icon picker not used in task view
                onShowDatePicker={handleShowDatePicker}
                onShowTimeDurationPicker={handleShowTimeDurationPicker}
                onShowAlertsPicker={handleShowAlertsPicker}
                onButtonPress={snapToTop} // snap modal to top when any picker button is pressed
              />
            </View>
          </View>
        </GroupedList>
      </View>

      {/* date picker modal */}
      <DatePickerModal
        visible={isDatePickerVisible}
        selectedDate={formValues.dueDate || new Date().toISOString()}
        onClose={handleDatePickerClose}
        onSelectDate={handleDateSelect}
        title="Date"
        taskCategoryColor={task?.color || taskColor}
      />

      {/* time/duration picker modal */}
      <TimeDurationModal
        visible={isTimeDurationPickerVisible}
        selectedTime={formValues.time}
        selectedDuration={formValues.duration}
        onClose={handleTimeDurationPickerClose}
        onSelectTime={handleTimeSelect}
        onSelectDuration={handleDurationSelect}
        taskCategoryColor={task?.color || taskColor}
      />

      {/* alerts picker modal */}
      <AlertModal
        visible={isAlertsPickerVisible}
        selectedAlerts={formValues.alerts}
        onClose={handleAlertsPickerClose}
        onApplyAlerts={handleAlertsApply}
        taskCategoryColor={task?.color || taskColor}
      />
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
  
  // first section wrapper - provides padding for first section
  // GroupedList handles border radius and separators automatically
  firstSectionWrapper: {
    padding: 16, // padding inside the first section item
  },
  
  // list section - displays task's associated list
  // GroupedList handles border radius and separators automatically
  listSection: {
    padding: 16, // padding inside the list section item
  },
  
  // date + picker button section container
  // combines date section and picker buttons into one GroupedList item
  datePickerSection: {
    padding: 16, // padding inside the combined section item
  },
  
  // date section - displays task due date
  // padding for spacing within the combined section
  dateSection: {
    paddingBottom: 16, // padding below date section (spacing before picker buttons)
  },
  
  // form picker button section
  // negative margins counteract parent container padding to extend to edges
  pickerButtonsSection: {
    marginHorizontal: -16, // negative margin to counteract datePickerSection padding (16px)
    paddingTop: 0, // no top padding (spacing handled by dateSection paddingBottom)
  },
  
});

export default TaskViewModal;

