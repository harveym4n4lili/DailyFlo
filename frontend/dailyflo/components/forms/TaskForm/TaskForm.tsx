/**
 * task form (prototype)
 *
 * this is a minimal, controlled form for creating a task.
 * it uses redux via hooks for dispatching create actions and reading loading/error states.
 * it uses constants for colors and typography.
 */

import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
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
  dueDate: undefined,
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
    <View style={{ gap: 12, padding: 8, width: '100%'}}>
      <Text style={getTextStyle('heading-3')}>Create k</Text>

      <View style={{ gap: 8 }}>
        <Text style={[getTextStyle('body-large'), { color: labelColor }]}>Title</Text>
        <TextInput
          value={values.title}
          onChangeText={(t) => onChange('title', t)}
          onBlur={() => onBlur('title')}
          placeholder="enter a task title"
          placeholderTextColor={themeColors.text.tertiary?.() || labelColor}
          style={{ borderWidth: 1, borderColor: touched.title && errors.title ? borderError : borderNeutral, borderRadius: 8, padding: 10 }}
        />
        {touched.title && errors.title ? (
          <Text style={[getTextStyle('body-small'), { color: borderError }]}>{errors.title}</Text>
        ) : null}
      </View>

      <View style={{ gap: 8 }}>
        <Text style={[getTextStyle('body-large'), { color: labelColor }]}>Description</Text>
        <TextInput
          value={values.description}
          onChangeText={(t) => onChange('description', t)}
          onBlur={() => onBlur('description')}
          placeholder="optional description"
          multiline
          placeholderTextColor={themeColors.text.tertiary?.() || labelColor}
          style={{ borderWidth: 1, borderColor: borderNeutral, borderRadius: 8, padding: 10, minHeight: 60 }}
        />
        {touched.description && (errors as any).description ? (
          <Text style={[getTextStyle('body-small'), { color: borderError }]}>{(errors as any).description}</Text>
        ) : null}
      </View>

      {/* simple color preview uses constants; swap for a picker later */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: accent }} />
        <Text style={[getTextStyle('body-medium'), { color: labelColor }]}>{values.color}</Text>
      </View>

      <Pressable
        onPress={submit}
        disabled={!isValid || isCreating}
        style={{ backgroundColor: isValid ? accent : borderNeutral, padding: 12, borderRadius: 10, alignItems: 'center' }}
      >
        <Text style={[getTextStyle('button-primary'), { color: 'white' }]}>{isCreating ? 'Creating…' : 'Create task'}</Text>
      </Pressable>

      {createError ? (
        <Text style={[getTextStyle('body-small'), { color: borderError }]}>failed to create: {createError}</Text>
      ) : null}
    </View>
  );
};

export type { TaskFormValues };
export default TaskForm;


