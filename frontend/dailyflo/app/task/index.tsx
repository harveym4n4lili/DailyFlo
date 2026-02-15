/**
 * Task – main form screen (first screen in task stack)
 *
 * Supports create mode (no taskId) and edit mode (taskId param).
 * Uses CreateTaskDraftContext for dueDate, time, duration, alerts so date-select,
 * time-duration-select and alert-select stay in sync.
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useAppDispatch } from '@/store';
import { createTask, updateTask } from '@/store/slices/tasks/tasksSlice';
import { useTasks } from '@/store/hooks';
import { TaskScreenContent } from '@/components/features/tasks/TaskScreen/TaskScreenContent';
import type { TaskFormValues } from '@/components/forms/TaskForm/TaskValidation';
import type { PriorityLevel, RoutineType, CreateTaskInput, TaskColor, Subtask as TaskSubtask } from '@/types';
import type { Subtask } from '@/components/features/subtasks';
import { validateAll } from '@/components/forms/TaskForm/TaskValidation';
import { useCreateTaskDraft } from './CreateTaskDraftContext';

const getDefaults = (themeColor: TaskColor = 'red'): TaskFormValues => ({
  title: '',
  description: '',
  dueDate: new Date().toISOString(),
  priorityLevel: 3 as PriorityLevel,
  color: themeColor,
  icon: undefined, // no default icon - tasks don't require icons
  routineType: 'once' as RoutineType,
  listId: undefined,
  alerts: [],
});

// map Task metadata subtasks to form Subtask (add isEditing)
function taskToFormSubtasks(metaSubtasks?: { id: string; title: string; isCompleted: boolean; sortOrder?: number }[]): Subtask[] {
  if (!metaSubtasks?.length) return [];
  return metaSubtasks
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((s) => ({ id: s.id, title: s.title, isCompleted: s.isCompleted, isEditing: false }));
}

export default function TaskIndexScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ dueDate?: string; taskId?: string }>();
  const themeColors = useThemeColors();
  const { themeColor } = useThemeColor();
  const dispatch = useAppDispatch();
  const { tasks, isCreating, isUpdating, createError, updateError } = useTasks();
  const { draft, setDraft, setDueDate, setTime, setDuration, setAlerts } = useCreateTaskDraft();

  const isEditMode = !!params.taskId;

  // when editing, load task from Redux; when creating, use defaults
  const [localValues, setLocalValues] = useState<Partial<TaskFormValues>>(() => {
    if (params.taskId) {
      const task = tasks.find((t) => t.id === params.taskId);
      if (task) {
        return {
          title: task.title,
          description: task.description || '',
          dueDate: task.dueDate ?? new Date().toISOString(),
          priorityLevel: task.priorityLevel,
          color: task.color,
          icon: task.icon,
          routineType: task.routineType,
          listId: task.listId ?? undefined,
          time: task.time,
          duration: task.duration ?? undefined,
          alerts: (task.metadata as any)?.reminders?.map((r: { id: string }) => r.id) ?? [],
        };
      }
    }
    return {
      ...getDefaults(themeColor),
      ...(params.dueDate ? { dueDate: params.dueDate } : {}),
    };
  });
  const [subtasks, setSubtasks] = useState<Subtask[]>(() => {
    if (params.taskId) {
      const task = tasks.find((t) => t.id === params.taskId);
      if (task?.metadata?.subtasks) return taskToFormSubtasks(task.metadata.subtasks);
    }
    return [];
  });
  const [pendingFocusSubtaskId, setPendingFocusSubtaskId] = useState<string | null>(null);

  // store initial values for edit mode hasChanges comparison
  const initialValuesRef = useRef<{ values: Partial<TaskFormValues>; subtasks: Subtask[] } | null>(null);
  if (isEditMode && params.taskId && !initialValuesRef.current) {
    const task = tasks.find((t) => t.id === params.taskId);
    if (task) {
      initialValuesRef.current = {
        values: {
          title: task.title,
          description: task.description || '',
          dueDate: task.dueDate ?? '',
          time: task.time,
          duration: task.duration,
          color: task.color,
          routineType: task.routineType,
          alerts: (task.metadata as any)?.reminders?.map((r: { id: string }) => r.id) ?? [],
        },
        subtasks: taskToFormSubtasks(task.metadata?.subtasks),
      };
    }
  }

  // load task data when in edit mode (runs when taskId or tasks changes)
  useEffect(() => {
    if (isEditMode && params.taskId) {
      const task = tasks.find((t) => t.id === params.taskId);
      if (task) {
        setDraft({
          dueDate: task.dueDate ?? new Date().toISOString(),
          time: task.time,
          duration: task.duration,
          alerts: (task.metadata as any)?.reminders?.map((r: { id: string }) => r.id) ?? [],
        });
        setLocalValues({
          title: task.title,
          description: task.description || '',
          dueDate: task.dueDate ?? new Date().toISOString(),
          priorityLevel: task.priorityLevel,
          color: task.color,
          icon: task.icon,
          routineType: task.routineType,
          listId: task.listId ?? undefined,
          time: task.time,
          duration: task.duration,
          alerts: (task.metadata as any)?.reminders?.map((r: { id: string }) => r.id) ?? [],
        });
        setSubtasks(taskToFormSubtasks(task.metadata?.subtasks));
        if (!initialValuesRef.current) {
          initialValuesRef.current = {
            values: { title: task.title, description: task.description || '', dueDate: task.dueDate ?? '', time: task.time, duration: task.duration, color: task.color, routineType: task.routineType, alerts: (task.metadata as any)?.reminders?.map((r: { id: string }) => r.id) ?? [] },
            subtasks: taskToFormSubtasks(task.metadata?.subtasks),
          };
        }
      }
    }
  }, [params.taskId, isEditMode, tasks]);

  // create mode: init draft and clear when switching to create
  useEffect(() => {
    if (!isEditMode) {
      const initialDueDate = params.dueDate ?? new Date().toISOString();
      setDraft({ dueDate: initialDueDate, time: undefined, duration: undefined, alerts: [] });
      if (params.dueDate) setLocalValues((prev) => ({ ...prev, dueDate: params.dueDate }));
      setSubtasks([]);
      initialValuesRef.current = null;
    }
  }, [params.dueDate, isEditMode]);

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
    if (key === 'dueDate') setDueDate(v as string);
    else if (key === 'time') setTime(v as string | undefined);
    else if (key === 'duration') setDuration(v as number | undefined);
    else if (key === 'alerts') setAlerts((v as string[]) ?? []);
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

  const hasChanges = useMemo(() => {
    if (isEditMode && initialValuesRef.current) {
      const init = initialValuesRef.current;
      const v = values;
      const subtasksChanged =
        subtasks.length !== init.subtasks.length ||
        subtasks.some((s, i) => {
          const o = init.subtasks[i];
          return !o || s.title !== o.title || s.isCompleted !== o.isCompleted;
        });
      return !!(
        (v.title?.trim() ?? '') !== (init.values.title ?? '') ||
        (v.description ?? '') !== (init.values.description ?? '') ||
        (v.dueDate ?? '') !== (init.values.dueDate ?? '') ||
        (v.time ?? '') !== (init.values.time ?? '') ||
        (v.duration ?? undefined) !== (init.values.duration ?? undefined) ||
        (v.color ?? '') !== (init.values.color ?? '') ||
        (v.routineType ?? '') !== (init.values.routineType ?? '') ||
        JSON.stringify(v.alerts ?? []) !== JSON.stringify(init.values.alerts ?? []) ||
        subtasksChanged
      );
    }
    return !!(
      values.title?.trim() ||
      values.description?.trim() ||
      values.dueDate !== getDefaults(themeColor).dueDate ||
      values.color !== getDefaults(themeColor).color ||
      (values.alerts && values.alerts.length > 0) ||
      values.time !== undefined ||
      values.duration !== undefined ||
      values.routineType !== getDefaults(themeColor).routineType ||
      subtasks.length > 0
    );
  }, [values, themeColor, subtasks, isEditMode]);

  // create mode: save button visible when all required fields are entered (title is required)
  // view mode: save button visible when any change is made
  const isSaveButtonVisible = isEditMode ? hasChanges : !!(values.title?.trim());

  const handleSave = async () => {
    const errors = validateAll(values as TaskFormValues);
    if (Object.keys(errors).length > 0) return;

    const taskSubtasks: TaskSubtask[] = subtasks.map((st, index) => ({
      id: st.id,
      title: st.title,
      isCompleted: st.isCompleted,
      sortOrder: index,
    }));

    if (isEditMode && params.taskId) {
      try {
        const result = await dispatch(
          updateTask({
            id: params.taskId,
            updates: {
              id: params.taskId,
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
                reminders: (values.alerts ?? []).map((id) => ({ id, type: 'custom' as const, scheduledTime: new Date(), isEnabled: true })),
                notes: values.description?.trim() || undefined,
                tags: [],
              },
            },
          })
        );
        if (updateTask.fulfilled.match(result)) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
          router.back();
        }
      } catch (e) {
        console.error('Unexpected error updating task:', e);
      }
    } else {
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
        hasChanges={hasChanges}
        isSaveButtonVisible={isSaveButtonVisible}
        onCreate={handleSave}
        saveButtonText={isEditMode ? 'Save' : 'Create'}
        saveLoadingText={isEditMode ? 'Saving...' : 'Creating...'}
        isCreating={isCreating || isUpdating}
        createError={createError ?? undefined}
        updateError={updateError ?? undefined}
        subtasks={subtasks}
        onSubtaskToggle={handleSubtaskToggle}
        onSubtaskDelete={handleSubtaskDelete}
        onSubtaskTitleChange={handleSubtaskTitleChange}
        onSubtaskFinishEditing={handleSubtaskFinishEditing}
        onCreateSubtask={handleCreateSubtask}
        pendingFocusSubtaskId={pendingFocusSubtaskId}
        onClearPendingFocus={() => setPendingFocusSubtaskId(null)}
        embedHeaderButtons={true}
        isEditMode={isEditMode}
        saveButtonBottomInsetWhenKeyboardHidden={44}
        pickerHandlers={pickerHandlers}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
