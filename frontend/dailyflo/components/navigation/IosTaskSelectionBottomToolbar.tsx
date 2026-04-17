/**
 * ios-only native bottom Stack.Toolbar for task selection routes (full width, system safe area).
 * must render from a page component (not _layout) per expo-router. actions from useTaskBulkSelectionActions.
 */

import React from 'react';
import { Platform, Text, View } from 'react-native';
import { Stack } from 'expo-router';

import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { useTaskBulkSelectionActions } from '@/hooks/useTaskBulkSelectionActions';
import { useUI } from '@/store/hooks';

export type IosTaskSelectionBottomToolbarVariant = 'today' | 'planner';

export type IosTaskSelectionBottomToolbarProps = {
  variant: IosTaskSelectionBottomToolbarVariant;
};

export function IosTaskSelectionBottomToolbar({ variant }: IosTaskSelectionBottomToolbarProps) {
  const themeColors = useThemeColors();
  const typography = useTypography();
  const { selection } = useUI();
  const { hasSelection, selectedCount, handleCancel, handleComplete, handleDelete, handleMove } =
    useTaskBulkSelectionActions();

  if (Platform.OS !== 'ios') return null;
  if (!selection.isSelectionMode || selection.selectionType !== 'tasks') return null;

  const tint = themeColors.text.primary();
  // one step down the text scale when bulk actions are idle (no selection) — reads softer, still tappable
  const actionIconTint = hasSelection ? tint : themeColors.text.secondary();
  const countStyle = [typography.getTextStyle('body-medium'), { color: tint }];

  const complete = () => {
    if (hasSelection) void handleComplete();
  };
  const move = () => {
    if (hasSelection) handleMove();
  };
  const del = () => {
    if (hasSelection) handleDelete();
  };

  if (variant === 'planner') {
    return (
      <Stack.Toolbar>
        <Stack.Toolbar.Button onPress={handleCancel} tintColor={tint} accessibilityLabel="Cancel selection">
          Cancel
        </Stack.Toolbar.Button>
        <Stack.Toolbar.Spacer />
        <Stack.Toolbar.View>
          <View style={{ alignItems: 'center', justifyContent: 'center', minWidth: 80, minHeight: 44 }}>
            <Text style={countStyle} accessibilityLabel={`${selectedCount} tasks selected`}>
              {selectedCount} selected
            </Text>
          </View>
        </Stack.Toolbar.View>
        <Stack.Toolbar.Spacer />
        <Stack.Toolbar.Button
          icon="checkmark.circle"
          tintColor={actionIconTint}
          onPress={complete}
          accessibilityLabel="Complete selected tasks"
        />
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
      </Stack.Toolbar>
    );
  }

  return (
    <Stack.Toolbar>
      <Stack.Toolbar.Spacer />
      <Stack.Toolbar.Button
        icon="checkmark.circle"
        tintColor={actionIconTint}
        onPress={complete}
        accessibilityLabel="Complete selected tasks"
      />
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
