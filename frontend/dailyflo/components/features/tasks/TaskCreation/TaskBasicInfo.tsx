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

  // icon selection handler
  // this handles when user selects an icon from the picker
  // flow: user picks icon in modal → onSelectIcon callback → this function → onChange updates form state
  const handleIconSelect = (icon: string) => {
    console.log('Icon selected:', icon);
    onChange('icon', icon);
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

  // horizontal button configuration for the picker buttons
  // these buttons match the style shown in the reference image
  const pickerButtons = useMemo(() => [
    {
      id: 'date',
      icon: 'calendar-outline',
      label: 'Date',
      onPress: handleShowDatePicker,
    },
    {
      id: 'time',
      icon: 'time-outline', 
      label: 'Time & Duration',
      onPress: handleShowTimeDurationPicker,
    },
    {
      id: 'alerts',
      icon: 'notifications-outline',
      label: 'Alerts',
      onPress: handleShowAlertsPicker,
    },
  ], []);

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

        {/* header with icon display, color palette button, and title input */}
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <View
            style={{
              paddingTop: insets.top + 60,
              paddingBottom: 30,
              // use the selected task color as background (lighter shade for better contrast)
              backgroundColor: values.color 
                ? TaskCategoryColors[values.color][500] 
                : TaskCategoryColors.blue[50],
              paddingHorizontal: 24,
              paddingRight: 40,
            }}
          >
            {/* flex row to align icon display and title input side by side */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
              {/* icon display area with color palette at bottom left - entire area is pressable */}
              {/* when tapped anywhere on this area, opens the icon & color select modal */}
              <Pressable
                onPress={handleShowColorPicker}
                style={{
                  width: 64,
                  height: 88,
                  borderRadius: 32,
                  backgroundColor: themeColors.interactive.tertiary(),
                  borderWidth: 4,
                  borderColor: themeColors.border.secondary(),
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative', // allows positioning of color palette button inside
                }}
              >
                {/* icon display - shows selected icon or default star */}
                <Ionicons
                  name={(values.icon as any) || 'star'}
                  size={28}
                  color={values.color 
                    ? TaskCategoryColors[values.color][500] 
                    : TaskCategoryColors.blue[500]}
                    
                />
                
                {/* color palette button positioned at bottom left of icon display */}
                {/* this button is also pressable and opens the same modal */}
                {/* using View instead of nested Pressable to avoid touch event conflicts */}
                <View
                  style={{
                    position: 'absolute',
                    bottom: -12,
                    left: -12,
                    width: 32,
                    height: 32,
                    borderRadius: 18,
                    // use a lighter background for the color palette button
                    backgroundColor: themeColors.interactive.quaternary(),
                    alignItems: 'center',
                    justifyContent: 'center',
                    // add subtle shadow for depth
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                >
                  {/* palette icon to indicate this is for color selection */}
                  <Ionicons
                    name="color-palette"
                    size={20}
                    color={themeColors.text.primary()}
                  />
                </View>
              </Pressable>
              
              {/* title input takes remaining space on the right */}
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
                  // use white border to contrast with colored background
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
            paddingTop: 32,
            paddingBottom: insets.bottom + 20,
            gap: 12,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onScrollBeginDrag={dismissKeyboard}
        >
          {/* horizontal scrollable picker buttons - matches reference image style */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              
              gap: 16,
            }}
            style={{
              marginBottom: 12,
            }}
          >
            {pickerButtons.map((button) => (
              <Pressable
                key={button.id}
                onPress={button.onPress}
                style={{
                  left: 16,
                  backgroundColor: themeColors.interactive.quinary(),
                  borderRadius: 12,
                  paddingVertical: 12,
                  paddingHorizontal: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  // prevent buttons from stretching vertically
                  alignSelf: 'flex-start',
                  // add subtle border for definition
                  borderWidth: 1,
                  borderColor: themeColors.border.primary(),
                }}
              >
                {/* icon on the left */}
                <Ionicons
                  name={button.icon as any}
                  size={16}
                  color={themeColors.text.primary()}
                />
                
                {/* label text */}
                <Text style={{
                  ...getTextStyle('body-large'),
                  color: themeColors.text.primary(),
                  textAlignVertical: 'center',
                  includeFontPadding: false,
                }}>
                  {button.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
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
      
      {/* color and icon picker modal */}
      {/* this modal appears when user wants to select a task color or icon */}
      {/* flow: user taps color palette button → modal opens → user picks color/icon → callbacks update form → modal stays open or user dismisses */}
      <TaskIconColorModal
        visible={isColorPickerVisible}
        selectedColor={(values.color as TaskColor) || 'blue'}
        selectedIcon={values.icon}
        onClose={handleColorPickerClose}
        onSelectColor={handleColorSelect}
        onSelectIcon={handleIconSelect}
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




