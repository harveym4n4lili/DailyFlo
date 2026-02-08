/**
 * Create Task screen (full-screen modal Stack screen)
 *
 * Opened via router.push("/create-task") from FAB, Planner, Search, or Redux modals.createTask.
 * presentation: "modal" in _layout — full-screen, slide up, swipe to dismiss.
 * State and create logic live here; TaskScreenContent renders the form with embedHeaderButtons=true
 * so close and save are in the content (no screen header).
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

const getDefaults = (themeColor: TaskColor = 'red'): TaskFormValues => ({
  title: '',
  description: '',
  dueDate: new Date().toISOString(),
  priorityLevel: 3 as PriorityLevel,
  color: themeColor,
  icon: 'code-slash',
  routineType: 'once' as RoutineType,
  listId: undefined,
  alerts: [],
});

export default function CreateTaskScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ dueDate?: string }>();
  const themeColors = useThemeColors();
  const { themeColor } = useThemeColor();
  const dispatch = useAppDispatch();
  const { isCreating, createError } = useTasks();

  const [values, setValues] = useState<Partial<TaskFormValues>>(() => ({
    ...getDefaults(themeColor),
    ...(params.dueDate ? { dueDate: params.dueDate } : {}),
  }));
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [pendingFocusSubtaskId, setPendingFocusSubtaskId] = useState<string | null>(null);

  // when opened with a dueDate param (e.g. from planner), set form dueDate and reset subtasks
  useEffect(() => {
    if (params.dueDate) {
      setValues((prev) => ({ ...prev, dueDate: params.dueDate }));
    }
    setSubtasks([]);
  }, [params.dueDate]);

  const onChange = <K extends keyof TaskFormValues>(key: K, v: TaskFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: v }));
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

  const hasChanges = useMemo(
    () =>
      !!(
        values.title?.trim() ||
        values.description?.trim() ||
        values.dueDate !== getDefaults(themeColor).dueDate ||
        values.color !== getDefaults(themeColor).color ||
        values.icon !== getDefaults(themeColor).icon ||
        (values.alerts && values.alerts.length > 0) ||
        values.time !== undefined ||
        values.duration !== undefined ||
        subtasks.length > 0
      ),
    [values, themeColor, subtasks],
  );

  const handleCreate = async () => {
    const errors = validateAll(values as TaskFormValues);
    if (Object.keys(errors).length > 0) return;

    const taskSubtasks: TaskSubtask[] = subtasks.map((st, index) => ({
      id: st.id,
      title: st.title,
      isCompleted: st.isCompleted,
      sortOrder: index,
    }));

    const taskData: CreateTaskInput = {
      title: values.title!.trim(),
      description: values.description?.trim() || undefined,
      icon: values.icon || undefined,
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
        setValues({ ...getDefaults(themeColor) });
        setSubtasks([]);
        router.back();
      }
    } catch (e) {
      console.error('Unexpected error creating task:', e);
    }
  };

  // close: defer router.back() so we're past touch/keyboard (presentation: 'modal' avoids fullScreenModal dismiss freeze)
  const closingRef = useRef(false);
  const handleClose = () => {
    if (closingRef.current) return;
    closingRef.current = true;
    setTimeout(() => {
      router.back();
    }, 100);
  };
  return (
    <View style={[styles.container, { backgroundColor: themeColors.background.primary() }]}>
      <TaskScreenContent
        visible={true}
        values={values}
        onChange={onChange}
        onClose={handleClose}
        hasChanges={hasChanges}
        onCreate={handleCreate}
        isCreating={isCreating}
        createError={createError ?? undefined}
        subtasks={subtasks}
        onSubtaskToggle={handleSubtaskToggle}
        onSubtaskDelete={handleSubtaskDelete}
        onSubtaskTitleChange={handleSubtaskTitleChange}
        onSubtaskFinishEditing={handleSubtaskFinishEditing}
        onCreateSubtask={handleCreateSubtask}
        pendingFocusSubtaskId={pendingFocusSubtaskId}
        onClearPendingFocus={() => setPendingFocusSubtaskId(null)}
        embedHeaderButtons={true}
        renderCloseButton={false}
        saveButtonBottomInsetWhenKeyboardHidden={44}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
