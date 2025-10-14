/**
 * TaskBasicInfo (Step 1 of Task Creation)
 *
 * Basic task information: title and due date.
 * This is the first step in the multi-step task creation flow.
 */

import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Keyboard, TouchableWithoutFeedback, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getTextStyle } from '@/constants/Typography';
import { useColorPalette, useThemeColors } from '@/hooks/useColorPalette';
import { validateAll, TaskFormValues } from '@/components/forms/TaskForm/TaskValidation';
import { DatePickerModal } from '@/components/features/calendar';
import { TaskIconColorModal } from './TaskIconColorModal';
import { TaskTimeDurationModal } from './TaskTimeDurationModal';
import { TaskCategoryColors } from '@/constants/ColorPalette';
import type { TaskColor } from '@/types';
import { ModalBackdrop } from '@/components/layout/ModalLayout';
import { GroupedList, type GroupedListItemConfig } from '@/components/ui/List/GroupedList';

export interface TaskBasicInfoProps {
  initialValues?: Partial<TaskFormValues>;
  onContinue?: (values: Partial<TaskFormValues>) => void;
  values: Partial<TaskFormValues>;
  onChange: <K extends keyof TaskFormValues>(key: K, v: TaskFormValues[K]) => void;
}

export const TaskBasicInfo: React.FC<TaskBasicInfoProps> = ({ 
  values, 
  onChange,
}) => {
  const colors = useColorPalette();
  const themeColors = useThemeColors();
  const insets = useSafeAreaInsets();
  
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  
  // state for date picker modal visibility
  // this controls whether the date picker modal is shown
  // flow: user taps date button → handleShowDatePicker sets this to true → modal opens
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  
  // state for color select modal visibility
  // this controls whether the color select modal is shown
  // flow: user taps color icon → handleShowColorPicker sets this to true → modal opens
  const [isColorPickerVisible, setIsColorPickerVisible] = useState(false);
  
  // state for time/duration picker modal visibility
  // this controls whether the time/duration picker modal is shown
  // flow: user taps time/duration button → handleShowTimeDurationPicker sets this to true → modal opens
  const [isTimeDurationPickerVisible, setIsTimeDurationPickerVisible] = useState(false);


  // derived validation state
  const errors = useMemo(() => validateAll(values as TaskFormValues), [values]);

  const onBlur = (key: keyof TaskFormValues) => {
    setTouched((prev) => ({ ...prev, [key]: true }));
  };

  // date picker handlers
  // this opens the date picker modal when user taps the date button
  const handleShowDatePicker = () => {
    console.log('Opening date picker modal');
    setIsDatePickerVisible(true);
  };
  
  // this handles when user selects a date from the picker
  // flow: user picks date in modal → onSelectDate callback → this function → onChange updates form state
  const handleDateSelect = (date: string) => {
    console.log('Date selected:', date);
    onChange('dueDate', date);
  };
  
  // this handles when user closes the date picker modal
  const handleDatePickerClose = () => {
    console.log('Date picker modal closed');
    setIsDatePickerVisible(false);
  };

  // color picker handlers
  // this opens the color picker modal when user taps the color icon
  const handleShowColorPicker = () => {
    console.log('Opening color picker modal');
    setIsColorPickerVisible(true);
  };
  
  // this handles when user selects a color from the picker
  // flow: user picks color in modal → onSelectColor callback → this function → onChange updates form state
  const handleColorSelect = (color: TaskColor) => {
    console.log('Color selected:', color);
    onChange('color', color);
  };
  
  // this handles when user closes the color picker modal
  const handleColorPickerClose = () => {
    console.log('Color picker modal closed');
    setIsColorPickerVisible(false);
  };

  // time/duration picker handlers
  // this opens the time/duration picker modal when user taps the time/duration button
  const handleShowTimeDurationPicker = () => {
    console.log('🔵 Opening time/duration picker modal');
    console.log('🔵 Current state before:', isTimeDurationPickerVisible);
    setIsTimeDurationPickerVisible(true);
    console.log('🔵 Set state to TRUE');
  };
  
  // this handles when user selects a time from the picker
  // flow: user picks time in modal → onSelectTime callback → this function → onChange updates form state
  const handleTimeSelect = (time: string | undefined) => {
    console.log('Time selected:', time);
    onChange('time', time);
  };
  
  // this handles when user selects a duration from the picker
  // flow: user picks duration in modal → onSelectDuration callback → this function → onChange updates form state
  const handleDurationSelect = (duration: number | undefined) => {
    console.log('Duration selected:', duration);
    onChange('duration', duration);
  };
  
  // this handles when user closes the time/duration picker modal
  const handleTimeDurationPickerClose = () => {
    console.log('Time/duration picker modal closed');
    setIsTimeDurationPickerVisible(false);
  };

  // alerts picker handlers
  // this logs when user taps the alerts button (no modal opens)
  const handleShowAlertsPicker = () => {
    console.log('Opening alerts picker modal');
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  // calculate relative date message (Today, Tomorrow, In X days)
  const getRelativeDateMessage = (dateString: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dueDate = new Date(dateString);
    dueDate.setHours(0, 0, 0, 0);
    
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Tomorrow';
    } else if (diffDays === -1) {
      return 'Yesterday';
    } else if (diffDays > 0) {
      return `In ${diffDays} days`;
    } else {
      return `${Math.abs(diffDays)} days ago`;
    }
  };

  // format time and duration for display
  // this creates the combined display text for the time & duration value
  const formatTimeDuration = () => {
    if (values.time && values.duration) {
      return `${values.time} • ${values.duration}min`;
    } else if (values.time) {
      return values.time;
    } else if (values.duration) {
      return `${values.duration}min`;
    } else {
      return 'Optional';
    }
  };

  // configuration for the grouped list items
  // this array defines the three picker buttons (date, time/duration, alerts)
  const pickerItems: GroupedListItemConfig[] = useMemo(() => [
    {
      id: 'date',
      icon: 'calendar-outline',
      label: values.dueDate 
        ? new Date(values.dueDate).toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
          })
        : 'No Deadline',
      value: values.dueDate ? getRelativeDateMessage(values.dueDate) : '—',
      onPress: handleShowDatePicker,
    },
    {
      id: 'time',
      icon: 'time-outline',
      label: 'Time & Duration',
      value: formatTimeDuration(),
      onPress: handleShowTimeDurationPicker,
    },
    {
      id: 'alerts',
      icon: 'notifications-outline',
      label: 'Alerts',
      value: 'Not Set',
      onPress: handleShowAlertsPicker,
    },
  ], [values.dueDate, values.time, values.duration]);

  const borderError = colors.getSemanticColor('error', 500);
  const labelColor = themeColors.text.secondary();

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <View style={{ flex: 1 }}>
        {/* reusable backdrop component that fades when any modal opens */}
        {/* isVisible is true when any modal (date picker, color picker, or time/duration picker) is open */}
        <ModalBackdrop 
          isVisible={isDatePickerVisible || isColorPickerVisible || isTimeDurationPickerVisible}
        />

        {/* header with title input and color icon */}
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <View
            style={{
              paddingTop: insets.top + 60,
              paddingBottom: 30,
              // use the selected task color as background (lighter shade for better contrast)
              backgroundColor: values.color 
                ? TaskCategoryColors[values.color][500] 
                : TaskCategoryColors.blue[50],
              paddingHorizontal: 20,
              paddingRight: 40,
            }}
          >
            {/* flex row to align color icon and title input */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              {/* color icon button on the left */}
              {/* when tapped, opens the color select modal */}
              <Pressable
                onPress={handleShowColorPicker}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  // use the selected color from TaskCategoryColors palette
                  backgroundColor: themeColors.background.elevated(),
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {/* palette icon to indicate this is for color selection */}
                <Ionicons
                  name="color-palette"
                  size={24}
                  // use a light color for the icon so it contrasts well with the colored background
                  color={themeColors.text.primary()}
                />
              </Pressable>
              
              {/* title input takes up remaining space */}
              <TextInput
                value={values.title || ''}
                onChangeText={(t) => onChange('title', t)}
                onBlur={() => onBlur('title')}
                placeholder="Task title"
                placeholderTextColor={themeColors.background.lightOverlay()}
                selectionColor={'#fff'}
                style={{
                  ...getTextStyle('heading-2'),
                  color: '#fff',
                  paddingVertical: 6,
                  paddingHorizontal: 0,
                  borderBottomWidth: 1,
                  // use the selected task color for the border to match the theme
                  borderBottomColor: '#fff',
                  flex: 1,
                }}
                autoFocus={true}
                returnKeyType="next"
              />
            </View>
          </View>
        </TouchableWithoutFeedback>

        {/* scrollable form fields section */}
        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={{ 
            flexGrow: 1,
            paddingHorizontal: 16,
            paddingTop: 32,
            paddingBottom: insets.bottom + 20,
            gap: 12,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onScrollBeginDrag={dismissKeyboard}
        >
          {/* ios-style grouped list for picker buttons */}
          {/* replaces the old hardcoded date, time, and alerts buttons */}
          {/* the GroupedList component automatically handles border radius and separators */}
          <GroupedList items={pickerItems} />
        </ScrollView>
      </View>
      
      {/* date picker modal */}
      {/* this modal appears when user wants to select a date */}
      {/* flow: user taps date button → modal opens → user picks date → onSelectDate called → modal closes */}
      <DatePickerModal
        visible={isDatePickerVisible}
        selectedDate={values.dueDate || new Date().toISOString()}
        onClose={handleDatePickerClose}
        onSelectDate={handleDateSelect}
        title="Date"
      />
      
      {/* color picker modal */}
      {/* this modal appears when user wants to select a task color */}
      {/* flow: user taps color icon → modal opens → user picks color → onSelectColor called → modal closes */}
      <TaskIconColorModal
        visible={isColorPickerVisible}
        selectedColor={(values.color as TaskColor) || 'blue'}
        onClose={handleColorPickerClose}
        onSelectColor={handleColorSelect}
      />
      
      {/* time/duration picker modal */}
      {/* this modal appears when user wants to select time and/or duration */}
      {/* flow: user taps time/duration button → modal opens → user picks time/duration → callbacks update form → modal stays open or user dismisses */}
      <TaskTimeDurationModal
        visible={isTimeDurationPickerVisible}
        selectedTime={values.time}
        selectedDuration={values.duration}
        onClose={handleTimeDurationPickerClose}
        onSelectTime={handleTimeSelect}
        onSelectDuration={handleDurationSelect}
      />

    </KeyboardAvoidingView>
  );
};

export default TaskBasicInfo;




