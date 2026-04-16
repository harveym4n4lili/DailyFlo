/**
 * SelectionActionsBar - bottom bar that replaces the tab bar when in selection mode.
 * Today: 4 icon-only actions. Planner: Cancel + count (ios bulk actions use Stack.Toolbar on planner).
 * Uses Redux selection state (selectedItems, selectionType) and dispatches actions.
 * On iOS: uses GlassView for liquid glass effect (matches Todoist-style translucent bar).
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import GlassView from 'expo-glass-effect/build/GlassView';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useThemeColors, useSemanticColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { useUI } from '@/store/hooks';
import { useAppDispatch } from '@/store';
import { deleteTask, updateTask } from '@/store/slices/tasks/tasksSlice';
import { getBaseTaskId, isExpandedRecurrenceId, getOccurrenceDateFromId } from '@/utils/recurrenceUtils';
import { store } from '@/store';
import { usePathname, useRouter } from 'expo-router';
import { useCreateTaskDraft } from '@/app/task/CreateTaskDraftContext';

export interface SelectionActionsBarProps {
  /** optional: when provided, Move opens date-select and applies to all selected tasks */
  onMoveComplete?: (date: string) => void;
  /** which tab screen is currently active - allows tweaking behavior for Today vs Planner */
  screen?: 'today' | 'planner' | 'other';
}

export function SelectionActionsBar({ onMoveComplete, screen }: SelectionActionsBarProps) {
  const themeColors = useThemeColors();
  const semanticColors = useSemanticColors();
  const typography = useTypography();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname() ?? '';
  const { setDraft, registerOverdueReschedule, clearOverdueReschedule } = useCreateTaskDraft();

  // selection state from Redux - drives visibility and action availability
  const { selection, exitSelectionMode } = useUI();
  const { isSelectionMode, selectedItems, selectionType } = selection;

  const styles = React.useMemo(
    () => createStyles(themeColors, semanticColors, typography),
    [themeColors, semanticColors, typography]
  );

  // get unique base task ids for delete/move (recurring occurrences share base id)
  const baseTaskIds = React.useMemo(() => {
    const ids = new Set<string>();
    selectedItems.forEach((id) => ids.add(getBaseTaskId(id)));
    return Array.from(ids);
  }, [selectedItems]);

  const selectedCount = selectedItems.length;
  const hasSelection = selectedCount > 0;

  const onRouteSelectScreen =
    pathname.includes('/today/select') ||
    pathname.includes('/planner/select') ||
    pathname.includes('/browse/task-select');

  const dismissSelectionFlow = () => {
    if (onRouteSelectScreen) {
      router.back();
    } else {
      exitSelectionMode();
    }
  };

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    clearOverdueReschedule();
    dismissSelectionFlow();
  };

  // complete all selected tasks - marks as done; handles recurring occurrences via recurrence_completions
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
            })
          ).unwrap();
        } else {
          await dispatch(
            updateTask({
              id: itemId,
              updates: { id: itemId, isCompleted: true },
            })
          ).unwrap();
        }
      }
      dismissSelectionFlow();
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
          dismissSelectionFlow();
        },
      },
    ]);
  };

  const handleMove = () => {
    if (!hasSelection) return;

    // use first task's due date as initial, or today
    const firstId = selectedItems[0];
    const tasksFromStore = store.getState().tasks.tasks;
    const firstTask = tasksFromStore.find(
      (t: any) => t.id === getBaseTaskId(firstId) || t.id === firstId
    );
    const initialDate = firstTask?.dueDate ?? new Date().toISOString();

    setDraft({ dueDate: initialDate, time: undefined, duration: undefined, alerts: [] });

    // register callback - date-select will invoke this when user picks a date
    registerOverdueReschedule((date) => {
      (async () => {
        try {
          await Promise.all(
            baseTaskIds.map((id) =>
              dispatch(updateTask({ id, updates: { id, dueDate: date } }))
            )
          );
          clearOverdueReschedule();
          dismissSelectionFlow();
        } catch (err) {
          console.error('Failed to bulk move tasks:', err);
        }
      })();
    });

    router.push('/date-select');
  };

  if (!isSelectionMode || selectionType !== 'tasks') return null;

  // on iOS: wrap in GlassView for liquid glass (translucent bar overlaying content)
  // on Android: use solid background
  const tintColor = themeColors.background.primary();

  // icon colors for both Today and Planner selection bar
  // active: solid white; disabled: semi-transparent white
  const iconColorActive = '#FFFFFF';
  const iconColorDisabled = 'rgba(255,255,255,0.5)';
  const deleteIconColorActive = iconColorActive;

  const barContent =
    screen === 'planner' ? (
      <View style={styles.contentPlanner}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancel}
          activeOpacity={0.7}
          accessibilityLabel="Cancel selection"
          accessibilityRole="button"
        >
          <Text style={[styles.cancelText, { color: iconColorActive }]}>Cancel</Text>
        </TouchableOpacity>
        <View style={styles.center}>
          <Text style={[styles.countText, { color: iconColorActive }]}>
            {selectedCount} selected
          </Text>
        </View>
        <View style={styles.plannerToolbarSpacer} pointerEvents="none" />
      </View>
    ) : (
      <View style={styles.content}>
        <TouchableOpacity
          style={[styles.actionButton, !hasSelection && styles.actionButtonDisabled]}
          onPress={handleComplete}
          disabled={!hasSelection}
          activeOpacity={0.7}
          accessibilityLabel="Complete selected tasks"
          accessibilityRole="button"
        >
          <Ionicons
            name="checkmark-done-outline"
            size={24}
            color={hasSelection ? iconColorActive : iconColorDisabled}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, !hasSelection && styles.actionButtonDisabled]}
          onPress={handleMove}
          disabled={!hasSelection}
          activeOpacity={0.7}
          accessibilityLabel="Change date for selected tasks"
          accessibilityRole="button"
        >
          <Ionicons
            name="calendar-outline"
            size={24}
            color={hasSelection ? iconColorActive : iconColorDisabled}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, !hasSelection && styles.actionButtonDisabled]}
          onPress={handleMove}
          disabled={!hasSelection}
          activeOpacity={0.7}
          accessibilityLabel="Move selected tasks"
          accessibilityRole="button"
        >
          <Ionicons
            name="arrow-redo-outline"
            size={24}
            color={hasSelection ? iconColorActive : iconColorDisabled}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, !hasSelection && styles.actionButtonDisabled]}
          onPress={handleDelete}
          disabled={!hasSelection}
          activeOpacity={0.7}
          accessibilityLabel="Delete selected tasks"
          accessibilityRole="button"
        >
          <Ionicons
            name="trash-outline"
            size={24}
            color={hasSelection ? deleteIconColorActive : iconColorDisabled}
          />
        </TouchableOpacity>
      </View>
    );

  return (
    <View style={[styles.container, { bottom: 20}]}>
      {Platform.OS === 'ios' ? (
        <GlassView
          style={styles.glassWrapper}
          glassEffectStyle="regular"
          tintColor={tintColor as any}
          isInteractive
        >
          {barContent}
        </GlassView>
      ) : (
        barContent
      )}
    </View>
  );
}

function createStyles(
  themeColors: ReturnType<typeof useThemeColors>,
  semanticColors: ReturnType<typeof useSemanticColors>,
  typography: ReturnType<typeof useTypography>
) {
  return StyleSheet.create({
    container: {
      position: 'absolute',
      left: 4,
      right: 4,
      borderRadius: 20,
      overflow: Platform.OS === 'ios' ? 'visible' : 'hidden',
      justifyContent: 'center',
      backgroundColor: Platform.OS === 'ios' ? 'transparent' : themeColors.background.primary(),
      borderWidth: Platform.OS === 'ios' ? 0 : 1,
      borderColor: themeColors.border.secondary(),
      paddingHorizontal: 16,
      zIndex: 100,
    },
    glassWrapper: {
      minHeight: 64,
      justifyContent: 'center',
      paddingHorizontal: 16,
      borderRadius: 35,
      overflow: 'visible',
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-evenly',
      gap: 8,
    },
    contentPlanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    countText: {
      ...typography.getTextStyle('body-medium'),
    },
    plannerToolbarSpacer: {
      width: 60,
      marginLeft: 'auto',
    },
    cancelButton: {
      paddingVertical: 8,
      paddingHorizontal: 4,
      minWidth: 70,
      justifyContent: 'center',
    },
    cancelText: {
      ...typography.getTextStyle('body-large'),
      fontWeight: '500',
    },
    actionButton: {
      padding: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    actionButtonDisabled: {
      opacity: 0.5,
    },
  });
}
