/**
 * TaskCreationContent Component
 * 
 * The content and logic for the task creation modal.
 * Contains the form UI and all picker modals.
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
  ScrollView,                // scrollable container for long content
  Keyboard,                  // keyboard api for dismissing keyboard
  TouchableWithoutFeedback,  // dismiss keyboard when tapping outside inputs
  useWindowDimensions,       // window size so save button overlay can be positioned relative to window
  TouchableOpacity,          // for checkbox (matches TimelineCheckbox)
  Animated as RNAnimated,    // for checkbox fill/scale animation (matches TimelineCheckbox)
  Platform,                  // gate glass view to iOS
} from 'react-native';
import * as Haptics from 'expo-haptics';

// REACT NATIVE SAFE AREA CONTEXT IMPORT
// useSafeAreaInsets: hook that provides safe area insets for the device
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// REANIMATED: animate save button bottom so it slides with keyboard instead of jumping
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

// LAYOUT COMPONENTS IMPORTS
// useKeyboardHeight: hook to track keyboard height so create button can lock above keyboard
import { useKeyboardHeight } from '@/components/layout/ScreenLayout';

// UI COMPONENTS IMPORTS
// button components for the form
// import directly from button files to avoid require cycle with Button barrel
import { MainCloseButton } from '@/components/ui/Button/CloseButton';
import { SaveButton } from '@/components/ui/Button/SaveButton';

// FEATURE COMPONENTS IMPORTS
// task creation sub-components and modals
import { DatePickerModal } from '@/components/features/calendar';
import { IconColorModal, TimeDurationModal, AlertModal } from './modals';
import { PickerButtonsSection, DescriptionSection } from './sections';

// SUBTASKS IMPORTS
// SubtaskList: component that renders the list of subtasks with create button
import { SubtaskList, type Subtask } from '@/components/features/subtasks';

// CONSTANTS IMPORTS
// design system constants for styling
import { getTextStyle } from '@/constants/Typography';
import { TaskCategoryColors } from '@/constants/ColorPalette';

// CUSTOM HOOKS IMPORTS
// hooks for accessing design system and theme
import { useColorPalette, useThemeColors } from '@/hooks/useColorPalette';

// PICKER DISPLAY UTILITIES
// getDatePickerDisplay: formats date for display (Today, Tomorrow, Thu 5 Feb 2026, etc.)
import { getDatePickerDisplay, getTimeDurationPickerDisplay, getAlertsPickerDisplay } from '@/components/ui/Button';

// TYPES IMPORTS
// typescript types for type safety
import type { TaskFormValues } from '@/components/forms/TaskForm/TaskValidation';
import type { TaskColor } from '@/types';

// GLASS VIEW IMPORT
// native iOS liquid glass for bottom section (save button strip)
import GlassView from 'expo-glass-effect/build/GlassView';

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
  /** Used to coordinate backdrop visibility between FullScreenModal and DraggableModal */
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
  
  /** Array of subtasks for the task */
  subtasks: Subtask[];
  
  /** Callback when a subtask is toggled (complete/incomplete) */
  onSubtaskToggle: (subtaskId: string) => void;
  
  /** Callback when a subtask is deleted */
  onSubtaskDelete: (subtaskId: string) => void;
  
  /** Callback when a subtask title changes */
  onSubtaskTitleChange: (subtaskId: string, newTitle: string) => void;
  
  /** Callback when editing a subtask is finished */
  onSubtaskFinishEditing: (subtaskId: string) => void;
  
  /** Callback when create subtask button is pressed */
  onCreateSubtask: () => void;

  /** When set, the subtask with this id should focus its input (e.g. after Add subtask); clear via onClearPendingFocus */
  pendingFocusSubtaskId?: string | null;
  /** Callback when the pending-focus subtask has focused its input (used to clear pendingFocusSubtaskId) */
  onClearPendingFocus?: () => void;

  /** Optional background color for the subtask list (passed to GroupedList item wrappers) */
  subtaskListBackgroundColor?: string;

  /** Optional border radius for the subtask list (defaults to 24) */
  subtaskListBorderRadius?: number;

  /** Optional border width for the subtask list item wrappers */
  subtaskListBorderWidth?: number;

  /** Optional border color for the subtask list item wrappers */
  subtaskListBorderColor?: string;

  /**
   * When true (default), render close and save buttons inside the content (for in-screen modal).
   * When false, omit them so the parent (e.g. Stack screen) can provide header close/save.
   */
  embedHeaderButtons?: boolean;

  /**
   * When false, omit the close button so the parent can render it at window level (e.g. top-left of screen).
   * Only applies when embedHeaderButtons is true. Default true.
   */
  renderCloseButton?: boolean;

  /**
   * Extra bottom inset when keyboard is hidden (e.g. form sheet doesn't fill window; add ~80 so save button stays visible).
   */
  saveButtonBottomInsetWhenKeyboardHidden?: number;

}


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
  subtasks,
  onSubtaskToggle,
  onSubtaskDelete,
  onSubtaskTitleChange,
  onSubtaskFinishEditing,
  onCreateSubtask,
  subtaskListBackgroundColor,
  subtaskListBorderRadius,
  subtaskListBorderWidth,
  subtaskListBorderColor,
  embedHeaderButtons = true,
  renderCloseButton = true,
  saveButtonBottomInsetWhenKeyboardHidden,
}) => {
  // CONSOLE DEBUGGING - removed for cleaner logs
  
  // HOOKS
  const colors = useColorPalette();
  const themeColors = useThemeColors();
  const insets = useSafeAreaInsets();
  // bottom section (save button strip) uses glass on iOS; solid background elsewhere
  const glassAvailable = Platform.OS === 'ios';
  
  // window size: used for save button overlay so button is positioned relative to window bottom
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  // track keyboard height so save button can sit above keyboard
  const keyboardHeight = useKeyboardHeight();
  
  // FORM STATE
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [titleCheckboxChecked, setTitleCheckboxChecked] = useState(false);
  
  // title checkbox animation (matches TimelineCheckbox: 18x18 circle, fill + scale)
  const titleCheckboxFill = useRef(new RNAnimated.Value(0)).current;
  const titleCheckboxScale = useRef(new RNAnimated.Value(1)).current;
  useEffect(() => {
    RNAnimated.timing(titleCheckboxFill, {
      toValue: titleCheckboxChecked ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [titleCheckboxChecked, titleCheckboxFill]);
  
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
  // used to coordinate backdrop visibility between FullScreenModal and DraggableModal
  // this prevents double backdrop layers and janky animations
  const isAnyPickerVisible = isDatePickerVisible || isColorPickerVisible || 
    isTimeDurationPickerVisible || isAlertsPickerVisible;
  
  // notify parent when picker visibility changes
  // allows parent to coordinate backdrop visibility when form pickers are open
  useEffect(() => {
    onPickerVisibilityChange?.(isAnyPickerVisible);
  }, [isAnyPickerVisible, onPickerVisibilityChange]);
  
  // REF FOR TITLE TEXTINPUT
  // used to focus the input and open keyboard after closing form picker modals
  const titleInputRef = useRef<TextInput>(null);

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

  // DATE PICKER HANDLERS
  const handleShowDatePicker = () => {
    Keyboard.dismiss(); // close keyboard when opening date picker
    closeAllModalsExcept('date');
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
    Keyboard.dismiss();
    onClose();
  };
  
  // top section: elevated background, contains title + description
  const taskColorKey: TaskColor = (values.color as TaskColor) || 'blue';

  // save button bottom offset relative to window: above keyboard when open, else from window bottom with optional inset
  const saveButtonBottom = keyboardHeight > 0
    ? keyboardHeight + 72
    : insets.bottom + (saveButtonBottomInsetWhenKeyboardHidden ?? 0);

  // reanimated: shared value for bottom so we can animate when keyboard opens/closes (slide instead of jump)
  const animatedBottom = useSharedValue(saveButtonBottom);
  useEffect(() => {
    animatedBottom.value = withTiming(saveButtonBottom, {
      duration: 250,
      easing: Easing.out(Easing.cubic),
    });
  }, [saveButtonBottom, animatedBottom]);
  // position bar at bottom; SaveButton handles its own spring show/hide via visible prop
  const animatedSaveButtonBarStyle = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    left: 0,
    right: 0,
    bottom: animatedBottom.value,
  }));

  const mainContent = (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={{ flex: 1 }}>
        {/* top section: elevated background with title only - fixed at top, not scrollable */}
        <View
          style={{
            backgroundColor: themeColors.background.elevated(),
            paddingTop: embedHeaderButtons ? insets.top + 32 : 24,
            paddingBottom: 20,
            paddingHorizontal: 0,
          }}
        >
          {embedHeaderButtons && renderCloseButton && (
            <MainCloseButton onPress={handleClose} color={values.color || 'blue'} />
          )}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 20 }}>
            <View style={{ flex: 1, minWidth: 0, paddingHorizontal: 0 }}>
              <TextInput
                ref={titleInputRef}
                value={values.title || ''}
                onChangeText={(t) => onChange('title', t)}
                onBlur={() => onBlur('title')}
                placeholder="e.g., Answering emails"
                placeholderTextColor={themeColors.text.tertiary()}
                selectionColor={themeColors.text.primary()}
                style={{
                  ...getTextStyle('heading-2'),
                  color: themeColors.text.primary(),
                  paddingBottom: 12,
                  paddingHorizontal: 0,
                }}
                autoFocus={true}
                returnKeyType="next"
              />
              <View style={{ height: 1, backgroundColor: themeColors.text.tertiary() }} />
              <View style={{ height: 12 }} />
            </View>
            <View style={{ paddingLeft: 12, flexShrink: 0, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  RNAnimated.sequence([
                    RNAnimated.timing(titleCheckboxScale, { toValue: 0.85, duration: 100, useNativeDriver: true }),
                    RNAnimated.timing(titleCheckboxScale, { toValue: 1, duration: 100, useNativeDriver: true }),
                  ]).start();
                  setTitleCheckboxChecked((prev) => !prev);
                }}
                activeOpacity={1}
                style={{ alignItems: 'center', justifyContent: 'center' }}
              >
                <RNAnimated.View style={{ transform: [{ scale: titleCheckboxScale }] }}>
                  <RNAnimated.View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 12,
                      borderWidth: 1.5,
                      borderColor: titleCheckboxFill.interpolate({
                        inputRange: [0, 1],
                        outputRange: [themeColors.text.tertiary(), themeColors.text.primary()],
                      }),
                      backgroundColor: titleCheckboxFill.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['transparent', themeColors.text.primary()],
                      }),
                    }}
                  />
                </RNAnimated.View>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* scrollable area: grouped list + description (scroll indicator visible); flexGrow: 1 so content fills to bottom when short */}
        <ScrollView
          style={{ flex: 1, minHeight: 0 }}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 160 }}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View style={{ paddingTop: 0, paddingBottom: 8 }}>
            <PickerButtonsSection
              onShowDatePicker={handleShowDatePicker}
              onShowTimeDurationPicker={handleShowTimeDurationPicker}
              onShowAlertsPicker={handleShowAlertsPicker}
              dateValue={getDatePickerDisplay(values.dueDate, colors, themeColors).text}
              dateSecondaryValue={getDatePickerDisplay(values.dueDate, colors, themeColors).secondaryText}
              timeDurationValue={getTimeDurationPickerDisplay(values.time, values.duration, themeColors).text}
              timeDurationSecondaryValue={getTimeDurationPickerDisplay(values.time, values.duration, themeColors).secondaryText}
              alertsValue={getAlertsPickerDisplay(values.alerts?.length ?? 0, themeColors).text}
            />
          </View>

          <View style={{ paddingTop: 0, paddingBottom: 0 }}>
            {/* tertiary border above description, inset 20pt horizontally */}
            <View
              style={{
                height: 1,
                backgroundColor: themeColors.background.tertiary(),
                marginHorizontal: 20,
                marginBottom: 0,
              }}
            />
            <DescriptionSection
              description={values.description || ''}
              onDescriptionChange={(description) => {
                onChange('description', description);
              }}
              isEditing={true}
              taskColor={taskColorKey}
            />
          </View>

          {createError && (
            <View style={{
              marginHorizontal: 20,
              marginTop: 16,
              marginBottom: 24,
              padding: 12,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: colors.getSemanticColor('error', 500),
            }}>
              <Text style={{
                ...getTextStyle('body-small'),
                color: colors.getSemanticColor('error', 500),
              }}>
                {createError}
              </Text>
            </View>
          )}
        </ScrollView>

        {/* bottom section: save button strip; glass on iOS (regular), transparent elsewhere */}
        {embedHeaderButtons && (() => {
          const bottomStripStyle = {
            position: 'absolute' as const,
            left: 0,
            right: 0,
            bottom: 0,
            width: windowWidth,
            height: 100,
          };
          const bottomStripContent = (
            <Animated.View pointerEvents="box-none" style={animatedSaveButtonBarStyle}>
              <View
                style={{
                  alignSelf: 'flex-end',
                  flexDirection: 'row' as const,
                  alignItems: 'center',
                  paddingHorizontal: 20,
                }}
              >
                <SaveButton
                  onPress={onCreate}
                  isLoading={isCreating}
                  taskCategoryColor={(values.color as TaskColor) || 'blue'}
                  text="Create"
                  loadingText="Creating..."
                  size={28}
                  iconSize={28}
                  visible={isCreateButtonActive}
                />
              </View>
            </Animated.View>
          );
          return glassAvailable ? (
            <GlassView
              pointerEvents="box-none"
              style={[bottomStripStyle, { backgroundColor: 'transparent' }]}
              glassEffectStyle="regular"
              tintColor={themeColors.background.primarySecondaryBlend() as any}
            >
              {bottomStripContent}
            </GlassView>
          ) : (
            <View pointerEvents="box-none" style={bottomStripStyle}>
              {bottomStripContent}
            </View>
          );
        })()}
        </View>
      </TouchableWithoutFeedback>
  );

  return (
    <>
      {mainContent}

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

