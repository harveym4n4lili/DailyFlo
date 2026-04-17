/**
 * shared bulk task actions for selection mode (complete / delete / move / dismiss).
 * used by SelectionActionsBar (android + ios planner pill), ios native bottom Stack.Toolbar, and any future callers.
 * dismiss: router.back on pushed select routes, else exitSelectionMode (in-place android).
 */

import { useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { usePathname, useRouter } from 'expo-router';

import { useCreateTaskDraft } from '@/app/task/CreateTaskDraftContext';
import { store, useAppDispatch } from '@/store';
import { useUI } from '@/store/hooks';
import { deleteTask, updateTask } from '@/store/slices/tasks/tasksSlice';
import { getBaseTaskId, getOccurrenceDateFromId, isExpandedRecurrenceId } from '@/utils/recurrenceUtils';

export function useTaskBulkSelectionActions() {
  const pathname = usePathname() ?? '';
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { selection, exitSelectionMode } = useUI();
  const { setDraft, registerOverdueReschedule, clearOverdueReschedule } = useCreateTaskDraft();

  const { selectedItems, selectionType } = selection;

  const baseTaskIds = useMemo(() => {
    const ids = new Set<string>();
    selectedItems.forEach((id) => ids.add(getBaseTaskId(id)));
    return Array.from(ids);
  }, [selectedItems]);

  const selectedCount = selectedItems.length;
  const hasSelection = selectionType === 'tasks' && selectedCount > 0;

  const onRouteSelectScreen =
    pathname.includes('/today/select') ||
    pathname.includes('/planner/select') ||
    pathname.includes('/browse/task-select');

  const dismissSelectionFlow = useCallback(() => {
    if (onRouteSelectScreen) {
      router.back();
    } else {
      exitSelectionMode();
    }
  }, [onRouteSelectScreen, router, exitSelectionMode]);

  const handleCancel = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    clearOverdueReschedule();
    dismissSelectionFlow();
  }, [clearOverdueReschedule, dismissSelectionFlow]);

  const handleComplete = useCallback(async () => {
    if (!hasSelection) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const tasksFromStore = store.getState().tasks.tasks;
    try {
      for (const itemId of selectedItems) {
        if (isExpandedRecurrenceId(itemId)) {
          const baseId = getBaseTaskId(itemId);
          const occurrenceDate = getOccurrenceDateFromId(itemId);
          if (!occurrenceDate) continue;
          const baseTask = tasksFromStore.find((t) => t.id === baseId);
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
      dismissSelectionFlow();
    } catch (err) {
      console.error('Failed to bulk complete tasks:', err);
    }
  }, [dispatch, dismissSelectionFlow, hasSelection, selectedItems]);

  const handleDelete = useCallback(() => {
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
          dismissSelectionFlow();
        },
      },
    ]);
  }, [baseTaskIds, dispatch, dismissSelectionFlow, hasSelection]);

  const handleMove = useCallback(() => {
    if (!hasSelection) return;
    const firstId = selectedItems[0];
    const tasksFromStore = store.getState().tasks.tasks;
    const firstTask = tasksFromStore.find(
      (t) => t.id === getBaseTaskId(firstId) || t.id === firstId,
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
          dismissSelectionFlow();
        } catch (err) {
          console.error('Failed to bulk move tasks:', err);
        }
      })();
    });
    router.push('/date-select' as any);
  }, [
    baseTaskIds,
    clearOverdueReschedule,
    dispatch,
    dismissSelectionFlow,
    hasSelection,
    registerOverdueReschedule,
    router,
    selectedItems,
    setDraft,
  ]);

  return {
    selectedItems,
    selectedCount,
    hasSelection,
    baseTaskIds,
    dismissSelectionFlow,
    handleCancel,
    handleComplete,
    handleDelete,
    handleMove,
  };
}
