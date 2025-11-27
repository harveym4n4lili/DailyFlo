/**
 * TaskCreationContent Component
 * 
 * The content and logic for the task creation modal.
 * Contains the KeyboardModal, form UI, and all picker modals.
 * Separated from TaskCreationModal for better organization.
 */

// REACT IMPORTS
// react: core react library for building components
import React, { useState, useMemo, useEffect, useRef } from 'react';

// REACT NATIVE IMPORTS
// these are the building blocks from react native that we use to create the content
import {
  View,                      // basic container component
  Text,                      // text component for displaying text
  TextInput,                 // text input component for task title
  Pressable,                 // pressable component for interactive elements
  ScrollView,                // scrollable container for long content
  Animated,                  // animated api for button highlight animations
  Alert,                     // alert dialog for confirmation prompts
  Keyboard,                  // keyboard api for dismissing keyboard
} from 'react-native';

// REACT NATIVE SAFE AREA CONTEXT IMPORT
// useSafeAreaInsets: hook that provides safe area insets for the device
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// EXPO VECTOR ICONS IMPORT
// ionicons: provides icons for the UI
import { Ionicons } from '@expo/vector-icons';

// LAYOUT COMPONENTS IMPORTS
// (removed KeyboardModal and ModalBackdrop - now handled at TaskCreationModal level)

// UI COMPONENTS IMPORTS
// button components for the form (no longer needed here, moved to PickerButtonsSection)

// FEATURE COMPONENTS IMPORTS
// task creation sub-components and modals
import { DatePickerModal } from '@/components/features/calendar';
import { IconColorModal, TimeDurationModal, AlertModal } from './modals';
import { PickerButtonsSection, DescriptionSection, SubtaskSection } from './sections';

// CONSTANTS IMPORTS
// design system constants for styling
import { getTextStyle } from '@/constants/Typography';
import { TaskCategoryColors } from '@/constants/ColorPalette';

// CUSTOM HOOKS IMPORTS
// hooks for accessing design system and theme
import { useColorPalette, useThemeColors } from '@/hooks/useColorPalette';

// TYPES IMPORTS
// typescript types for type safety
import type { TaskFormValues } from '@/components/forms/TaskForm/TaskValidation';
import type { TaskColor } from '@/types';

/**
 * Props for TaskCreationContent component
 */
export interface TaskCreationContentProps {
  /** Whether the content is visible */
  visible: boolean;
  
  /** Form values */
  values: Partial<TaskFormValues>;
  
  /** Form change handler */
  onChange: <K extends keyof TaskFormValues>(key: K, v: TaskFormValues[K]) => void;
  
  /** Callback when modal should close */
  onClose: () => void;
  
  /** Whether form has unsaved changes */
  hasChanges: boolean;
  
  /** Callback to notify parent when any picker modal visibility changes */
  /** Used to coordinate backdrop visibility between KeyboardModal and DraggableModal */
  onPickerVisibilityChange?: (isAnyPickerVisible: boolean) => void;
  
  /** Callback when create button is pressed */
  /** This function handles validating the form and creating the task */
  onCreate: () => void;
  
  /** Whether a task is currently being created (loading state) */
  /** Used to disable the create button and show loading indicator */
  isCreating?: boolean;
  
  /** Error message if task creation failed */
  /** Can be displayed to the user */
  createError?: string | null;
}

// CONSTANTS
// padding for the bottom action section (with create button)
const BOTTOM_SECTION_PADDING_VERTICAL = 12;

/**
 * TaskCreationContent Component
 * 
 * Contains all the UI and logic for task creation modal content.
 */
export const TaskCreationContent: React.FC<TaskCreationContentProps> = ({
  visible,
  values,
  onChange,
  onClose,
  hasChanges,
  onPickerVisibilityChange,
  onCreate,
  isCreating = false,
  createError,
}) => {
  // CONSOLE DEBUGGING - removed for cleaner logs
  
  // HOOKS
  const colors = useColorPalette();
  const themeColors = useThemeColors();
  const insets = useSafeAreaInsets();
  
  // FORM STATE
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  
  // CHECK IF CREATE BUTTON SHOULD BE ACTIVE
  // button is active when required fields are filled (title is required)
  // trim() removes whitespace to check if title actually has content
  const isCreateButtonActive = useMemo(() => {
    return !!(values.title && values.title.trim().length > 0);
  }, [values.title]);
  
  // PICKER MODAL VISIBILITY STATE
  // track visibility of all form picker modals to coordinate backdrop systems
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [isColorPickerVisible, setIsColorPickerVisible] = useState(false);
  const [isTimeDurationPickerVisible, setIsTimeDurationPickerVisible] = useState(false);
  const [isAlertsPickerVisible, setIsAlertsPickerVisible] = useState(false);
  
  // check if any picker modal is currently visible
  // used to hide KeyboardModal backdrop when form picker modals are open
  // this prevents double backdrop layers and janky animations
  const isAnyPickerVisible = isDatePickerVisible || isColorPickerVisible || 
    isTimeDurationPickerVisible || isAlertsPickerVisible;
  
  // notify parent when picker visibility changes
  // allows KeyboardModal to hide its backdrop when form pickers are open
  useEffect(() => {
    onPickerVisibilityChange?.(isAnyPickerVisible);
  }, [isAnyPickerVisible, onPickerVisibilityChange]);
  
  // REF FOR TITLE TEXTINPUT
  // used to focus the input and open keyboard after closing form picker modals
  const titleInputRef = useRef<TextInput>(null);

  // ANIMATION STATE
  const iconButtonHighlightOpacity = useRef(new Animated.Value(0)).current;
  const dateButtonHighlightOpacity = useRef(new Animated.Value(0)).current;
  const timeButtonHighlightOpacity = useRef(new Animated.Value(0)).current;
  const alertsButtonHighlightOpacity = useRef(new Animated.Value(0)).current;
  const [previousDueDate, setPreviousDueDate] = useState(values.dueDate);

  // ANIMATION EFFECT
  useEffect(() => {
    if (previousDueDate !== values.dueDate && previousDueDate !== undefined) {
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
    setPreviousDueDate(values.dueDate);
  }, [values.dueDate, previousDueDate, dateButtonHighlightOpacity]);

  // MODAL VISIBILITY DEBUGGING - removed for cleaner logs

  // NOTIFY PARENT WHEN FORM PICKER MODALS CHANGE
  // this allows the parent to hide its backdrop when form picker modals are open
  // FORM HANDLERS
  const onBlur = (key: keyof TaskFormValues) => {
    setTouched((prev) => ({ ...prev, [key]: true }));
  };

  // HELPER FUNCTION: Close all modals except the one being opened
  // this ensures seamless transitions by preventing multiple modals from being open
  const closeAllModalsExcept = (modalToKeep: string) => {
    if (modalToKeep !== 'date') setIsDatePickerVisible(false);
    if (modalToKeep !== 'color') setIsColorPickerVisible(false);
    if (modalToKeep !== 'time') setIsTimeDurationPickerVisible(false);
    if (modalToKeep !== 'alerts') setIsAlertsPickerVisible(false);
  };

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
  const handleShowDatePicker = () => {
    Keyboard.dismiss(); // close keyboard when opening date picker
    closeAllModalsExcept('date');
    triggerButtonHighlight(dateButtonHighlightOpacity);
    setIsDatePickerVisible(true);
  };
  
  const handleDateSelect = (date: string) => {
    // console.log('Date selected:', date);
    onChange('dueDate', date);
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
  const handleShowColorPicker = () => {
    Keyboard.dismiss(); // close keyboard when opening color picker
    closeAllModalsExcept('color');
    triggerButtonHighlight(iconButtonHighlightOpacity);
    setIsColorPickerVisible(true);
  };
  
  const handleColorSelect = (color: TaskColor) => {
    // console.log('Color selected:', color);
    onChange('color', color);
  };
  
  const handleColorPickerClose = () => {
    setIsColorPickerVisible(false);
    // focus title input to open keyboard immediately after closing color picker
    titleInputRef.current?.focus();
  };

  // ICON SELECTION HANDLER
  const handleIconSelect = (icon: string) => {
    // console.log('Icon selected:', icon);
    onChange('icon', icon);
  };

  // TIME/DURATION PICKER HANDLERS
  const handleShowTimeDurationPicker = () => {
    Keyboard.dismiss(); // close keyboard when opening time/duration picker
    closeAllModalsExcept('time');
    triggerButtonHighlight(timeButtonHighlightOpacity);
    setIsTimeDurationPickerVisible(true);
  };
  
  const handleTimeSelect = (time: string | undefined) => {
    // console.log('Time selected:', time);
    onChange('time', time);
  };
  
  const handleDurationSelect = (duration: number | undefined) => {
    // console.log('Duration selected:', duration);
    onChange('duration', duration);
  };
  
  const handleTimeDurationPickerClose = () => {
    setIsTimeDurationPickerVisible(false);
    // focus title input to open keyboard immediately after closing time/duration picker
    titleInputRef.current?.focus();
  };

  // ALERTS PICKER HANDLERS
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
    // console.log('Alerts applied:', alertIds);
    onChange('alerts', alertIds);
  };

  // CLOSE HANDLER WITH CHANGE DETECTION
  const handleClose = () => {
    // discard message commented out - directly close modal
    // if (hasChanges) {
    //   Alert.alert(
    //     'Discard Changes?',
    //     'You have unsaved changes. Are you sure you want to discard them?',
    //     [
    //       {
    //         text: 'Continue Editing',
    //         style: 'cancel',
    //         onPress: () => {
    //           console.log('User chose to continue editing');
    //         },
    //       },
    //       {
    //         text: 'Discard',
    //         style: 'destructive',
    //         onPress: () => {
    //           console.log('User chose to discard changes');
    //           Keyboard.dismiss();
    //           onClose();
    //         },
    //       },
    //     ],
    //     { cancelable: true }
    //   );
    // } else {
      // console.log('Closing modal');
      Keyboard.dismiss();
      onClose();
    // }
  };


  return (
    <>
      {/* cancel button - absolutely positioned at top left */}
      {/* top position accounts for safe area inset */}
      {/* background uses task category color */}
      <Pressable
        onPress={handleClose}
        style={{
          position: 'absolute',
          top: 20 + insets.top, // add safe area top inset
          left: 16,
          zIndex: 10,
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 20,
          backgroundColor: values.color 
            ? TaskCategoryColors[values.color][500]
            : TaskCategoryColors.blue[500],
        }}
      >
        <Text style={{
          ...getTextStyle('button-secondary'),
          // use white text for contrast on colored backgrounds
          color: '#FFFFFF',
        }}>
          Cancel
        </Text>
      </Pressable>
      
      {/* main scrollable content wrapper */}
      <ScrollView 
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        contentContainerStyle={{ paddingBottom: 0, flexGrow: 1 }}
        nestedScrollEnabled={true}
      >
        {/* header with icon display and title input */}
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
            value={values.title || ''}
            onChangeText={(t) => onChange('title', t)}
            onBlur={() => onBlur('title')}
            placeholder="e.g., Answering emails"
            placeholderTextColor={themeColors.background.lightOverlay()}
            selectionColor={values.color 
              ? TaskCategoryColors[values.color][500]
              : TaskCategoryColors.blue[500]}
            style={{
              ...getTextStyle('heading-2'),
              color: themeColors.text.primary(),
              paddingVertical: 0,
              paddingHorizontal: 0,
            }}
            autoFocus={true}
            returnKeyType="next"
          />
        </View>

        {/* Task Description Section */}
        <View style={{ 
          paddingTop: 8,
          // allow this section to expand beyond container constraints
          flexShrink: 0,
          flexGrow: 1,
        }}>
          <DescriptionSection
            description={values.description || ''}
            onDescriptionChange={(description) => onChange('description', description)}
            isEditing={true}
            taskColor={(values.color as TaskColor) || 'blue'}
          />
        </View>

        {/* Subtask Section */}
        <View>
          <SubtaskSection
            onAddSubtask={() => {
              // console.log('Add subtask clicked - placeholder functionality');
            }}
          />
        </View>

        {/* Picker Buttons Section */}
        {/* moved below subtask section for better user flow */}
        {/* contains color, date, time, and alerts picker buttons */}
        <View style={{ paddingTop: 16, paddingBottom: 8 }}>
          <PickerButtonsSection
            values={values}
            iconButtonHighlightOpacity={iconButtonHighlightOpacity}
            dateButtonHighlightOpacity={dateButtonHighlightOpacity}
            timeButtonHighlightOpacity={timeButtonHighlightOpacity}
            alertsButtonHighlightOpacity={alertsButtonHighlightOpacity}
            onShowIconColorPicker={handleShowColorPicker}
            onShowDatePicker={handleShowDatePicker}
            onShowTimeDurationPicker={handleShowTimeDurationPicker}
            onShowAlertsPicker={handleShowAlertsPicker}
          />
        </View>

      
      </ScrollView>
      {/* Create Button Section */}
      {/* bottom action section with top border for visual separation */}
      {/* border color matches the picker button selected state border */}
      {/* contains the circular create button anchored to the right */}
      <View style={{
          borderTopWidth: 1,
          borderTopColor: themeColors.border.primary(),
          paddingVertical: BOTTOM_SECTION_PADDING_VERTICAL,
          paddingHorizontal: 16,
          flexDirection: 'row',
          justifyContent: 'flex-end',
          alignItems: 'center',
          backgroundColor: themeColors.background.elevated(),
      }}>
        {/* Circular create button anchored to the right */}
        {/* background uses task category color */}
        {/* disabled when isCreating is true OR when required fields are not filled */}
        {/* inactive state shows lower opacity when title is empty */}
        {/* when pressed, uses inactive state styling (0.4 opacity) with no animations */}
        <Pressable
          onPress={onCreate}
          disabled={isCreating || !isCreateButtonActive}
          style={({ pressed }) => ({
            width: 42,
            height: 42,
            borderRadius: 28,
            backgroundColor: values.color 
              ? TaskCategoryColors[values.color][500]
              : TaskCategoryColors.blue[500],
            justifyContent: 'center',
            alignItems: 'center',
            // when pressed: use inactive state opacity (0.4), no animations
            // inactive state: 0.4 opacity, loading state: 0.6 opacity, active state: 1.0 opacity
            opacity: pressed ? 0.4 : (!isCreateButtonActive ? 0.4 : isCreating ? 0.6 : 1),
          })}
        >
          <Ionicons
            name={isCreating ? "hourglass-outline" : "arrow-up"}
            size={20}
            // use white icon for contrast on colored backgrounds
            color="#FFFFFF"
          />
        </Pressable>
        
        {/* Error message display */}
        {/* shows error if task creation failed */}
        {createError && (
          <View style={{
            position: 'absolute',
            bottom: -30,
            left: 16,
            right: 16,
            padding: 8,
            backgroundColor: themeColors.background.elevated(),
            borderRadius: 8,
            borderWidth: 1,
            // use semantic error color from color palette
            borderColor: colors.getSemanticColor('error', 500),
          }}>
            <Text style={{
              ...getTextStyle('body-small'),
              // use semantic error color from color palette
              color: colors.getSemanticColor('error', 500),
            }}>
              {createError}
            </Text>
          </View>
        )}
      </View>
      
      
      {/* date picker modal */}
      <DatePickerModal
        visible={isDatePickerVisible}
        selectedDate={values.dueDate || new Date().toISOString()}
        onClose={handleDatePickerClose}
        onSelectDate={handleDateSelect}
        title="Date"
        taskCategoryColor={(values.color as TaskColor) || 'blue'}
      />
      
      {/* color and icon picker modal */}
      <IconColorModal
        visible={isColorPickerVisible}
        selectedColor={(values.color as TaskColor) || 'blue'}
        selectedIcon={values.icon}
        onClose={handleColorPickerClose}
        onSelectColor={handleColorSelect}
        onSelectIcon={handleIconSelect}
        taskCategoryColor={(values.color as TaskColor) || 'blue'}
      />
      
      {/* time/duration picker modal */}
      <TimeDurationModal
        visible={isTimeDurationPickerVisible}
        selectedTime={values.time}
        selectedDuration={values.duration}
        onClose={handleTimeDurationPickerClose}
        onSelectTime={handleTimeSelect}
        onSelectDuration={handleDurationSelect}
        taskCategoryColor={(values.color as TaskColor) || 'blue'}
      />
      
      {/* alerts picker modal */}
      <AlertModal
        visible={isAlertsPickerVisible}
        selectedAlerts={values.alerts || []}
        onClose={handleAlertsPickerClose}
        onApplyAlerts={handleAlertsApply}
        taskCategoryColor={(values.color as TaskColor) || 'blue'}
      />
    </>
  );
};

export default TaskCreationContent;

