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
import { TaskColorSelectModal } from './TaskColorSelectModal';
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

  const borderError = colors.getSemanticColor('error', 500);
  const labelColor = themeColors.text.secondary();

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <View style={{ flex: 1 }}>
        {/* reusable backdrop component that fades when any modal opens */}
        {/* isVisible is true when any modal (date picker or color picker) is open */}
        <ModalBackdrop 
          isVisible={isDatePickerVisible || isColorPickerVisible}
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
            paddingHorizontal: 24,
            paddingTop: 24,
            paddingBottom: insets.bottom + 20,
            gap: 12,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onScrollBeginDrag={dismissKeyboard}
        >
          <View style={{ gap: 8 }}>
            {/* date picker button */}
            <Pressable
              onPress={handleShowDatePicker}
              style={{
                borderRadius: 12,
                paddingHorizontal: 20,
                paddingVertical: 12,
                backgroundColor: themeColors.background.elevated(),
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Ionicons 
                name="calendar-outline" 
                size={20} 
                color={themeColors.text.primary()} 
                style={{ marginRight: 12 }}
              />
              
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={[
                  getTextStyle('body-large'),
                  { 
                    color: themeColors.text.primary() 
                  }
                ]}>
                  {values.dueDate 
                    ? new Date(values.dueDate).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })
                    : 'No Deadline'
                  }
                </Text>
                
                <Text style={[
                  getTextStyle('body-large'),
                  { 
                    color: themeColors.text.tertiary?.() || labelColor 
                  }
                ]}>
                  {values.dueDate ? getRelativeDateMessage(values.dueDate) : '—'}
                </Text>
              </View>
            </Pressable>
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
      
      {/* color picker modal */}
      {/* this modal appears when user wants to select a task color */}
      {/* flow: user taps color icon → modal opens → user picks color → onSelectColor called → modal closes */}
      <TaskColorSelectModal
        visible={isColorPickerVisible}
        selectedColor={(values.color as TaskColor) || 'blue'}
        onClose={handleColorPickerClose}
        onSelectColor={handleColorSelect}
      />
    </KeyboardAvoidingView>
  );
};

export default TaskBasicInfo;




