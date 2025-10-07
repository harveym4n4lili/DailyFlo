/**
 * task form (prototype)
 *
 * this is a minimal, controlled form for creating a task.
 * it uses redux via hooks for dispatching create actions and reading loading/error states.
 * it uses constants for colors and typography.
 */

import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, KeyboardAvoidingView, Keyboard, TouchableWithoutFeedback, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTasks, useUI } from '@/store/hooks';
import { useAppDispatch } from '@/store';
import { createTask } from '@/store/slices/tasks/tasksSlice';
import { getTextStyle } from '@/constants/Typography';
import { TaskCategoryColorName } from '@/constants/ColorPalette';
import { useColorPalette, useThemeColors } from '@/hooks/useColorPalette';
import type { PriorityLevel, RoutineType } from '@/types';
import TaskValidation, { validateAll, TaskFormValues } from './TaskValidation';

export interface TaskFormProps {
  initialValues?: Partial<TaskFormValues>;
  onSubmitted?: () => void;
}

const DEFAULTS: TaskFormValues = {
  title: '',
  description: '',
  dueDate: new Date().toISOString(), // default to today's date
  priorityLevel: 3 as PriorityLevel,
  color: 'blue',
  routineType: 'once' as RoutineType,
  listId: undefined,
};

const TaskForm: React.FC<TaskFormProps> = ({ initialValues, onSubmitted }) => {
  // redux hooks - state and dispatch
  // useTasks gives access to tasks slice state like isCreating, createError
  const { isCreating, createError } = useTasks();
  const ui = useUI(); // ui slice for simple feedback patterns if needed later
  const dispatch = useAppDispatch(); // typed redux dispatch for thunks
  const colors = useColorPalette(); // design system color access
  const themeColors = useThemeColors(); // theme-aware colors
  const insets = useSafeAreaInsets();

  // local form state - controlled inputs live locally; redux holds domain data
  const [values, setValues] = useState<TaskFormValues>({ ...DEFAULTS, ...initialValues });
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // derived validation state
  const errors = useMemo(() => validateAll(values), [values]);
  const isValid = useMemo(() => Object.keys(errors).length === 0, [errors]);

  const onChange = <K extends keyof TaskFormValues>(key: K, v: TaskFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: v }));
  };

  const onBlur = (key: keyof TaskFormValues) => {
    setTouched((prev) => ({ ...prev, [key]: true }));
  };

  // date picker handlers
  // handle when user taps the date button to show picker
  // TODO: implement custom date select modal
  const handleShowDatePicker = () => {
    console.log('Date picker button pressed - implement custom modal here');
    // this will open your custom date select modal
  };

  // handle resetting the due date back to today
  const handleClearDate = () => {
    onChange('dueDate', new Date().toISOString());
  };

  // handle dismissing the keyboard
  // this is called when user taps outside of input fields
  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  // calculate relative date message (Today, Tomorrow, In X days)
  const getRelativeDateMessage = (dateString: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // reset time to start of day
    
    const dueDate = new Date(dateString);
    dueDate.setHours(0, 0, 0, 0); // reset time to start of day
    
    // calculate difference in days
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

  const submit = async () => {
    // guard invalid
    if (!isValid) {
      // surface validation via ui slice if desired
      ui.setValidationError?.({ scope: 'taskForm', errors });
      return;
    }

    // dispatch create action to redux
    // redux toolkit thunk handles updating isCreating/createError in tasks slice
    await dispatch(createTask({
      title: values.title.trim(),
      description: values.description?.trim() || '',
      dueDate: values.dueDate || undefined,
      priorityLevel: values.priorityLevel,
      color: values.color,
      routineType: values.routineType,
      listId: values.listId,
    } as any));

    onSubmitted?.();
  };

  // simple color preview using constants via hook helpers
  const colorKey: TaskCategoryColorName = (values.color || 'blue') as TaskCategoryColorName;
  const accent = colors.getTaskCategoryColor(colorKey, 500);
  const borderNeutral = themeColors.border.secondary();
  const borderError = colors.getSemanticColor('error', 500);
  const labelColor = themeColors.text.secondary();

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <View style={{ flex: 1 }}>
        {/* header with title input - large, bold input with bottom accent */}
        {/* the header sits below the cancel button (which is at insets.top + 8) */}
        {/* we add 60px for the cancel button area, then add some spacing */}
        {/* this header section is FIXED and does not scroll */}
        {/* tapping outside the input dismisses the keyboard */}
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <View
            style={{
              paddingTop: insets.top + 60,
              paddingBottom: 20,
              backgroundColor: themeColors.background.secondary(),
              paddingHorizontal: 20,
            }}
          >
          {/* title input styled as heading-2 with bottom accent border */}
          <TextInput
            value={values.title}
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
        {/* everything below the header can scroll */}
        {/* keyboard dismisses when scrolling starts */}
        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={{ 
            paddingHorizontal: 24,
            paddingTop: 24,
            paddingBottom: insets.bottom + 20,
            gap: 12,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onScrollBeginDrag={dismissKeyboard}
        >
          {/* form fields section - title is now in header */}
          <View style={{ gap: 8 }}>
            {/*<Text style={[getTextStyle('heading-3'), { color: themeColors.text.primary() }]}>Due Date</Text>*/}
            
            {/* date picker button - shows selected date or placeholder */}
            {/* clicking this will open your custom date select modal */}
            <Pressable
              onPress={handleShowDatePicker}
              style={{
                //borderWidth: 1,
                //borderColor: borderNeutral,
                borderRadius: 12,
                padding: 16,
                backgroundColor: themeColors.background.elevated(),
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              {/* calendar icon on the left */}
              <Ionicons 
                name="calendar-outline" 
                size={20} 
                color={themeColors.text.primary()} 
                style={{ marginRight: 12 }}
              />
              
              {/* date text - always shows a date (defaults to today) */}
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={[
                  getTextStyle('body-large'),
                  { 
                    color: themeColors.text.primary() 
                  }
                ]}>
                  {new Date(values.dueDate || new Date()).toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </Text>
                
                {/* relative date message (Today, Tomorrow, In X days) */}
                <Text style={[
                  getTextStyle('body-large'),
                  { 
                    color: themeColors.text.tertiary?.() || labelColor 
                  }
                ]}>
                  {getRelativeDateMessage(values.dueDate || new Date().toISOString())}
                </Text>
              </View>
              
              {/* clear button - resets to today's date */}
              {/* only show if the selected date is not today */}
              {values.dueDate && 
                new Date(values.dueDate).toDateString() !== new Date().toDateString() && (
                <Pressable
                  onPress={handleClearDate}
                  style={{
                    padding: 4,
                    marginLeft: 8,
                  }}
                >
                  <Text style={{ color: themeColors.text.primary(), fontSize: 16 }}>✕</Text>
                </Pressable>
              )}
            </Pressable>
          </View>

          {createError ? (
            <Text style={[getTextStyle('body-medium'), { color: borderError }]}>failed to create: {createError}</Text>
          ) : null}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

export type { TaskFormValues };
export default TaskForm;


