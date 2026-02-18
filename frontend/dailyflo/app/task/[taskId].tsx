/**
 * Task view/edit – form sheet with indent (same as before).
 * Presentation is formSheet/modal set on root Stack in app/_layout.tsx.
 */

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { deleteTask } from '@/store/slices/tasks/tasksSlice';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useAppDispatch } from '@/store';
import { updateTask, fetchTasks, createTask } from '@/store/slices/tasks/tasksSlice';
import { useTasks } from '@/store/hooks';
import { TaskScreenContent } from '@/components/features/tasks/TaskScreen/TaskScreenContent';
import type { TaskFormValues } from '@/components/forms/TaskForm/TaskValidation';
import type { PriorityLevel, RoutineType, TaskColor, Subtask as TaskSubtask } from '@/types';
import type { Subtask } from '@/components/features/subtasks';
import { validateAll } from '@/components/forms/TaskForm/TaskValidation';
import { useCreateTaskDraft } from '@/app/task/CreateTaskDraftContext';
import { useDuplicateTask } from '@/app/task/DuplicateTaskContext';
import { isRecurringTask } from '@/utils/recurrenceUtils';

function taskToFormSubtasks(metaSubtasks?: { id: string; title: string; isCompleted: boolean; sortOrder?: number }[]): Subtask[] {
  if (!metaSubtasks?.length) return [];
  return metaSubtasks
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((s) => ({ id: s.id, title: s.title, isCompleted: s.isCompleted, isEditing: false }));
}

export default function TaskEditScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ taskId: string; occurrenceDate?: string }>();
  const themeColors = useThemeColors();
  const { themeColor } = useThemeColor();
  const dispatch = useAppDispatch();
  const { tasks, isUpdating, updateError } = useTasks();
  const { draft, setDraft, setDueDate, setTime, setDuration, setAlerts } = useCreateTaskDraft();
  const { setDuplicateData } = useDuplicateTask();

  const taskId = params.taskId;
  const task = taskId ? tasks.find((t) => t.id === taskId) : null;

  const [localValues, setLocalValues] = useState<Partial<TaskFormValues>>(() => {
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
    return {};
  });
  const [subtasks, setSubtasks] = useState<Subtask[]>(() => (task?.metadata?.subtasks ? taskToFormSubtasks(task.metadata.subtasks) : []));
  const [pendingFocusSubtaskId, setPendingFocusSubtaskId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const initialValuesRef = useRef<{ values: Partial<TaskFormValues>; subtasks: Subtask[] } | null>(null);
  const initialDraftSyncedRef = useRef(false);
  const prevAutoSaveDraftRef = useRef<string>('');

  if (taskId && task && !initialValuesRef.current) {
    initialValuesRef.current = {
      values: {
        title: task.title,
        description: task.description || '',
        dueDate: task.dueDate ?? '',
        time: task.time,
        duration: task.duration,
        color: task.color,
        icon: task.icon,
        listId: task.listId ?? undefined,
        priorityLevel: task.priorityLevel,
        routineType: task.routineType,
        alerts: (task.metadata as any)?.reminders?.map((r: { id: string }) => r.id) ?? [],
      },
      subtasks: taskToFormSubtasks(task.metadata?.subtasks),
    };
  }

  useEffect(() => {
    if (!taskId) return;
    const t = tasks.find((t) => t.id === taskId);
    if (!t) {
      dispatch(fetchTasks());
      return;
    }
    const effectiveDueDate = params.occurrenceDate && isRecurringTask(t)
      ? (t.time
        ? (() => {
            const [h, m] = t.time.split(':').map(Number);
            const d = new Date(params.occurrenceDate! + 'T12:00:00');
            d.setHours(h, m ?? 0, 0, 0);
            return d.toISOString();
          })()
        : params.occurrenceDate + 'T12:00:00.000Z')
      : (t.dueDate ?? new Date().toISOString());
    initialDraftSyncedRef.current = false;
    setDraft({
      dueDate: effectiveDueDate,
      time: t.time,
      duration: t.duration,
      alerts: (t.metadata as any)?.reminders?.map((r: { id: string }) => r.id) ?? [],
    });
    setLocalValues({
      title: t.title,
      description: t.description || '',
      dueDate: effectiveDueDate,
      priorityLevel: t.priorityLevel,
      color: t.color,
      icon: t.icon,
      routineType: t.routineType,
      listId: t.listId ?? undefined,
      time: t.time,
      duration: t.duration,
      alerts: (t.metadata as any)?.reminders?.map((r: { id: string }) => r.id) ?? [],
    });
    setSubtasks(taskToFormSubtasks(t.metadata?.subtasks));
    if (!initialValuesRef.current) {
      initialValuesRef.current = {
        values: { title: t.title, description: t.description || '', dueDate: effectiveDueDate ?? t.dueDate ?? '', time: t.time, duration: t.duration, color: t.color, icon: t.icon, listId: t.listId ?? undefined, priorityLevel: t.priorityLevel, routineType: t.routineType, alerts: (t.metadata as any)?.reminders?.map((r: { id: string }) => r.id) ?? [] },
        subtasks: taskToFormSubtasks(t.metadata?.subtasks),
      };
    }
  }, [taskId, params.occurrenceDate, tasks, dispatch, setDraft]);

  useEffect(() => {
    if (!taskId || !task) return;
    if (!initialDraftSyncedRef.current) {
      initialDraftSyncedRef.current = true;
      return;
    }
    const taskAlerts = (task.metadata as any)?.reminders?.map((r: { id: string }) => r.id) ?? [];
    const taskDueDate = task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : '';
    const draftDueDate = draft.dueDate ? new Date(draft.dueDate).toISOString().slice(0, 10) : '';
    const draftChanged =
      draftDueDate !== taskDueDate ||
      (draft.time ?? '') !== (task.time ?? '') ||
      (draft.duration ?? 0) !== (task.duration ?? 0) ||
      JSON.stringify(draft.alerts ?? []) !== JSON.stringify(taskAlerts);
    if (!draftChanged) return;
    const draftKey = `${draft.dueDate}|${draft.time}|${draft.duration}|${JSON.stringify(draft.alerts ?? [])}`;
    if (prevAutoSaveDraftRef.current === draftKey) return;
    prevAutoSaveDraftRef.current = draftKey;
    const dueDateToSave = draft.dueDate ?? task.dueDate ?? new Date().toISOString();
    dispatch(
      updateTask({
        id: taskId,
        updates: {
          id: taskId,
          dueDate: dueDateToSave,
          time: draft.time ?? undefined,
          duration: draft.duration ?? undefined,
          metadata: {
            ...(task.metadata ?? {}),
            reminders: (draft.alerts ?? []).map((id) => ({ id, type: 'custom' as const, scheduledTime: new Date(), isEnabled: true })),
          },
        },
      })
    );
  }, [taskId, draft.dueDate, draft.time, draft.duration, draft.alerts, task, dispatch]);

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

  const handleRoutineTypeChange = useCallback(
    (routineType: RoutineType) => {
      setLocalValues((prev) => ({ ...prev, routineType }));
      if (taskId) {
        dispatch(updateTask({ id: taskId, updates: { id: taskId, routineType } }));
      }
    },
    [taskId, dispatch],
  );

  const onChange = <K extends keyof TaskFormValues>(key: K, v: TaskFormValues[K]) => {
    setValidationError(null);
    if (key === 'dueDate') setDueDate(v as string);
    else if (key === 'time') setTime(v as string | undefined);
    else if (key === 'duration') setDuration(v as number | undefined);
    else if (key === 'alerts') setAlerts((v as string[]) ?? []);
    else if (key === 'routineType') handleRoutineTypeChange(v as RoutineType);
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
    setSubtasks((prev) => prev.map((s) => (s.id === subtaskId ? { ...s, title: newTitle } : s)));
  };
  const handleSubtaskFinishEditing = (subtaskId: string) => {
    setSubtasks((prev) => prev.map((s) => (s.id === subtaskId ? { ...s, isEditing: false } : s)));
  };
  const handleSubtaskToggle = (subtaskId: string) => {
    setSubtasks((prev) => prev.map((s) => (s.id === subtaskId ? { ...s, isCompleted: !s.isCompleted } : s)));
  };
  const handleSubtaskDelete = (subtaskId: string) => {
    setSubtasks((prev) => prev.filter((s) => s.id !== subtaskId));
  };

  const hasChanges = useMemo(() => {
    if (!initialValuesRef.current) return false;
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
      (v.color ?? '') !== (init.values.color ?? '') ||
      (v.icon ?? '') !== (init.values.icon ?? '') ||
      (v.listId ?? '') !== (init.values.listId ?? '') ||
      (v.priorityLevel ?? 3) !== (init.values.priorityLevel ?? 3) ||
      subtasksChanged
    );
  }, [values, subtasks]);

  const isSaveButtonVisible = hasChanges;

  const handleSave = async () => {
    const errors = validateAll(values as TaskFormValues);
    if (Object.keys(errors).length > 0) {
      setValidationError(errors.title ?? Object.values(errors).filter(Boolean)[0] ?? 'Please fix the form errors');
      return;
    }
    setValidationError(null);

    const taskSubtasks: TaskSubtask[] = subtasks.map((st, index) => ({
      id: st.id,
      title: st.title,
      isCompleted: st.isCompleted,
      sortOrder: index,
    }));

    const occurrenceDate = params.occurrenceDate ?? (values.dueDate ? new Date(values.dueDate).toISOString().slice(0, 10) : null);
    const isRecurring = task && isRecurringTask(task);

    const performUpdateAll = async () => {
      const result = await dispatch(
        updateTask({
          id: taskId!,
          updates: {
            id: taskId!,
            title: values.title!.trim(),
            description: values.description?.trim() || undefined,
            icon: values.icon && values.icon.trim() ? values.icon.trim() : undefined,
            time: values.time || undefined,
            duration: values.duration ?? undefined,
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
    };

    const performUpdateThisInstanceOnly = async () => {
      if (!occurrenceDate) return;
      try {
        const oneOffDueDate = values.time
          ? (() => {
              const [h, m] = values.time!.split(':').map(Number);
              const d = new Date(occurrenceDate + 'T12:00:00');
              d.setHours(h, m ?? 0, 0, 0);
              return d.toISOString();
            })()
          : occurrenceDate + 'T12:00:00.000Z';
        const createResult = await dispatch(
          createTask({
            title: values.title!.trim(),
            description: values.description?.trim() || undefined,
            icon: values.icon && values.icon.trim() ? values.icon.trim() : undefined,
            time: values.time || undefined,
            duration: values.duration ?? undefined,
            dueDate: oneOffDueDate,
            priorityLevel: values.priorityLevel || 3,
            color: values.color || themeColor,
            routineType: 'once',
            listId: values.listId || undefined,
            metadata: {
              subtasks: taskSubtasks,
              reminders: (values.alerts ?? []).map((id) => ({ id, type: 'custom' as const, scheduledTime: new Date(), isEnabled: true })),
              notes: values.description?.trim() || undefined,
              tags: [],
            },
          })
        );
        if (!createTask.fulfilled.match(createResult)) return;
        const baseTask = tasks.find((t) => t.id === taskId);
        const existing = (baseTask?.metadata as any)?.recurrence_exceptions ?? [];
        const newExceptions = existing.includes(occurrenceDate) ? existing : [...existing, occurrenceDate];
        await dispatch(
          updateTask({
            id: taskId!,
            updates: {
              id: taskId!,
              metadata: { ...(baseTask?.metadata ?? {}), recurrence_exceptions: newExceptions },
            },
          })
        );
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        router.back();
      } catch (e) {
        console.error('Unexpected error updating this occurrence:', e);
      }
    };

    try {
      if (isRecurring && occurrenceDate) {
        Alert.alert(
          'Update recurring task',
          'Do you want to update this occurrence only, or all future occurrences?',
          [
            { text: 'This occurrence only', onPress: performUpdateThisInstanceOnly },
            { text: 'All occurrences', onPress: performUpdateAll },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
      } else {
        await performUpdateAll();
      }
    } catch (e) {
      console.error('Unexpected error updating task:', e);
    }
  };

  const closingRef = useRef(false);
  const handleClose = () => {
    if (closingRef.current) return;
    closingRef.current = true;
    setTimeout(() => router.back(), 100);
  };

  const handleDeleteTask = useCallback(() => {
    Alert.alert(
      'Delete Task',
      `Are you sure you want to delete "${task?.title ?? 'this task'}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteTask(taskId)).unwrap();
              router.back();
            } catch (e) {
              console.error('Failed to delete task:', e);
            }
          },
        },
      ]
    );
  }, [taskId, task?.title, dispatch, router]);

  // duplicate: close task view, open task-create with current task data pre-filled (no API call - user edits then saves)
  const handleDuplicateTask = useCallback(() => {
    setDuplicateData({
      values: {
        title: values.title,
        description: values.description,
        dueDate: values.dueDate,
        time: values.time,
        duration: values.duration,
        priorityLevel: values.priorityLevel,
        color: values.color,
        icon: values.icon,
        routineType: values.routineType,
        listId: values.listId,
        alerts: values.alerts,
      },
      subtasks: subtasks.map((s) => ({
        id: `subtask-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        title: s.title,
        isCompleted: false,
        isEditing: false,
      })),
    });
    router.replace('/task-create');
  }, [values, subtasks, setDuplicateData, router]);

  const pickerHandlers = useMemo(
    () => ({
      onShowDatePicker: () => router.push('/date-select'),
      onShowTimeDurationPicker: () => router.push('/time-duration-select'),
      onShowAlertsPicker: () => router.push('/alert-select'),
    }),
    [router],
  );

  if (!taskId || !task) {
    return null;
  }

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
        saveButtonText="Save"
        saveLoadingText="Saving..."
        isCreating={isUpdating}
        updateError={updateError ?? undefined}
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
        isEditMode={true}
        saveButtonBottomInsetWhenKeyboardHidden={44}
        pickerHandlers={pickerHandlers}
        onActivityLog={() => {}}
        onDuplicateTask={handleDuplicateTask}
        onDeleteTask={handleDeleteTask}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
