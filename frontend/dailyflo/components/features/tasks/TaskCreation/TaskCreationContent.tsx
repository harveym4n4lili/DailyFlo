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
  Pressable,                 // pressable component for interactive elements
  ScrollView,                // scrollable container for long content
  Animated,                  // animated api for button highlight animations
  Alert,                     // alert dialog for confirmation prompts
  Keyboard,                  // keyboard api for dismissing keyboard
  TouchableWithoutFeedback,  // dismiss keyboard when tapping outside inputs
  useWindowDimensions,       // hook to get screen dimensions for scroll calculations
  Platform,                  // platform detection for iOS version checking
} from 'react-native';

// REACT NATIVE SAFE AREA CONTEXT IMPORT
// useSafeAreaInsets: hook that provides safe area insets for the device
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// EXPO VECTOR ICONS IMPORT
// ionicons: provides icons for the UI
import { Ionicons } from '@expo/vector-icons';

// EXPO GLASS EFFECT IMPORTS
// GlassView: native iOS UIVisualEffectView liquid glass surface for the whole form
// isGlassEffectAPIAvailable: runtime check so we only use liquid glass when supported
import GlassView from 'expo-glass-effect/build/GlassView';
import { isGlassEffectAPIAvailable } from 'expo-glass-effect';

// LAYOUT COMPONENTS IMPORTS
// KeyboardAnchoredContainer: invisible container that positions content above keyboard when open
// useKeyboardHeight: hook to track keyboard height for scroll calculations
import { KeyboardAnchoredContainer, useKeyboardHeight } from '@/components/layout/ScreenLayout';

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

  /** Optional background color for the subtask list (passed to GroupedList item wrappers) */
  subtaskListBackgroundColor?: string;

  /** Optional border radius for the subtask list (defaults to 24) */
  subtaskListBorderRadius?: number;

  /** Optional border width for the subtask list item wrappers */
  subtaskListBorderWidth?: number;

  /** Optional border color for the subtask list item wrappers */
  subtaskListBorderColor?: string;
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
}) => {
  // CONSOLE DEBUGGING - removed for cleaner logs
  
  // HOOKS
  const colors = useColorPalette();
  const themeColors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  
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
  // track keyboard height for scroll calculations using composable hook
  const keyboardHeight = useKeyboardHeight();
  // determine if scrolling should be enabled (only when picker buttons would be covered)
  const [isScrollingEnabled, setIsScrollingEnabled] = useState(false);
  
  // REF FOR PICKER BUTTONS SECTION
  // used to measure position for scroll locking
  const pickerButtonsSectionRef = useRef<View>(null);
  
  // CALCULATE SCROLL ENABLED STATE
  // enable scrolling when picker buttons section would be covered (no bottom section; save button is top-right)
  useEffect(() => {
    if (pickerButtonsSectionHeight > 0) {
      const visibleArea = screenHeight - keyboardHeight;
      const pickerButtonsBottom = pickerButtonsSectionY + pickerButtonsSectionHeight;
      const shouldEnableScrolling = pickerButtonsBottom > visibleArea;
      setIsScrollingEnabled(shouldEnableScrolling);
    }
  }, [pickerButtonsSectionY, pickerButtonsSectionHeight, keyboardHeight, screenHeight]);
  
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
  
  // REF FOR MAIN SCROLLVIEW
  // used to auto-scroll when description input expands to keep typing position visible
  const mainScrollViewRef = useRef<ScrollView>(null);
  
  // REF FOR DESCRIPTION SECTION WRAPPER
  // used to measure position for auto-scrolling
  const descriptionSectionRef = useRef<View>(null);

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
  
  // check if liquid glass API is available at runtime (prevents crashes on unsupported iOS versions)
  // when available, we wrap the entire task creation content in a GlassView so the modal
  // itself becomes a liquid glass surface
  const glassAvailable = Platform.OS === 'ios' && isGlassEffectAPIAvailable();

  // mainContent holds the core layout for the task creation form
  // later we conditionally wrap this in a GlassView when liquid glass is available
  const mainContent = (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={{ flex: 1 }}>
          {/* cancel button - absolutely positioned at top left */}
          {/* iOS 15+ (newer): circular close icon button with tertiary background */}
          {/* iOS < 15 (older): text button with task category color background */}
        <MainCloseButton
          onPress={handleClose}
          color={values.color || 'blue'}
        />

        {/* main scrollable content wrapper */}
        {/* flex: 1 allows ScrollView to take available space above keyboard-anchored bottom section */}
        {/* contentContainerStyle without flexGrow allows content to expand naturally */}
        <ScrollView 
        ref={mainScrollViewRef}
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
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
            placeholderTextColor={themeColors.text.tertiary()} // matches description placeholder color
            // use primary text color for selection instead of task category color
            selectionColor={themeColors.text.primary()}
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
            description={values.description || ''}
            onDescriptionChange={(description) => {
              onChange('description', description);
              // onContentSizeChange will handle auto-scrolling when content expands
            }}
            onFocus={() => setIsDescriptionFocused(true)}
            onBlur={() => setIsDescriptionFocused(false)}
            isEditing={true}
            taskColor={(values.color as TaskColor) || 'blue'}
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

        {/* error message - shown when task creation fails */}
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

        {/* keyboard-anchored save button at bottom-right of modal */}
        {/* when keyboard is hidden, it sits at the bottom-right; when keyboard opens, it stays above the keyboard */}
        <KeyboardAnchoredContainer
          offset={16}
          style={{ backgroundColor: 'transparent' }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'flex-end',
              alignItems: 'center',
              paddingHorizontal: 16,
            }}
          >
            <SaveButton
              onPress={onCreate}
              disabled={!isCreateButtonActive}
              isLoading={isCreating}
              taskCategoryColor={(values.color as TaskColor) || 'blue'}
              text="Create"
              loadingText="Creating..."
              size={34}
            />
          </View>
        </KeyboardAnchoredContainer>
        </View>
      </TouchableWithoutFeedback>
  );

  return (
    <>
      {/* when liquid glass is available on iOS, render the entire form content inside GlassView */}
      {/* this makes the task creation modal itself a glass surface while keeping interactions intact */}
      {glassAvailable ? (
        <GlassView
          style={{
            flex: 1,
            // match modal rounding so the glass follows the sheet shape
            borderRadius: 0,
            backgroundColor: 'transparent',
          }}
          glassEffectStyle="regular"
          // allow taps and gestures to pass through to the inner content
          isInteractive
          // use a subtle background tint from the theme to drive the glass color
          tintColor={themeColors.background.primarySecondaryBlend() as any}
        >
          {mainContent}
        </GlassView>
      ) : (
        mainContent
      )}

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

