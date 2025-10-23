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
  TextInput,                 // text input component for task title
  Pressable,                 // pressable component for interactive elements
  ScrollView,                // scrollable container for long content
  Animated,                  // animated api for animations
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
// button components for the form
import { 
  FormPickerButton, 
  getDatePickerDisplay, 
  getTimeDurationPickerDisplay,
  getAlertsPickerDisplay,
  getIconPickerDisplay,
} from '@/components/ui/Button';

// FEATURE COMPONENTS IMPORTS
// task creation sub-components and modals
import { DatePickerModal } from '@/components/features/calendar';
import { TaskIconColorModal } from './TaskIconColorModal';
import { TaskTimeDurationModal } from './TaskTimeDurationModal';
import { TaskAlertModal } from './TaskAlertModal';
import { TaskDescription } from './TaskDescription';
import { SubtaskSection } from './SubtaskSection';

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
  
  /** Callback to notify parent when form picker modals open/close */
  onFormPickerModalChange?: (isAnyPickerOpen: boolean) => void;
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
  onFormPickerModalChange,
}) => {
  // CONSOLE DEBUGGING - removed for cleaner logs
  
  // HOOKS
  const colors = useColorPalette();
  const themeColors = useThemeColors();
  const insets = useSafeAreaInsets();
  
  // FORM STATE
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  
  // PICKER MODAL VISIBILITY STATE
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [isColorPickerVisible, setIsColorPickerVisible] = useState(false);
  const [isTimeDurationPickerVisible, setIsTimeDurationPickerVisible] = useState(false);
  const [isAlertsPickerVisible, setIsAlertsPickerVisible] = useState(false);

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
  useEffect(() => {
    const isAnyPickerOpen = isDatePickerVisible || isColorPickerVisible || 
                           isTimeDurationPickerVisible || isAlertsPickerVisible;
    onFormPickerModalChange?.(isAnyPickerOpen);
  }, [isDatePickerVisible, isColorPickerVisible, isTimeDurationPickerVisible, isAlertsPickerVisible, onFormPickerModalChange]);

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
    closeAllModalsExcept('date');
    triggerButtonHighlight(dateButtonHighlightOpacity);
    setIsDatePickerVisible(true);
  };
  
  const handleDateSelect = (date: string) => {
    console.log('Date selected:', date);
    onChange('dueDate', date);
  };
  
  const handleDatePickerClose = () => {
    setIsDatePickerVisible(false);
  };

  // COLOR PICKER HANDLERS
  const handleShowColorPicker = () => {
    closeAllModalsExcept('color');
    triggerButtonHighlight(iconButtonHighlightOpacity);
    setIsColorPickerVisible(true);
  };
  
  const handleColorSelect = (color: TaskColor) => {
    console.log('Color selected:', color);
    onChange('color', color);
  };
  
  const handleColorPickerClose = () => {
    setIsColorPickerVisible(false);
  };

  // ICON SELECTION HANDLER
  const handleIconSelect = (icon: string) => {
    console.log('Icon selected:', icon);
    onChange('icon', icon);
  };

  // TIME/DURATION PICKER HANDLERS
  const handleShowTimeDurationPicker = () => {
    closeAllModalsExcept('time');
    triggerButtonHighlight(timeButtonHighlightOpacity);
    setIsTimeDurationPickerVisible(true);
  };
  
  const handleTimeSelect = (time: string | undefined) => {
    console.log('Time selected:', time);
    onChange('time', time);
  };
  
  const handleDurationSelect = (duration: number | undefined) => {
    console.log('Duration selected:', duration);
    onChange('duration', duration);
  };
  
  const handleTimeDurationPickerClose = () => {
    setIsTimeDurationPickerVisible(false);
  };

  // ALERTS PICKER HANDLERS
  const handleShowAlertsPicker = () => {
    closeAllModalsExcept('alerts');
    triggerButtonHighlight(alertsButtonHighlightOpacity);
    setIsAlertsPickerVisible(true);
  };
  
  const handleAlertsPickerClose = () => {
    setIsAlertsPickerVisible(false);
  };
  
  const handleAlertsApply = (alertIds: string[]) => {
    console.log('Alerts applied:', alertIds);
    onChange('alerts', alertIds);
  };

  // CLOSE HANDLER WITH CHANGE DETECTION
  const handleClose = () => {
    if (hasChanges) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to discard them?',
        [
          {
            text: 'Continue Editing',
            style: 'cancel',
            onPress: () => {
              console.log('User chose to continue editing');
            },
          },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              console.log('User chose to discard changes');
              Keyboard.dismiss();
              onClose();
            },
          },
        ],
        { cancelable: true }
      );
    } else {
      console.log('No changes, closing modal');
      Keyboard.dismiss();
      onClose();
    }
  };

  // PICKER BUTTONS CONFIGURATION
  const pickerButtons = [
    {
      id: 'icon',
      icon: (values.icon as any) || 'star-outline',
      label: '', // empty label since there's always a default and we don't want to show text
      onPress: handleShowColorPicker,
    },
    {
      id: 'date',
      icon: 'calendar-outline',
      label: 'No Date',
      onPress: handleShowDatePicker,
    },
    {
      id: 'time',
      icon: 'time-outline', 
      label: 'No Time or Duration',
      onPress: handleShowTimeDurationPicker,
    },
    {
      id: 'alerts',
      icon: 'notifications-outline',
      label: 'No Alerts',
      onPress: handleShowAlertsPicker,
    },
  ];

  return (
    <>
      {/* main scrollable content wrapper */}
      <ScrollView 
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        contentContainerStyle={{ paddingBottom: 0 }}
      >
        {/* header with icon display and title input - now inside ScrollView */}
        <View
          style={{
            paddingTop: 24,
            paddingBottom: 0,
            paddingHorizontal: 20,
          }}
        >
          {/* title input takes full width */}
          <TextInput
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
        <View style={{ paddingTop: 8 }}>
          <TaskDescription
            description={values.description || ''}
            onDescriptionChange={(description) => onChange('description', description)}
            isEditing={true}
          />
        </View>

        {/* Subtask Section */}
        <View>
          <SubtaskSection
            onAddSubtask={() => {
              console.log('Add subtask clicked - placeholder functionality');
            }}
          />
        </View>

        {/* form fields section */}
        <View 
          style={{ 
            paddingTop: 24,
            paddingBottom: 16,
            
          }}
        >
          {/* horizontal scrollable picker buttons */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="always"
            contentContainerStyle={{
              paddingRight: 16,
              gap: 16,
            }}
          >
            {pickerButtons.map((button) => {
              const displayInfo = button.id === 'icon'
                ? getIconPickerDisplay(values.icon, values.color, colors, themeColors)
                : button.id === 'date' 
                ? getDatePickerDisplay(values.dueDate, colors, themeColors)
                : button.id === 'time' 
                ? getTimeDurationPickerDisplay(values.time, values.duration, themeColors)
                : button.id === 'alerts'
                ? getAlertsPickerDisplay(values.alerts?.length || 0, themeColors)
                : null;
              
              const iconColor = displayInfo ? displayInfo.iconColor : themeColors.text.secondary();
              const textColor = displayInfo ? displayInfo.color : themeColors.text.secondary();
              
               // Only show display text if there's actually a value selected (not default "No X" text)
               const displayText = displayInfo && !displayInfo.text.startsWith('No ') 
                 ? displayInfo.text 
                 : '';

              const animatedValue = button.id === 'icon'
                ? iconButtonHighlightOpacity
                : button.id === 'date' 
                ? dateButtonHighlightOpacity 
                : button.id === 'time' 
                ? timeButtonHighlightOpacity 
                : alertsButtonHighlightOpacity;

              return (
                 <View key={button.id} style={{ left: 16 }}>
                   <FormPickerButton
                     icon={button.icon}
                     defaultText={button.label}
                     displayText={displayText}
                     textColor={textColor}
                     iconColor={iconColor}
                     onPress={button.onPress}
                     highlightOpacity={animatedValue}
                     forceSelected={button.id === 'icon'} // force selected state for icon picker
                     rightContainer={button.id === 'icon' ? (
                       <View style={{
                         width: 24,
                         height: 24,
                         borderRadius: 12,
                         backgroundColor: 'rgba(0, 0, 0, 0.1)',
                         alignItems: 'center',
                         justifyContent: 'center',
                       }}>
                         <Ionicons
                           name="color-palette"
                           size={24}
                           color={themeColors.text.secondary()}
                         />
                       </View>
                     ) : undefined}
                   />
                 </View>
              );
            })}
          </ScrollView>
        </View>
      </ScrollView>
      <View style={{
          borderTopWidth: 1,
          borderTopColor: themeColors.border.secondary(),
          paddingVertical: BOTTOM_SECTION_PADDING_VERTICAL,
          paddingHorizontal: 16,
          flexDirection: 'row',
          justifyContent: 'flex-end',
          alignItems: 'center',
      }}>
        {/* Circular create button anchored to the right */}
        <Pressable
          onPress={() => console.log('Create button tapped')}
          style={{
            width: 42,
            height: 42,
            borderRadius: 28,
            backgroundColor: values.color 
              ? TaskCategoryColors[values.color][500]
              : TaskCategoryColors.blue[500],
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Ionicons
            name="arrow-up"
            size={20}
            color={'#FFFFFF'}
          />
        </Pressable>
      </View>
      
      {/* date picker modal */}
      <DatePickerModal
        visible={isDatePickerVisible}
        selectedDate={values.dueDate || new Date().toISOString()}
        onClose={handleDatePickerClose}
        onSelectDate={handleDateSelect}
        title="Date"
      />
      
      {/* color and icon picker modal */}
      <TaskIconColorModal
        visible={isColorPickerVisible}
        selectedColor={(values.color as TaskColor) || 'blue'}
        selectedIcon={values.icon}
        onClose={handleColorPickerClose}
        onSelectColor={handleColorSelect}
        onSelectIcon={handleIconSelect}
      />
      
      {/* time/duration picker modal */}
      <TaskTimeDurationModal
        visible={isTimeDurationPickerVisible}
        selectedTime={values.time}
        selectedDuration={values.duration}
        onClose={handleTimeDurationPickerClose}
        onSelectTime={handleTimeSelect}
        onSelectDuration={handleDurationSelect}
      />
      
      {/* alerts picker modal */}
      <TaskAlertModal
        visible={isAlertsPickerVisible}
        selectedAlerts={values.alerts || []}
        onClose={handleAlertsPickerClose}
        onApplyAlerts={handleAlertsApply}
      />
    </>
  );
};

export default TaskCreationContent;

