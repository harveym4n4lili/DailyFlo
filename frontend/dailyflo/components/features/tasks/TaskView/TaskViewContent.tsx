/**
 * TaskViewContent Component
 * 
 * The content and logic for the task view modal.
 * Displays task details and information.
 * Structure matches TaskCreationContent exactly, excluding SubtaskSection.
 */

// REACT IMPORTS
// react: core react library for building components
import React, { useState, useRef, useEffect, useMemo } from 'react';

// REACT NATIVE IMPORTS
// these are the building blocks from react native that we use to create the content
import {
  View,                      // basic container component
  Text,                      // text component for displaying text
  Pressable,                 // pressable component for interactive elements
  TextInput,                 // text input component for task title
  ScrollView,                // scrollable container for long content
  Animated,                  // animated api for button highlight animations
  Keyboard,                  // keyboard api for dismissing keyboard
  useWindowDimensions,       // hook to get screen dimensions for scroll calculations
  Platform,                  // platform detection for iOS version checking
} from 'react-native';

// REACT NATIVE SAFE AREA CONTEXT IMPORT
// useSafeAreaInsets: hook that provides safe area insets for the device
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// EXPO VECTOR ICONS IMPORT
// ionicons: provides icons for the UI
import { Ionicons } from '@expo/vector-icons';

// LAYOUT COMPONENTS IMPORTS
// useKeyboardHeight: hook to track keyboard height for scroll calculations
import { useKeyboardHeight } from '@/components/layout/ScreenLayout';

// FEATURE COMPONENTS IMPORTS
// DescriptionSection: reusable description input component from task creation
// PickerButtonsSection: form picker buttons section from task view sections
import { DescriptionSection } from '../TaskCreation/sections';
import { PickerButtonsSection } from './sections/PickerButtonsSection';
// task creation modals for picking color, date, time, and alerts
import { DatePickerModal } from '@/components/features/calendar';
import { IconColorModal, TimeDurationModal, AlertModal } from '../TaskCreation/modals';

// CONSTANTS IMPORTS
// design system constants for styling
import { getTextStyle } from '@/constants/Typography';
import { TaskCategoryColors } from '@/constants/ColorPalette';

// CUSTOM HOOKS IMPORTS
// hooks for accessing design system and theme
import { useThemeColors } from '@/hooks/useColorPalette';

// TYPES IMPORTS
// typescript types for type safety
import type { TaskColor, Task } from '@/types';

// STORE IMPORTS
// redux store hooks and actions for state management
import { useAppDispatch } from '@/store';
import { updateTask } from '@/store/slices/tasks/tasksSlice';


/**
 * Props for TaskViewContent component
 */
export interface TaskViewContentProps {
  /** Callback when modal should close */
  onClose: () => void;
  
  /** Task color for styling */
  taskColor: TaskColor;
  
  /** Task data (optional, if provided will be used for initial values) */
  task?: Task;
}

/**
 * TaskViewContent Component
 * 
 * Contains all the UI and logic for task view modal content.
 * Structure matches TaskCreationContent exactly, excluding SubtaskSection.
 */
export const TaskViewContent: React.FC<TaskViewContentProps> = ({
  onClose,
  taskColor,
  task,
}) => {
  // HOOKS
  const themeColors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  // track keyboard height for scroll calculations using composable hook
  const keyboardHeight = useKeyboardHeight();

  // IOS VERSION DETECTION
  // get iOS version number for conditional styling
  // iOS 15+ introduced the glass UI design with updated header styling
  // returns the major version number (e.g., 14, 15, 16, 17)
  const getIOSVersion = (): number => {
    if (Platform.OS !== 'ios') return 0;
    const version = Platform.Version as string;
    // Platform.Version can be a string like "15.0" or number like 15
    // parse it to get the major version number
    const majorVersion = typeof version === 'string' 
      ? parseInt(version.split('.')[0], 10) 
      : Math.floor(version as number);
    return majorVersion;
  };
  
  // check if running on iOS 15+ (newer glass UI design)
  const isNewerIOS = getIOSVersion() >= 15;
  
  // determine button text/icon color based on task category color
  // always use task category color, including white case
  const getButtonTextColor = () => {
    return TaskCategoryColors[formColor][500]; // task category color
  };
  
  // REDUX
  // dispatch function to send actions to the Redux store
  const dispatch = useAppDispatch();

  // LOCAL STATE
  // track title and description values for editing
  // initialize with task data if available
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  
  // FORM STATE FOR PICKER VALUES
  // track form values that can be changed via picker modals
  // initialize with task data if available
  const [formColor, setFormColor] = useState<TaskColor>(task?.color || taskColor);
  const [formIcon, setFormIcon] = useState<string | undefined>(task?.icon);
  const [formDueDate, setFormDueDate] = useState<string | undefined>(task?.dueDate ?? undefined);
  const [formTime, setFormTime] = useState<string | undefined>(task?.time);
  const [formDuration, setFormDuration] = useState<number | undefined>(task?.duration);
  const [formAlerts, setFormAlerts] = useState<string[]>([]); // TODO: convert from TaskReminder[] when implemented
  
  // PICKER MODAL VISIBILITY STATE
  // track visibility of all form picker modals
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [isColorPickerVisible, setIsColorPickerVisible] = useState(false);
  const [isTimeDurationPickerVisible, setIsTimeDurationPickerVisible] = useState(false);
  const [isAlertsPickerVisible, setIsAlertsPickerVisible] = useState(false);

  // STATE FOR AUTO-SCROLL
  // track description section position and height for auto-scrolling
  const [descriptionSectionY, setDescriptionSectionY] = useState(0);
  const [descriptionSectionHeight, setDescriptionSectionHeight] = useState(0);
  // track if description is being actively edited (for auto-scroll)
  const [isDescriptionFocused, setIsDescriptionFocused] = useState(false);

  // STATE FOR SCROLL LOCKING
  // track picker buttons section position to determine when scrolling should be enabled
  const [pickerButtonsSectionY, setPickerButtonsSectionY] = useState(0);
  const [pickerButtonsSectionHeight, setPickerButtonsSectionHeight] = useState(0);
  // determine if scrolling should be enabled (only when picker buttons would be covered)
  const [isScrollingEnabled, setIsScrollingEnabled] = useState(false);

  // REF FOR PICKER BUTTONS SECTION
  // used to measure position for scroll locking
  const pickerButtonsSectionRef = useRef<View>(null);

  // CALCULATE SCROLL ENABLED STATE
  // enable scrolling only when picker buttons section would be covered by bottom section
  useEffect(() => {
    if (pickerButtonsSectionHeight > 0) {
      // calculate visible area: screen height minus keyboard
      // for task view, we don't have a bottom section like create button, so just account for keyboard
      const visibleArea = screenHeight - keyboardHeight;
      
      // check if picker buttons section extends below visible area
      // if it does, enable scrolling
      const pickerButtonsBottom = pickerButtonsSectionY + pickerButtonsSectionHeight;
      const shouldEnableScrolling = pickerButtonsBottom > visibleArea;
      
      setIsScrollingEnabled(shouldEnableScrolling);
    }
  }, [pickerButtonsSectionY, pickerButtonsSectionHeight, keyboardHeight, screenHeight]);

  // ANIMATION VALUES FOR PICKER BUTTONS
  // animated values for button highlight effects (same as TaskCreation)
  const iconButtonHighlightOpacity = useRef(new Animated.Value(0)).current;
  const dateButtonHighlightOpacity = useRef(new Animated.Value(0)).current;
  const timeButtonHighlightOpacity = useRef(new Animated.Value(0)).current;
  const alertsButtonHighlightOpacity = useRef(new Animated.Value(0)).current;
  const [previousDueDate, setPreviousDueDate] = useState(formDueDate);

  // ANIMATION EFFECT FOR DATE BUTTON
  // highlight date button when date changes
  useEffect(() => {
    if (previousDueDate !== formDueDate && previousDueDate !== undefined) {
      Animated.sequence([
        Animated.timing(dateButtonHighlightOpacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(dateButtonHighlightOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
    setPreviousDueDate(formDueDate);
  }, [formDueDate, previousDueDate, dateButtonHighlightOpacity]);

  // REFS
  // ref for title input to manage focus
  const titleInputRef = useRef<TextInput>(null);
  // ref for main scrollview (matches TaskCreation structure)
  const mainScrollViewRef = useRef<ScrollView>(null);
  // ref for description section wrapper (used to measure position for auto-scrolling)
  const descriptionSectionRef = useRef<View>(null);

  // FORM VALUES FOR PICKER BUTTONS
  // construct values object for PickerButtonsSection (same structure as TaskCreation)
  // uses current form state values
  const formValues = {
    title,
    description,
    color: formColor,
    icon: formIcon,
    dueDate: formDueDate,
    time: formTime,
    duration: formDuration,
    alerts: formAlerts,
  };
  
  // UPDATE FORM STATE WHEN TASK PROP CHANGES
  // when a different task is opened, update all form values to match
  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setFormColor(task.color || taskColor);
      setFormIcon(task.icon);
      setFormDueDate(task.dueDate ?? undefined);
      setFormTime(task.time);
      setFormDuration(task.duration);
      // TODO: convert TaskReminder[] to string[] when alerts are implemented
      setFormAlerts([]);
    }
  }, [task?.id, taskColor]); // update when task ID or taskColor changes


  // HANDLE CLOSE
  // function to handle closing the modal
  const handleClose = () => {
    Keyboard.dismiss();
    onClose();
  };

  // HANDLE TITLE CHANGE
  // update title state when user types
  const handleTitleChange = (text: string) => {
    setTitle(text);
  };

  // HANDLE DESCRIPTION CHANGE
  // update description state when user types
  const handleDescriptionChange = (text: string) => {
    setDescription(text);
  };

  // CHECK IF FORM HAS CHANGES
  // compare current form values with original task values to detect changes
  // used to show/hide the update button in top right
  const hasChanges = useMemo(() => {
    if (!task) return false;
    return (
      title.trim() !== (task.title || '') ||
      description.trim() !== (task.description || '') ||
      formColor !== (task.color || taskColor) ||
      formIcon !== task.icon ||
      formDueDate !== (task.dueDate ?? undefined) ||
      formTime !== task.time ||
      formDuration !== task.duration ||
      (formAlerts.length > 0) // TODO: compare with actual task alerts when implemented
    );
  }, [title, description, formColor, formIcon, formDueDate, formTime, formDuration, formAlerts, task, taskColor]);

  // HELPER FUNCTION: Update task in Redux store
  // dispatches updateTask action with current form values
  // called when update button is pressed
  const handleUpdateTask = () => {
    if (task?.id) {
      // dispatch updateTask action with task id and all updated values
      // updateTask is an async thunk that updates the task in the Redux store
      // it takes { id, updates: UpdateTaskInput } where updates contains all changed fields
      dispatch(updateTask({
        id: task.id,
        updates: {
          id: task.id,
          title: title.trim() || undefined, // only include if not empty
          description: description.trim() || undefined, // only include if not empty
          color: formColor,
          icon: formIcon,
          dueDate: formDueDate ?? null, // convert undefined to null for API
          time: formTime,
          duration: formDuration,
          // TODO: convert formAlerts (string[]) to TaskReminder[] format when alerts are implemented
          // metadata: { reminders: ... } 
        }
      }));
      // close modal after updating
      Keyboard.dismiss();
      onClose();
    }
  };

  // HELPER FUNCTION: Close all modals except the one being opened
  // this ensures seamless transitions by preventing multiple modals from being open
  const closeAllModalsExcept = (modalToKeep: string) => {
    if (modalToKeep !== 'date') setIsDatePickerVisible(false);
    if (modalToKeep !== 'color') setIsColorPickerVisible(false);
    if (modalToKeep !== 'time') setIsTimeDurationPickerVisible(false);
    if (modalToKeep !== 'alerts') setIsAlertsPickerVisible(false);
  };

  // HELPER FUNCTION: Trigger button highlight animation
  // provides visual feedback when picker button is pressed
  const triggerButtonHighlight = (animatedValue: Animated.Value) => {
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // DATE PICKER HANDLERS
  // open date picker modal and save selected date
  const handleShowDatePicker = () => {
    Keyboard.dismiss(); // close keyboard when opening date picker
    closeAllModalsExcept('date');
    triggerButtonHighlight(dateButtonHighlightOpacity);
    setIsDatePickerVisible(true);
  };
  
  const handleDateSelect = (date: string) => {
    // save selected date to form state
    setFormDueDate(date);
    // when date is selected via quick option, modal closes automatically
    // focus title input to open keyboard immediately after selection
    titleInputRef.current?.focus();
  };
  
  const handleDatePickerClose = () => {
    setIsDatePickerVisible(false);
    // focus title input to open keyboard immediately after closing date picker
    titleInputRef.current?.focus();
  };

  // COLOR PICKER HANDLERS
  // open color/icon picker modal and save selected color and icon
  const handleShowIconColorPicker = () => {
    Keyboard.dismiss(); // close keyboard when opening color picker
    closeAllModalsExcept('color');
    triggerButtonHighlight(iconButtonHighlightOpacity);
    setIsColorPickerVisible(true);
  };
  
  const handleColorSelect = (color: TaskColor) => {
    // save selected color to form state
    setFormColor(color);
  };
  
  const handleIconSelect = (icon: string) => {
    // save selected icon to form state
    setFormIcon(icon);
  };
  
  const handleColorPickerClose = () => {
    setIsColorPickerVisible(false);
    // focus title input to open keyboard immediately after closing color picker
    titleInputRef.current?.focus();
  };

  // TIME/DURATION PICKER HANDLERS
  // open time/duration picker modal and save selected time and duration
  const handleShowTimeDurationPicker = () => {
    Keyboard.dismiss(); // close keyboard when opening time/duration picker
    closeAllModalsExcept('time');
    triggerButtonHighlight(timeButtonHighlightOpacity);
    setIsTimeDurationPickerVisible(true);
  };
  
  const handleTimeSelect = (time: string | undefined) => {
    // save selected time to form state
    setFormTime(time);
  };
  
  const handleDurationSelect = (duration: number | undefined) => {
    // save selected duration to form state
    setFormDuration(duration);
  };
  
  const handleTimeDurationPickerClose = () => {
    setIsTimeDurationPickerVisible(false);
    // focus title input to open keyboard immediately after closing time/duration picker
    titleInputRef.current?.focus();
  };

  // ALERTS PICKER HANDLERS
  // open alerts picker modal and save selected alerts
  const handleShowAlertsPicker = () => {
    Keyboard.dismiss(); // close keyboard when opening alerts picker
    closeAllModalsExcept('alerts');
    triggerButtonHighlight(alertsButtonHighlightOpacity);
    setIsAlertsPickerVisible(true);
  };
  
  const handleAlertsPickerClose = () => {
    setIsAlertsPickerVisible(false);
    // focus title input to open keyboard immediately after closing alerts picker
    titleInputRef.current?.focus();
  };
  
  const handleAlertsApply = (alertIds: string[]) => {
    // save selected alerts to form state
    setFormAlerts(alertIds);
  };

  return (
    <>
      {/* main content container with flex layout */}
      {/* allows ScrollView to take available space and bottom section to be keyboard-anchored */}
      {/* Pressable wrapper allows tapping background to dismiss keyboard */}
      <Pressable 
        style={{ flex: 1 }}
        onPress={() => Keyboard.dismiss()}
      >
        {/* cancel button - absolutely positioned at top left */}
        {/* iOS 15+ (newer): circular close icon button with tertiary background */}
        {/* iOS < 15 (older): text button with task category color background */}
        {/* top position accounts for safe area inset */}
        <Pressable
          onPress={handleClose}
          style={{
            position: 'absolute',
            left: 16, // 16px from left edge
            zIndex: 10,
            ...(isNewerIOS ? {
              // iOS 15+: equal spacing from top and left (16px each)
              top: 16 + insets.top, // 16px from top edge to match left spacing
              width: 42,
              height: 42,
              borderRadius: 21,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: themeColors.background.tertiary(),
            } : {
              // iOS < 15: current style (text button with colored background)
              top: 20 + insets.top, // add safe area top inset
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor: TaskCategoryColors[formColor][500],
            }),
          }}
        >
          {isNewerIOS ? (
            // iOS 15+ (newer): X close icon button
            <Ionicons
              name="close"
              size={32}
              color={getButtonTextColor()}
            />
          ) : (
            // iOS < 15 (older): text button (current style)
            <Text style={{
              ...getTextStyle('button-secondary'),
              // use white text for contrast on colored backgrounds
              color: '#FFFFFF',
            }}>
              Cancel
            </Text>
          )}
        </Pressable>

        {/* update button - absolutely positioned at top right */}
        {/* iOS 15+ (newer): circular checkmark icon button with tertiary background */}
        {/* iOS < 15 (older): text button with task category color background */}
        {/* only visible when form has changes */}
        {/* top position accounts for safe area inset */}
        {hasChanges && (
          <Pressable
            onPress={handleUpdateTask}
            style={({ pressed }) => ({
              position: 'absolute',
              right: 16, // 16px from right edge
              zIndex: 10,
              ...(isNewerIOS ? {
                // iOS 15+: equal spacing from top and right (16px each)
                top: 16 + insets.top, // 16px from top edge to match right spacing
                width: 42,
                height: 42,
                borderRadius: 21,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: themeColors.background.tertiary(),
                // when pressed: use inactive state opacity (0.4), no animations
                opacity: pressed ? 0.4 : 1,
              } : {
                // iOS < 15: current style (text button with colored background)
                top: 20 + insets.top, // add safe area top inset
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: TaskCategoryColors[formColor][500],
                justifyContent: 'center',
                alignItems: 'center',
                // when pressed: use inactive state opacity (0.4), no animations
                opacity: pressed ? 0.4 : 1,
              }),
            })}
          >
            {isNewerIOS ? (
              // iOS 15+ (newer): paper/document icon button
              <Ionicons
                name="document"
                size={24}
                color={getButtonTextColor()}
              />
            ) : (
              // iOS < 15 (older): text button (current style)
              <Text style={{
                ...getTextStyle('button-secondary'),
                // use white text for contrast on colored backgrounds
                color: '#FFFFFF',
                fontWeight: '900', // done button is bold
              }}>
                Done
              </Text>
            )}
          </Pressable>
        )}
        
        {/* main scrollable content wrapper */}
        {/* flex: 1 allows ScrollView to take available space above keyboard-anchored bottom section */}
        {/* contentContainerStyle without flexGrow allows content to expand naturally */}
        {/* keyboardShouldPersistTaps="handled" allows tapping outside inputs to dismiss keyboard */}
        <ScrollView 
          ref={mainScrollViewRef}
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 0 }}
          nestedScrollEnabled={true}
          // disable scrolling until picker buttons section would be covered
          scrollEnabled={isScrollingEnabled}
          onContentSizeChange={(contentWidth, contentHeight) => {
            // auto-scroll when content expands and description is being edited
            // only if scrolling is enabled (picker buttons would be covered)
            if (isScrollingEnabled && isDescriptionFocused && mainScrollViewRef.current && descriptionSectionHeight > 0) {
              setTimeout(() => {
                if (mainScrollViewRef.current) {
                  // calculate scroll position to keep the bottom of description input visible
                  // account for keyboard height
                  const visibleArea = screenHeight - keyboardHeight;
                  
                  // calculate where the bottom of the description section is
                  const descriptionBottom = descriptionSectionY + descriptionSectionHeight;
                  
                  // calculate how much we need to scroll to keep description visible
                  // add some padding (80px) to keep input comfortably visible above keyboard
                  const scrollPosition = descriptionBottom - visibleArea + 80;
                  
                  // only scroll if description extends below visible area
                  if (scrollPosition > 0) {
                    mainScrollViewRef.current.scrollTo({
                      y: scrollPosition,
                      animated: true,
                    });
                  }
                }
              }, 50); // short delay to ensure layout has updated
            }
          }}
        >
          {/* header with title input */}
          {/* extra top padding to make room for absolutely positioned cancel button */}
          {/* padding accounts for safe area top inset */}
          <View
            style={{
              paddingTop: 80 + insets.top, // extra space for cancel button + safe area
              paddingBottom: 0,
              paddingHorizontal: 20,
            }}
          >
            {/* title input takes full width */}
            <TextInput
              ref={titleInputRef}
              value={title}
              onChangeText={handleTitleChange}
              placeholder="e.g., Answering emails"
              placeholderTextColor={themeColors.background.lightOverlay()}
              selectionColor={TaskCategoryColors[formColor][500]}
              style={{
                ...getTextStyle('heading-2'),
                color: themeColors.text.primary(),
                paddingVertical: 0,
                paddingHorizontal: 0,
              }}
              returnKeyType="next"
            />
          </View>

          {/* Task Description Section */}
          <View 
            ref={descriptionSectionRef}
            onLayout={(event) => {
              // track description section position and height for auto-scrolling
              const { y, height } = event.nativeEvent.layout;
              setDescriptionSectionY(y);
              setDescriptionSectionHeight(height);
            }}
            style={{ 
              paddingTop: 8,
              // allow this section to expand naturally based on content
              // flexShrink: 0 prevents shrinking, no flexGrow to allow natural expansion
              flexShrink: 0,
            }}
          >
            <DescriptionSection
              description={description}
              onDescriptionChange={(description) => {
                handleDescriptionChange(description);
                // onContentSizeChange will handle auto-scrolling when content expands
              }}
              onFocus={() => setIsDescriptionFocused(true)}
              onBlur={() => setIsDescriptionFocused(false)}
              isEditing={true}
              taskColor={formColor}
            />
          </View>

          {/* Picker Buttons Section */}
          {/* contains color, date, time, and alerts picker buttons */}
          <View 
            ref={pickerButtonsSectionRef}
            onLayout={(event) => {
              // track picker buttons section position and height for scroll locking
              const { y, height } = event.nativeEvent.layout;
              setPickerButtonsSectionY(y);
              setPickerButtonsSectionHeight(height);
            }}
            style={{ paddingTop: 16, paddingBottom: 8 }}
          >
            <PickerButtonsSection
              values={formValues}
              iconButtonHighlightOpacity={iconButtonHighlightOpacity}
              dateButtonHighlightOpacity={dateButtonHighlightOpacity}
              timeButtonHighlightOpacity={timeButtonHighlightOpacity}
              alertsButtonHighlightOpacity={alertsButtonHighlightOpacity}
              onShowIconColorPicker={handleShowIconColorPicker}
              onShowDatePicker={handleShowDatePicker}
              onShowTimeDurationPicker={handleShowTimeDurationPicker}
              onShowAlertsPicker={handleShowAlertsPicker}
            />
          </View>
        </ScrollView>
      </Pressable>
      
      {/* date picker modal */}
      <DatePickerModal
        visible={isDatePickerVisible}
        selectedDate={formDueDate || new Date().toISOString()}
        onClose={handleDatePickerClose}
        onSelectDate={handleDateSelect}
        title="Date"
        taskCategoryColor={formColor}
      />
      
      {/* color and icon picker modal */}
      <IconColorModal
        visible={isColorPickerVisible}
        selectedColor={formColor}
        selectedIcon={formIcon}
        onClose={handleColorPickerClose}
        onSelectColor={handleColorSelect}
        onSelectIcon={handleIconSelect}
        taskCategoryColor={formColor}
      />
      
      {/* time/duration picker modal */}
      <TimeDurationModal
        visible={isTimeDurationPickerVisible}
        selectedTime={formTime}
        selectedDuration={formDuration}
        onClose={handleTimeDurationPickerClose}
        onSelectTime={handleTimeSelect}
        onSelectDuration={handleDurationSelect}
        taskCategoryColor={formColor}
      />
      
      {/* alerts picker modal */}
      <AlertModal
        visible={isAlertsPickerVisible}
        selectedAlerts={formAlerts}
        onClose={handleAlertsPickerClose}
        onApplyAlerts={handleAlertsApply}
        taskCategoryColor={formColor}
      />
    </>
  );
};

export default TaskViewContent;
