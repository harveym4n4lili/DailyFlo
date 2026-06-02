/**
 * ios-only native bottom Stack.Toolbar for task selection routes (full width, system safe area).
 * must render from a page component (not _layout) per expo-router. actions from useTaskBulkSelectionActions.
 * same four icon actions for today, planner, and browse task-select; dismiss via header close (Stack.Toolbar left).
 */

import React from 'react';
import { Platform, Pressable } from 'react-native';
import { Stack } from 'expo-router';

import { useThemeColors } from '@/hooks/useColorPalette';
import { useTaskBulkSelectionActions } from '@/hooks/useTaskBulkSelectionActions';
import { useUI } from '@/store/hooks';
import { CompletedTasksIcon } from '@/components/ui/Icon';

export function IosTaskSelectionBottomToolbar() {
  const themeColors = useThemeColors();
  const { selection } = useUI();
  const { hasSelection, handleComplete, handleDelete, handleMove } = useTaskBulkSelectionActions();

  if (Platform.OS !== 'ios') return null;
  if (!selection.isSelectionMode || selection.selectionType !== 'tasks') return null;

  const tint = themeColors.text.primary();
  const actionIconTint = hasSelection ? tint : themeColors.text.secondary();

  const complete = () => {
    if (hasSelection) void handleComplete();
  };
  const move = () => {
    if (hasSelection) handleMove();
  };
  const del = () => {
    if (hasSelection) handleDelete();
  };

  return (
    <Stack.Toolbar>
      <Stack.Toolbar.Spacer />
      <Stack.Toolbar.View>
        <Pressable
          onPress={complete}
          accessibilityLabel="Complete selected tasks"
          accessibilityRole="button"
          hitSlop={8}
          style={{ padding: 4, justifyContent: 'center', alignItems: 'center' }}
        >
          <CompletedTasksIcon size={22} color={actionIconTint} />
        </Pressable>
      </Stack.Toolbar.View>
      <Stack.Toolbar.Button
        icon="calendar"
        tintColor={actionIconTint}
        onPress={move}
        accessibilityLabel="Change date for selected tasks"
      />
      <Stack.Toolbar.Button
        icon="arrowshape.turn.up.right"
        tintColor={actionIconTint}
        onPress={move}
        accessibilityLabel="Move selected tasks"
      />
      <Stack.Toolbar.Button
        icon="trash"
        tintColor={actionIconTint}
        onPress={del}
        accessibilityLabel="Delete selected tasks"
      />
      <Stack.Toolbar.Spacer />
    </Stack.Toolbar>
  );
}
