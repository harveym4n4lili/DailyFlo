/**
 * Task create – full-screen create task form (no indent, drag to close only).
 * Presentation is fullScreenModal set on root Stack in app/_layout.tsx.
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useAppDispatch } from '@/store';
import { createTask } from '@/store/slices/tasks/tasksSlice';
import { useTasks } from '@/store/hooks';
import { TaskScreenContent } from '@/components/features/tasks/TaskScreen/TaskScreenContent';
import type { TaskFormValues } from '@/components/forms/TaskForm/TaskValidation';
import type { PriorityLevel, RoutineType, CreateTaskInput, TaskColor, Subtask as TaskSubtask } from '@/types';
import type { Subtask } from '@/components/features/subtasks';
import { validateAll } from '@/components/forms/TaskForm/TaskValidation';
import { useCreateTaskDraft } from '@/app/task/CreateTaskDraftContext';

const getDefaults = (themeColor: TaskColor = 'red'): TaskFormValues => ({
  title: '',
  description: '',
  dueDate: new Date().toISOString(),
  priorityLevel: 3 as PriorityLevel,
  color: themeColor,
  icon: undefined,
  routineType: 'once' as RoutineType,
  listId: undefined,
  alerts: [],
});

export default function TaskCreateScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ dueDate?: string }>();
  const themeColors = useThemeColors();
  const { themeColor } = useThemeColor();
  const dispatch = useAppDispatch();
  const { isCreating, createError } = useTasks();
  const { draft, setDraft, setDueDate, setTime, setDuration, setAlerts } = useCreateTaskDraft();

  const [localValues, setLocalValues] = useState<Partial<TaskFormValues>>(() => ({
    ...getDefaults(themeColor),
    ...(params.dueDate ? { dueDate: params.dueDate } : {}),
  }));
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [pendingFocusSubtaskId, setPendingFocusSubtaskId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    const initialDueDate = params.dueDate ?? new Date().toISOString();
    setDraft({ dueDate: initialDueDate, time: undefined, duration: undefined, alerts: [] });
    if (params.dueDate) setLocalValues((prev) => ({ ...prev, dueDate: params.dueDate }));
    setSubtasks([]);
  }, [params.dueDate, setDraft]);

  const values: Partial<TaskFormValues> = useMemo(
    () => ({
      ...localValues,
      dueDate: draft.dueDate ?? localValues.dueDate ?? new Date().toISOString(),
      time: draft.time,
      duration: draft.duration,
      alerts: draft.alerts?.length ? draft.alerts : localValues.alerts,
    }),
    [localValues, draft],
  );

  const onChange = <K extends keyof TaskFormValues>(key: K, v: TaskFormValues[K]) => {
    setValidationError(null);
    if (key === 'dueDate') setDueDate(v as string);
    else if (key === 'time') setTime(v as string | undefined);
    else if (key === 'duration') setDuration(v as number | undefined);
    else if (key === 'alerts') setAlerts((v as string[]) ?? []);
    else if (key === 'routineType') setLocalValues((prev) => ({ ...prev, routineType: v as RoutineType }));
    else setLocalValues((prev) => ({ ...prev, [key]: v }));
  };

  const handleCreateSubtask = () => {
    const newSubtask: Subtask = {
      id: `subtask-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      title: '',
      isCompleted: false,
      isEditing: true,
    };
    setSubtasks((prev) => [...prev, newSubtask]);
    setPendingFocusSubtaskId(newSubtask.id);
  };

  const handleSubtaskTitleChange = (subtaskId: string, newTitle: string) => {
    setSubtasks((prev) =>
      prev.map((s) => (s.id === subtaskId ? { ...s, title: newTitle } : s)),
    );
  };
  const handleSubtaskFinishEditing = (subtaskId: string) => {
    setSubtasks((prev) =>
      prev.map((s) => (s.id === subtaskId ? { ...s, isEditing: false } : s)),
    );
  };
  const handleSubtaskToggle = (subtaskId: string) => {
    setSubtasks((prev) =>
      prev.map((s) =>
        s.id === subtaskId ? { ...s, isCompleted: !s.isCompleted } : s,
      ),
    );
  };
  const handleSubtaskDelete = (subtaskId: string) => {
    setSubtasks((prev) => prev.filter((s) => s.id !== subtaskId));
  };

  const isSaveButtonVisible = !!(values.title?.trim());

  const handleSave = async () => {
    const errors = validateAll(values as TaskFormValues);
    if (Object.keys(errors).length > 0) {
      const firstError = errors.title ?? Object.values(errors).filter(Boolean)[0] ?? 'Please fix the form errors';
      setValidationError(firstError);
      return;
    }
    setValidationError(null);

    const taskSubtasks: TaskSubtask[] = subtasks.map((st, index) => ({
      id: st.id,
      title: st.title,
      isCompleted: st.isCompleted,
      sortOrder: index,
    }));

    const taskData: CreateTaskInput = {
      title: values.title!.trim(),
      description: values.description?.trim() || undefined,
      icon: values.icon && values.icon.trim() ? values.icon.trim() : undefined,
      time: values.time || undefined,
      duration: values.duration || undefined,
      dueDate: values.dueDate || undefined,
      priorityLevel: values.priorityLevel || 3,
      color: values.color || themeColor,
      routineType: values.routineType || 'once',
      listId: values.listId || undefined,
      metadata: {
        subtasks: taskSubtasks,
        reminders: [],
        notes: values.description?.trim() || undefined,
        tags: [],
      },
    };

    try {
      const result = await dispatch(createTask(taskData));
      if (createTask.fulfilled.match(result)) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        setLocalValues({ ...getDefaults(themeColor) });
        setDraft({ dueDate: undefined, time: undefined, duration: undefined, alerts: [] });
        setSubtasks([]);
        router.back();
      }
    } catch (e) {
      console.error('Unexpected error creating task:', e);
    }
  };

  const closingRef = useRef(false);
  const handleClose = () => {
    if (closingRef.current) return;
    closingRef.current = true;
    setTimeout(() => router.back(), 100);
  };

  const pickerHandlers = useMemo(
    () => ({
      onShowDatePicker: () => router.push('/date-select'),
      onShowTimeDurationPicker: () => router.push('/time-duration-select'),
      onShowAlertsPicker: () => router.push('/alert-select'),
    }),
    [router],
  );

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background.primary() }]}>
      <TaskScreenContent
        visible={true}
        values={values}
        onChange={onChange}
        onClose={handleClose}
        hasChanges={!!(values.title?.trim() || values.description?.trim() || subtasks.length > 0)}
        isSaveButtonVisible={isSaveButtonVisible}
        onCreate={handleSave}
        saveButtonText="Create"
        saveLoadingText="Creating..."
        isCreating={isCreating}
        createError={createError ?? undefined}
        validationError={validationError ?? undefined}
        subtasks={subtasks}
        onSubtaskToggle={handleSubtaskToggle}
        onSubtaskDelete={handleSubtaskDelete}
        onSubtaskTitleChange={handleSubtaskTitleChange}
        onSubtaskFinishEditing={handleSubtaskFinishEditing}
        onCreateSubtask={handleCreateSubtask}
        pendingFocusSubtaskId={pendingFocusSubtaskId}
        onClearPendingFocus={() => setPendingFocusSubtaskId(null)}
        embedHeaderButtons={true}
        isEditMode={false}
        saveButtonBottomInsetWhenKeyboardHidden={44}
        pickerHandlers={pickerHandlers}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
