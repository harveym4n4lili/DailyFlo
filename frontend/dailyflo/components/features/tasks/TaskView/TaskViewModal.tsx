/**
 * TaskViewModal
 * 
 * Draggable modal for viewing task details.
 * Uses WrappedDraggableModal for slide animation (Modal wrapper).
 * Currently blank with only a close button on the left.
 */

// REACT IMPORTS
// react: core react library for building components
import React, { useState, useRef, useEffect, useRef as useReactRef } from 'react';

// REACT NATIVE IMPORTS
import { View, Text, StyleSheet, Animated, Pressable, Keyboard, TouchableOpacity, LayoutAnimation, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// enable layout animations on android for smooth expand/collapse animations
// this ensures android can use layout animations like ios does
if (UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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

// SUBTASKS IMPORTS
// SubtaskList: component that renders the list of subtasks with create button
import { SubtaskList } from '@/components/features/subtasks';

// UI COMPONENTS IMPORTS
// SaveButton: button component for saving changes
import { SaveButton } from '@/components/ui/Button';

// UI COMPONENTS IMPORTS
// GroupedList: flexible iOS-style grouped list component
import { GroupedList, GroupedListButton } from '@/components/ui/List/GroupedList';

// FEATURE COMPONENTS IMPORTS
// modals for date, time/duration, and alerts pickers
import { DatePickerModal } from '@/components/features/calendar';
import { TimeDurationModal, AlertModal } from '../TaskCreation/modals';

// CUSTOM HOOKS IMPORTS
// hooks for accessing design system and theme
import { useThemeColors } from '@/hooks/useColorPalette';
// useTypography: hook for accessing typography system
import { useTypography } from '@/hooks/useTypography';
// useGroupAnimations: hook for group collapse/expand animations (reused from ListCard)
import { useGroupAnimations } from '@/hooks/useGroupAnimations';

// TYPES IMPORTS
// typescript types for type safety
import type { TaskColor, Task, UpdateTaskInput, Subtask as TaskSubtask, TaskReminder } from '@/types';
import { FontWeight } from '@/constants/Typography';

// STORE IMPORTS
// redux store hooks and actions for state management
import { useAppDispatch } from '@/store';
import { updateTask } from '@/store/slices/tasks/tasksSlice';
import { useTasks } from '@/store/hooks';

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
  // get typography system for consistent text styling
  const typography = useTypography();
  
  // REDUX
  // dispatch: function to send actions to the Redux store
  const dispatch = useAppDispatch();
  // get tasks state including isUpdating and updateError
  const { isUpdating, updateError } = useTasks();
  
  // create dynamic styles using theme colors and typography
  const styles = React.useMemo(() => createStyles(themeColors, typography), [themeColors, typography]);

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

  // initial form values - store original values to detect changes
  const [initialFormValues, setInitialFormValues] = useState({
    dueDate: task?.dueDate || undefined,
    time: task?.time || undefined,
    duration: task?.duration || undefined,
    alerts: [] as string[],
  });

  // initial subtasks - store original subtasks to detect changes
  // convert from Task.Subtask[] format (with sortOrder) to local Subtask format
  const [initialSubtasks, setInitialSubtasks] = useState<Subtask[]>([]);

  // HELPER FUNCTION: Convert TaskReminder[] to alert IDs
  // TaskReminder has scheduledTime, we need to match it to alert IDs based on time offset
  const convertRemindersToAlerts = (reminders: TaskReminder[]): string[] => {
    if (!reminders || reminders.length === 0) return [];
    
    // alert option mappings - matches AlertModal ALERT_OPTIONS
    const alertOptionMap: Record<string, number> = {
      'start': 0,
      'end': -1,
      '15-min': 15,
    };
    
    // get task's base time (dueDate + time)
    const baseDate = task?.dueDate ? new Date(task.dueDate) : new Date();
    if (task?.time) {
      const [hours, minutes] = task.time.split(':').map(Number);
      baseDate.setHours(hours, minutes, 0, 0);
    }
    
    // match each reminder to an alert ID based on time offset
    return reminders
      .filter(reminder => reminder.isEnabled) // only include enabled reminders
      .map(reminder => {
        const reminderTime = new Date(reminder.scheduledTime);
        const timeDiffMinutes = Math.round((reminderTime.getTime() - baseDate.getTime()) / (1000 * 60));
        
        // find matching alert ID based on time difference
        // check for end of task (time diff equals duration)
        if (task?.duration) {
          const endTimeDiff = task.duration;
          if (Math.abs(timeDiffMinutes - endTimeDiff) < 1) {
            return 'end';
          }
        }
        
        // check for start (0 minutes difference)
        if (Math.abs(timeDiffMinutes) < 1) {
          return 'start';
        }
        
        // check for 15 minutes before
        if (Math.abs(timeDiffMinutes + 15) < 1) {
          return '15-min';
        }
        
        return null; // no match found
      })
      .filter((alertId): alertId is string => alertId !== null);
  };

  // update form values when task prop changes
  // this ensures the form reflects the latest task data
  React.useEffect(() => {
    if (task) {
      // convert TaskReminder[] to alert IDs for form state
      const alertIds = convertRemindersToAlerts(task.metadata?.reminders || []);
      
      const newValues = {
        dueDate: task.dueDate || undefined,
        time: task.time || undefined,
        duration: task.duration || undefined,
        alerts: alertIds, // convert from TaskReminder[] to alert IDs
      };
      setFormValues(newValues);
      setInitialFormValues(newValues);
      
      // convert task subtasks from Task.Subtask[] format to local Subtask format
      // Task.Subtask has sortOrder, local Subtask doesn't (we'll add it back when saving)
      const taskSubtasks: Subtask[] = (task.metadata?.subtasks || []).map((st, index) => ({
        id: st.id,
        title: st.title,
        isCompleted: st.isCompleted,
        isEditing: false,
      }));
      setSubtasks(taskSubtasks);
      setInitialSubtasks(taskSubtasks);
    }
  }, [task]);

  // PICKER MODAL VISIBILITY STATE
  // track visibility of all form picker modals
  // only one modal should be open at a time for better UX
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [isTimeDurationPickerVisible, setIsTimeDurationPickerVisible] = useState(false);
  const [isAlertsPickerVisible, setIsAlertsPickerVisible] = useState(false);
  
  // SUBTASKS STATE
  // manage list of subtasks - each subtask has id, title, and completion status
  interface Subtask {
    id: string;
    title: string;
    isCompleted: boolean;
    isEditing?: boolean; // track if subtask is being edited
  }
  
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);

  // CHANGE DETECTION
  // check if form has any changes from initial values
  // compares current form values with initial values to detect unsaved changes
  // must be defined after subtasks state is declared
  const hasChanges = React.useMemo(() => {
    // safely check alerts arrays (handle undefined/null cases)
    const currentAlerts = formValues.alerts || [];
    const initialAlerts = initialFormValues.alerts || [];
    
    // safely check subtasks arrays (handle undefined/null cases)
    const currentSubtasks = subtasks || [];
    const initialSubtasksArray = initialSubtasks || [];
    
    // compare subtasks by checking if they're different
    const subtasksChanged = JSON.stringify(currentSubtasks.map(s => ({ id: s.id, title: s.title, isCompleted: s.isCompleted }))) !== 
                           JSON.stringify(initialSubtasksArray.map(s => ({ id: s.id, title: s.title, isCompleted: s.isCompleted })));
    
    return (
      formValues.dueDate !== initialFormValues.dueDate ||
      formValues.time !== initialFormValues.time ||
      formValues.duration !== initialFormValues.duration ||
      JSON.stringify(currentAlerts) !== JSON.stringify(initialAlerts) ||
      subtasksChanged
    );
  }, [formValues, initialFormValues, subtasks, initialSubtasks]);
  
  // SUBTASKS ANIMATION
  // use group animations hook (reused from ListCard) for consistent animation behavior
  const {
    toggleGroupCollapse,
    getAnimatedValuesForGroup,
    isGroupCollapsed,
  } = useGroupAnimations();
  
  // subtasks group title - using a constant group name for the subtasks section
  const SUBTASKS_GROUP_TITLE = 'Subtasks';
  
  // check if subtasks section is collapsed
  const isSubtasksExpanded = !isGroupCollapsed(SUBTASKS_GROUP_TITLE);
  
  // get animated values for subtasks group
  const subtasksAnimatedValues = getAnimatedValuesForGroup(SUBTASKS_GROUP_TITLE);
  
  // calculate arrow rotation interpolation - matches ListCard pattern
  const arrowRotationInterpolation = subtasksAnimatedValues.rotateValue.interpolate({
    inputRange: [0, 1], // input range: 0 = collapsed (right pointing), 1 = expanded (down pointing)
    outputRange: ['90deg', '0deg'], // output range: rotate from 90 degrees (right) to 0 degrees (down)
  });

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

  // SUBTASKS HANDLERS
  // handle subtasks header press - toggle expanded state and snap modal to top
  const handleSubtasksHeaderPress = () => {
    // snap modal to top (fully expanded) when subtasks header is tapped
    snapToTop();
    // toggle group collapse using reusable hook (matches ListCard animation pattern)
    // this handles both state management and animations (arrow rotation + layout animation)
    toggleGroupCollapse(SUBTASKS_GROUP_TITLE);
  };

  // calculate subtasks count
  const subtasksCount = subtasks.length;
  const displayCount = subtasksCount; // show actual count of subtasks

  // handle create subtask button press
  // adds a new subtask above the create button (in second-to-last position)
  const handleCreateSubtask = () => {
    // generate unique ID for new subtask
    const newSubtaskId = `subtask-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // create new subtask with default title and editing mode enabled
    const newSubtask: Subtask = {
      id: newSubtaskId,
      title: '', // empty title to start
      isCompleted: false,
      isEditing: true, // start in edit mode
    };
    
    // add new subtask to the list (will appear above create button)
    setSubtasks(prev => [...prev, newSubtask]);
    
    // snap modal to top when creating subtask
    snapToTop();
  };
  
  // handle subtask title change
  const handleSubtaskTitleChange = (subtaskId: string, newTitle: string) => {
    setSubtasks(prev =>
      prev.map(subtask =>
        subtask.id === subtaskId
          ? { ...subtask, title: newTitle }
          : subtask
      )
    );
  };
  
  // handle finish editing subtask
  const handleSubtaskFinishEditing = (subtaskId: string) => {
    setSubtasks(prev =>
      prev.map(subtask =>
        subtask.id === subtaskId
          ? { ...subtask, isEditing: false }
          : subtask
      )
    );
  };
  
  // handle subtask toggle (complete/incomplete)
  const handleSubtaskToggle = (subtaskId: string) => {
    setSubtasks(prev =>
      prev.map(subtask =>
        subtask.id === subtaskId
          ? { ...subtask, isCompleted: !subtask.isCompleted }
          : subtask
      )
    );
  };
  
  // handle subtask delete
  const handleSubtaskDelete = (subtaskId: string) => {
    setSubtasks(prev => prev.filter(subtask => subtask.id !== subtaskId));
  };

  // HELPER FUNCTION: Convert alert IDs to TaskReminder format
  // alert IDs are strings like 'start', 'end', '15-min'
  // TaskReminder requires id, type, scheduledTime, and isEnabled
  const convertAlertsToReminders = (alertIds: string[]): TaskReminder[] => {
    // alert option mappings - matches AlertModal ALERT_OPTIONS
    const alertOptionMap: Record<string, { value: number; label: string }> = {
      'start': { value: 0, label: 'Start of task' },
      'end': { value: -1, label: 'End of task' },
      '15-min': { value: 15, label: '15 minutes before' },
    };
    
    // calculate scheduled time based on task's dueDate and time
    const baseDate = formValues.dueDate ? new Date(formValues.dueDate) : new Date();
    
    // if task has a time, set the hours and minutes
    if (formValues.time) {
      const [hours, minutes] = formValues.time.split(':').map(Number);
      baseDate.setHours(hours, minutes, 0, 0);
    }
    
    // convert each alert ID to a TaskReminder
    return alertIds.map((alertId) => {
      const option = alertOptionMap[alertId];
      if (!option) return null; // skip invalid alert IDs
      
      // calculate scheduled time based on alert value
      // value: 0 = start, -1 = end, positive = minutes before
      const scheduledTime = new Date(baseDate);
      if (option.value === -1) {
        // end of task: add duration if available
        const durationMinutes = formValues.duration || 0;
        scheduledTime.setMinutes(scheduledTime.getMinutes() + durationMinutes);
      } else if (option.value > 0) {
        // minutes before: subtract from base time
        scheduledTime.setMinutes(scheduledTime.getMinutes() - option.value);
      }
      // value === 0 means start time, which is already set in baseDate
      
      return {
        id: alertId, // use alert ID as reminder ID
        type: 'due_date' as const, // all alerts are based on due date
        scheduledTime: scheduledTime,
        isEnabled: true, // alerts are enabled by default
      };
    }).filter((reminder): reminder is TaskReminder => reminder !== null);
  };

  // SAVE HANDLER
  // handle saving changes to the task
  // this function saves the current form values but does not close the modal
  const handleSave = async () => {
    if (!task?.id) return; // can't save without task ID
    
    // convert local Subtask format to Task.Subtask format (with sortOrder)
    // sortOrder is the index in the array
    const taskSubtasks: TaskSubtask[] = subtasks.map((st, index) => ({
      id: st.id,
      title: st.title,
      isCompleted: st.isCompleted,
      sortOrder: index,
    }));
    
    // convert alert IDs to TaskReminder format
    const reminders: TaskReminder[] = convertAlertsToReminders(formValues.alerts || []);
    
    // prepare update data in UpdateTaskInput format
    const updates: UpdateTaskInput = {
      id: task.id,
      dueDate: formValues.dueDate || null, // convert undefined to null for API
      time: formValues.time,
      duration: formValues.duration,
      // include subtasks and reminders in metadata
      metadata: {
        subtasks: taskSubtasks,
        reminders: reminders, // save converted reminders
        // preserve existing metadata fields
        notes: task.metadata?.notes,
        tags: task.metadata?.tags || [],
      },
    };
    
    try {
      // dispatch updateTask action to Redux store
      // this will trigger the async thunk that updates the task
      const result = await dispatch(updateTask({ id: task.id, updates }));
      
      // if update was successful, update initial values to clear change detection
      if (updateTask.fulfilled.match(result)) {
        setInitialFormValues({
          dueDate: formValues.dueDate,
          time: formValues.time,
          duration: formValues.duration,
          alerts: formValues.alerts,
        });
        setInitialSubtasks([...subtasks]); // create a copy of current subtasks
      }
    } catch (error) {
      // error is handled by Redux state (updateError)
      console.error('Failed to update task:', error);
    }
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
      <View style={{ position: 'relative' }}>
        <ModalHeader
          showCloseButton={true}
          closeButtonPosition="left"
          showDragIndicator={true}
          onClose={onClose}
          showBorder={false}
          useMainCloseButton={true}
          taskCategoryColor={task?.color || taskColor}
        />
        
        {/* save button - appears on the right when changes are detected */}
        {/* positioned absolutely to align with header buttons */}
        {hasChanges && (
          <View
            style={{
              position: 'absolute',
              right: 16, // match header padding
              top: 16, // match header button top spacing (iOS 15+)
              zIndex: 10, // ensure it's above header content
            }}
          >
            <SaveButton
              onPress={handleSave}
              disabled={false}
              isLoading={isUpdating}
              taskCategoryColor={task?.color || taskColor}
              text="Save"
              loadingText="Saving..."
            />
          </View>
        )}
      </View>

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

        {/* subtasks section: header and create button below the grouped list */}
        <View style={styles.subtasksSection}>
          {/* subtasks header: toggle button for expanding/collapsing */}
          {/* matches GroupHeader styling and animation pattern */}
          <TouchableOpacity
            style={styles.subtasksHeader}
            onPress={handleSubtasksHeaderPress}
            activeOpacity={0.7}
          >
            {/* subtasks label and count - using same typography as GroupHeader */}
            <View style={styles.subtasksHeaderTextContainer}>
              <Text style={styles.subtasksHeaderText}>Subtasks</Text>
              {/* show count only when there are subtasks (count > 0 after subtracting 1) */}
              {displayCount > 0 && (
                <Text style={styles.subtasksHeaderCount}>({displayCount})</Text>
              )}
            </View>
            
            {/* dropdown arrow icon with smooth rotation animation - positioned on the right */}
            {/* matches GroupHeader arrow animation pattern */}
            <Animated.View
              style={[
                styles.animatedArrowContainer,
                {
                  transform: [{ rotate: arrowRotationInterpolation }], // apply rotation animation transform
                },
              ]}
            >
              <Ionicons
                name="chevron-down" // always use chevron-down icon since we handle rotation with animation
                size={16}
                color={themeColors.text.tertiary()}
              />
            </Animated.View>
          </TouchableOpacity>

          {/* subtask items - shown when subtasks section is expanded */}
          {/* subtasks list with create button always at the bottom */}
          {isSubtasksExpanded && (
            <SubtaskList
              subtasks={subtasks}
              onToggle={handleSubtaskToggle}
              onDelete={handleSubtaskDelete}
              onTitleChange={handleSubtaskTitleChange}
              onFinishEditing={handleSubtaskFinishEditing}
              onCreateSubtask={handleCreateSubtask}
            />
          )}
        </View>
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
// note: styles that need theme colors and typography are created inside the component using useMemo
const createStyles = (
  themeColors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useTypography>
) =>
  StyleSheet.create({
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
    
    // subtasks section container - wraps header and create button
    subtasksSection: {
      marginTop: 8, // space above the subtasks section (separates from grouped list)
    },
    
    // subtasks header - toggle button for expanding/collapsing
    // matches GroupHeader styling pattern
    subtasksHeader: {
      flexDirection: 'row', // horizontal layout
      alignItems: 'center', // center align
      justifyContent: 'space-between', // space between label and arrow
      paddingHorizontal: 4, // slight padding for alignment (matches GroupHeader)
      paddingVertical: 8, // vertical padding for better touch target (matches GroupHeader)
      marginBottom: 12, // space below header before create button (when expanded)
    },
    
    // subtasks header text container - holds label and count
    // matches GroupHeader text container pattern
    subtasksHeaderTextContainer: {
      flexDirection: 'row', // horizontal layout for label and count
      alignItems: 'center', // center align vertically
      gap: 4, // small gap between label and count
    },
    
    // subtasks header text styling
    // using typography system for consistent text styling - matches GroupHeader
    subtasksHeaderText: {
      // use the heading-4 text style from typography system (16px, bold, satoshi font)
      // this matches the typography used in GroupHeader for group titles
      ...typography.getTextStyle('heading-4'),
      // use theme-aware primary text color from color system
      color: themeColors.text.primary(),
    },
    
    // subtasks header count styling
    // matches GroupHeader count styling pattern
    subtasksHeaderCount: {
      // use the heading-4 text style from typography system (16px, bold, satoshi font)
      // this matches the typography used in GroupHeader for group counts
      ...typography.getTextStyle('heading-4'),
      // use theme-aware primary text color from color system
      color: themeColors.text.primary(),
    },
    
    // animated arrow container for smooth rotation animations
    // matches GroupHeader arrow container styling
    animatedArrowContainer: {
      marginLeft: 8, // space between label and arrow (matches GroupHeader)
      justifyContent: 'center', // center the arrow icon
      alignItems: 'center', // center the arrow icon
    },
    // margin is handled by GroupedList spacing
  });

export default TaskViewModal;

