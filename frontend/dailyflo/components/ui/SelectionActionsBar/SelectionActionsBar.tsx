/**
 * SelectionActionsBar - bottom bar that replaces the tab bar when in selection mode.
 * Shows Cancel, Delete, and Move actions for bulk operations on selected tasks.
 * Uses Redux selection state (selectedItems, selectionType) and dispatches actions.
 * On iOS: uses GlassView for liquid glass effect (matches Todoist-style translucent bar).
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import GlassView from 'expo-glass-effect/build/GlassView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useThemeColors, useSemanticColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { useUI } from '@/store/hooks';
import { useAppDispatch } from '@/store';
import { deleteTask, updateTask } from '@/store/slices/tasks/tasksSlice';
import { getBaseTaskId } from '@/utils/recurrenceUtils';
import { store } from '@/store';
import { useRouter } from 'expo-router';
import { useCreateTaskDraft } from '@/app/task/CreateTaskDraftContext';
import { Paddings } from '@/constants/Paddings';

export interface SelectionActionsBarProps {
  /** optional: when provided, Move opens date-select and applies to all selected tasks */
  onMoveComplete?: (date: string) => void;
}

export function SelectionActionsBar({ onMoveComplete }: SelectionActionsBarProps) {
  const insets = useSafeAreaInsets();
  const themeColors = useThemeColors();
  const semanticColors = useSemanticColors();
  const typography = useTypography();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { setDraft, registerOverdueReschedule, clearOverdueReschedule } = useCreateTaskDraft();

  // selection state from Redux - drives visibility and action availability
  const { selection, exitSelectionMode, clearSelection } = useUI();
  const { isSelectionMode, selectedItems, selectionType } = selection;

  const styles = React.useMemo(
    () => createStyles(themeColors, semanticColors, typography, insets),
    [themeColors, semanticColors, typography, insets]
  );

  // get unique base task ids for delete/move (recurring occurrences share base id)
  const baseTaskIds = React.useMemo(() => {
    const ids = new Set<string>();
    selectedItems.forEach((id) => ids.add(getBaseTaskId(id)));
    return Array.from(ids);
  }, [selectedItems]);

  const selectedCount = selectedItems.length;
  const hasSelection = selectedCount > 0;

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    clearOverdueReschedule(); // clear any pending move callback if user opened date-select then backed out
    exitSelectionMode();
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
          exitSelectionMode();
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

  const barContent = (
    <View style={styles.content}>
        <TouchableOpacity
          style={styles.button}
          onPress={handleCancel}
          activeOpacity={0.7}
          accessibilityLabel="Cancel selection"
          accessibilityRole="button"
        >
          <Text style={[styles.cancelText, { color: themeColors.text.primary() }]}>Cancel</Text>
        </TouchableOpacity>

        <View style={styles.center}>
          <Text style={[styles.countText, { color: themeColors.text.secondary() }]}>
            {selectedCount} selected
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, !hasSelection && styles.actionButtonDisabled]}
            onPress={handleMove}
            disabled={!hasSelection}
            activeOpacity={0.7}
            accessibilityLabel="Move selected tasks"
            accessibilityRole="button"
          >
            <Ionicons
              name="calendar-outline"
              size={22}
              color={hasSelection ? themeColors.text.primary() : themeColors.text.tertiary()}
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
              size={22}
              color={hasSelection ? semanticColors.error() : themeColors.text.tertiary()}
            />
          </TouchableOpacity>
        </View>
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
  typography: ReturnType<typeof useTypography>,
  insets: ReturnType<typeof useSafeAreaInsets>
) {
  return StyleSheet.create({
    container: {
      position: 'absolute',
      left: 4,
      right: 4,
      borderRadius: 20,
      // overflow visible on iOS so liquid glass highlight animation can expand; hidden on Android for solid bg
      overflow: Platform.OS === 'ios' ? 'visible' : 'hidden',
      
      justifyContent: 'center',
      // android: solid background; ios: GlassView provides translucent liquid glass
      backgroundColor: Platform.OS === 'ios' ? 'transparent' : themeColors.background.primary(),
      borderWidth: Platform.OS === 'ios' ? 0 : 1,
      borderColor: themeColors.border.secondary(),
      paddingHorizontal: 16,
      zIndex: 100,
    },
    glassWrapper: {
      minHeight: 52,
      justifyContent: 'center',
      paddingHorizontal: 16,
      borderRadius: 35,
      // overflow visible lets the liquid glass highlight animation expand beyond bounds on press
      overflow: 'visible',
      minHeight: 64,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    button: {
      paddingVertical: 8,
      paddingHorizontal: 4,
      minWidth: 70,
      justifyContent: 'center',
    },
    cancelText: {
      ...typography.getTextStyle('body-large'),
      fontWeight: '500',
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    countText: {
      ...typography.getTextStyle('body-medium'),
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
    },
    actionButton: {
      padding: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    actionButtonDisabled: {
      opacity: 0.5,
    },
  });
}
