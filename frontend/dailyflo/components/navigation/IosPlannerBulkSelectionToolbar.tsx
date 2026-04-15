/**
 * ios-only: native header Stack.Toolbar for planner bulk selection (complete / date / move / delete).
 * mounts only when planner has task selection so the stack screen picks up unstable_headerRightItems.
 */

import React, { useMemo } from 'react';
import { Alert, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { useAppDispatch } from '@/store';
import { store } from '@/store';
import { useUI } from '@/store/hooks';
import { deleteTask, updateTask } from '@/store/slices/tasks/tasksSlice';
import { getBaseTaskId, getOccurrenceDateFromId, isExpandedRecurrenceId } from '@/utils/recurrenceUtils';
import { useCreateTaskDraft } from '@/app/task/CreateTaskDraftContext';
import { useThemeColors } from '@/hooks/useColorPalette';
import {
  STACK_TOOLBAR_COMPLETE,
  STACK_TOOLBAR_MOVE,
  STACK_TOOLBAR_OVERFLOW,
  STACK_TOOLBAR_PLANNER_DASHBOARD,
  STACK_TOOLBAR_SCHEDULE,
} from '@/constants/stackToolbarIcons';

export function IosPlannerBulkSelectionToolbar() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const themeColors = useThemeColors();
  const { selection, exitSelectionMode } = useUI();
  const { setDraft, registerOverdueReschedule, clearOverdueReschedule } = useCreateTaskDraft();
  const toolbarTint = themeColors.text.primary();

  const { isSelectionMode, selectedItems, selectionType } = selection;
  const baseTaskIds = useMemo(() => {
    const ids = new Set<string>();
    selectedItems.forEach((id) => ids.add(getBaseTaskId(id)));
    return Array.from(ids);
  }, [selectedItems]);
  const hasSelection = selectedItems.length > 0;

  const handleComplete = async () => {
    if (!hasSelection) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const tasksFromStore = store.getState().tasks.tasks;
    try {
      for (const itemId of selectedItems) {
        if (isExpandedRecurrenceId(itemId)) {
          const baseId = getBaseTaskId(itemId);
          const occurrenceDate = getOccurrenceDateFromId(itemId);
          if (!occurrenceDate) continue;
          const baseTask = tasksFromStore.find((t: any) => t.id === baseId);
          if (!baseTask) continue;
          const completions = baseTask.metadata?.recurrence_completions ?? [];
          const newCompletions = completions.includes(occurrenceDate)
            ? completions
            : [...completions, occurrenceDate];
          await dispatch(
            updateTask({
              id: baseId,
              updates: {
                id: baseId,
                metadata: { ...baseTask.metadata, recurrence_completions: newCompletions },
              },
            }),
          ).unwrap();
        } else {
          await dispatch(
            updateTask({
              id: itemId,
              updates: { id: itemId, isCompleted: true },
            }),
          ).unwrap();
        }
      }
      exitSelectionMode();
    } catch (err) {
      console.error('Failed to bulk complete tasks:', err);
    }
  };

  const handleDelete = () => {
    if (!hasSelection) return;
    const count = baseTaskIds.length;
    const message =
      count === 1
        ? 'Delete this task? This cannot be undone.'
        : `Delete ${count} tasks? This cannot be undone.`;
    Alert.alert('Delete Tasks', message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          baseTaskIds.forEach((id) => dispatch(deleteTask(id)));
          exitSelectionMode();
        },
      },
    ]);
  };

  const handleMove = () => {
    if (!hasSelection) return;
    const firstId = selectedItems[0];
    const tasksFromStore = store.getState().tasks.tasks;
    const firstTask = tasksFromStore.find(
      (t: any) => t.id === getBaseTaskId(firstId) || t.id === firstId,
    );
    const initialDate = firstTask?.dueDate ?? new Date().toISOString();
    setDraft({ dueDate: initialDate, time: undefined, duration: undefined, alerts: [] });
    registerOverdueReschedule((date) => {
      (async () => {
        try {
          await Promise.all(
            baseTaskIds.map((id) => dispatch(updateTask({ id, updates: { id, dueDate: date } }))),
          );
          clearOverdueReschedule();
          exitSelectionMode();
        } catch (err) {
          console.error('Failed to bulk move tasks:', err);
        }
      })();
    });
    router.push('/date-select');
  };

  if (
    Platform.OS !== 'ios' ||
    !isSelectionMode ||
    selectionType !== 'tasks' ||
    !hasSelection
  ) {
    return null;
  }

  return (
    <Stack.Toolbar placement="right">
      <Stack.Toolbar.Button
        icon={STACK_TOOLBAR_PLANNER_DASHBOARD}
        iconRenderingMode="template"
        tintColor={toolbarTint}
        onPress={() => {}}
        accessibilityLabel="Dashboard"
      />
      <Stack.Toolbar.Menu
        icon={STACK_TOOLBAR_OVERFLOW}
        iconRenderingMode="template"
        tintColor={toolbarTint}
      >
        <Stack.Toolbar.MenuAction
          icon={STACK_TOOLBAR_COMPLETE}
          iconRenderingMode="template"
          onPress={() => void handleComplete()}
        >
          Complete tasks
        </Stack.Toolbar.MenuAction>
        <Stack.Toolbar.MenuAction
          icon={STACK_TOOLBAR_SCHEDULE}
          iconRenderingMode="template"
          onPress={handleMove}
        >
          Change date
        </Stack.Toolbar.MenuAction>
        <Stack.Toolbar.MenuAction
          icon={STACK_TOOLBAR_MOVE}
          iconRenderingMode="template"
          onPress={handleMove}
        >
          Move task
        </Stack.Toolbar.MenuAction>
        <Stack.Toolbar.MenuAction destructive onPress={handleDelete}>
          Delete tasks
        </Stack.Toolbar.MenuAction>
      </Stack.Toolbar.Menu>
    </Stack.Toolbar>
  );
}
