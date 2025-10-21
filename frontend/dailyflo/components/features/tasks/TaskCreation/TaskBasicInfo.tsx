/**
 * TaskBasicInfo (Step 1 of Task Creation)
 *
 * Basic task information: title and due date.
 * This is the first step in the multi-step task creation flow.
 */

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Keyboard, TouchableWithoutFeedback, Platform, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getTextStyle } from '@/constants/Typography';
import { useColorPalette, useThemeColors } from '@/hooks/useColorPalette';
import { validateAll, TaskFormValues } from '@/components/forms/TaskForm/TaskValidation';
import { DatePickerModal } from '@/components/features/calendar';
import { TaskIconColorModal } from './TaskIconColorModal';
import { TaskTimeDurationModal } from './TaskTimeDurationModal';
import { TaskAlertModal } from './TaskAlertModal';
import { TaskDescription } from './TaskDescription';
import { TaskCategoryColors } from '@/constants/ColorPalette';
import type { TaskColor } from '@/types';
import { ModalBackdrop } from '@/components/layout/ModalLayout';
import { 
  FormPickerButton, 
  getDatePickerDisplay, 
  getTimeDurationPickerDisplay,
  getAlertsPickerDisplay,
} from '@/components/ui/Button';

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
  
  // state for alert picker modal visibility
  // this controls whether the alert picker modal is shown
  // flow: user taps alerts button → handleShowAlertsPicker sets this to true → modal opens
  const [isAlertsPickerVisible, setIsAlertsPickerVisible] = useState(false);

  // animation state for button highlights
  // these control the highlight animations that play when buttons are tapped or values change
  const dateButtonHighlightOpacity = useRef(new Animated.Value(0)).current;
  const timeButtonHighlightOpacity = useRef(new Animated.Value(0)).current;
  const alertsButtonHighlightOpacity = useRef(new Animated.Value(0)).current;
  const [previousDueDate, setPreviousDueDate] = useState(values.dueDate);

  // derived validation state
  const errors = useMemo(() => validateAll(values as TaskFormValues), [values]);

  // effect to trigger highlight animation when date changes
  // this plays a subtle highlight animation when user selects a new date
  useEffect(() => {
    // only animate if the date actually changed and it's not the initial render
    if (previousDueDate !== values.dueDate && previousDueDate !== undefined) {
      // start highlight animation: fade in then fade out
      Animated.sequence([
        // fade in highlight
        Animated.timing(dateButtonHighlightOpacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        // fade out highlight
        Animated.timing(dateButtonHighlightOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
    
    // update previous date for next comparison
    setPreviousDueDate(values.dueDate);
  }, [values.dueDate, previousDueDate, dateButtonHighlightOpacity]);

  const onBlur = (key: keyof TaskFormValues) => {
    setTouched((prev) => ({ ...prev, [key]: true }));
  };

  // reusable function to trigger button highlight animation
  // this creates a subtle highlight animation for any button
  const triggerButtonHighlight = (animatedValue: Animated.Value) => {
    // start highlight animation: fade in then fade out
    Animated.sequence([
      // fade in highlight
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      // fade out highlight
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // date picker handlers
  // this opens the date picker modal when user taps the date button
  const handleShowDatePicker = () => {
    console.log('Opening date picker modal');
    triggerButtonHighlight(dateButtonHighlightOpacity);
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
    triggerButtonHighlight(timeButtonHighlightOpacity);
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
  // this opens the alerts picker modal when user taps the alerts button
  const handleShowAlertsPicker = () => {
    console.log('Opening alerts picker modal');
    triggerButtonHighlight(alertsButtonHighlightOpacity);
    setIsAlertsPickerVisible(true);
  };
  
  // this handles when user closes the alerts picker modal
  const handleAlertsPickerClose = () => {
    console.log('Alerts picker modal closed');
    setIsAlertsPickerVisible(false);
  };
  
  // this handles when user applies alert changes (presses Done button)
  // flow: user selects alerts in modal → presses done → this function → onChange updates form state
  const handleAlertsApply = (alertIds: string[]) => {
    console.log('Alerts applied:', alertIds);
    onChange('alerts', alertIds);
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  // horizontal button configuration for the picker buttons
  // these buttons use the reusable FormPickerButton component
  const pickerButtons = [
    {
      id: 'date',
      icon: 'calendar-outline',
      label: 'No Date', // default text when no date is selected
      onPress: handleShowDatePicker,
    },
    {
      id: 'time',
      icon: 'time-outline', 
      label: 'No Time or Duration', // default text when no time/duration is selected
      onPress: handleShowTimeDurationPicker,
    },
    {
      id: 'alerts',
      icon: 'notifications-outline',
      label: 'No Alerts', // default text when no alerts are set
      onPress: handleShowAlertsPicker,
    },
  ];

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <View style={{ flex: 1 }}>
        {/* reusable backdrop component that fades when any modal opens */}
        {/* isVisible is true when any modal (date, color, time/duration, or alerts picker) is open */}
        <ModalBackdrop 
          isVisible={isDatePickerVisible || isColorPickerVisible || isTimeDurationPickerVisible || isAlertsPickerVisible}
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

        {/* scrollable content below header */}
        <ScrollView 
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
        >
          {/* form fields section */}
          <View 
            style={{ 
              paddingTop: 24,
              paddingBottom: 16,
              // removed flex: 1 to prevent it from taking all available space
            }}
          >
          {/* horizontal scrollable picker buttons using FormPickerButton component */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingRight: 16,
              gap: 16,
            }}
          >
            {pickerButtons.map((button) => {
              // get dynamic display info for all buttons using utility functions
              // these utility functions provide consistent logic and semantic colors
              const displayInfo = button.id === 'date' 
                ? getDatePickerDisplay(values.dueDate, colors, themeColors)
                : button.id === 'time' 
                ? getTimeDurationPickerDisplay(values.time, values.duration, themeColors)
                : button.id === 'alerts'
                ? getAlertsPickerDisplay(values.alerts?.length || 0, themeColors)
                : null;
              
              const iconColor = displayInfo ? displayInfo.iconColor : themeColors.text.secondary();
              const textColor = displayInfo ? displayInfo.color : themeColors.text.secondary();
              const displayText = displayInfo ? displayInfo.text : button.label;

              // get the appropriate animated value for this button
              const animatedValue = button.id === 'date' 
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
                  />
                </View>
              );
            })}
          </ScrollView>

        </View>

        {/* Task Description Section - positioned below picker buttons */}
        {/* This component provides subtask management and description input */}
        {/* flow: user can add subtasks (placeholder) and enter additional notes */}
        <View style={{ 
          paddingHorizontal: 16, 
          paddingTop: 16,
          paddingBottom: insets.bottom + 16,
          // removed flex: 1 to let it size naturally
        }}>
          <TaskDescription
            description={values.description || ''}
            onDescriptionChange={(description) => onChange('description', description)}
          
            isEditing={true}
          />
          </View>
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
      
      {/* alerts picker modal */}
      {/* this modal appears when user wants to select task alerts/reminders */}
      {/* flow: user taps alerts button → modal opens → user selects alerts → presses done → onApplyAlerts updates form → modal closes */}
      <TaskAlertModal
        visible={isAlertsPickerVisible}
        selectedAlerts={values.alerts || []}
        onClose={handleAlertsPickerClose}
        onApplyAlerts={handleAlertsApply}
      />

    </KeyboardAvoidingView>
  );
};

export default TaskBasicInfo;
