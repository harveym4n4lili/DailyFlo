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
        {/* header with title input */}
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <View
            style={{
              paddingTop: insets.top + 60,
              paddingBottom: 20,
              backgroundColor: themeColors.background.secondary(),
              paddingHorizontal: 20,
            }}
          >
          <TextInput
            value={values.title || ''}
            onChangeText={(t) => onChange('title', t)}
            onBlur={() => onBlur('title')}
            placeholder="Task title"
            placeholderTextColor={themeColors.text.tertiary?.() || labelColor}
            style={{
              ...getTextStyle('heading-2'),
              color: themeColors.text.primary(),
              paddingVertical: 8,
              paddingHorizontal: 0,
              borderBottomWidth: 2,
              borderBottomColor: themeColors.border.primary(),
            }}
            autoFocus={true}
            returnKeyType="next"
          />
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
    </KeyboardAvoidingView>
  );
};

export default TaskBasicInfo;




