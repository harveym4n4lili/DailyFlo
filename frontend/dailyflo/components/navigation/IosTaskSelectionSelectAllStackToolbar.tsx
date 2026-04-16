/**
 * ios task multi-select: native right bar button for select-all / deselect-all (sf symbols).
 * replaces the in-header SelectAllButton text on today + browse; planner uses the same control
 * inside IosPlannerBulkSelectionToolbar so one Stack.Toolbar holds select-all + bulk menu.
 */

import React from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useUI } from '@/store/hooks';

export type IosTaskSelectionSelectAllStackToolbarProps = {
  onPress: () => void;
  /** true when every eligible task id is selected — button clears selection */
  allEligibleSelected: boolean;
};

export function IosTaskSelectionSelectAllStackToolbar({
  onPress,
  allEligibleSelected,
}: IosTaskSelectionSelectAllStackToolbarProps) {
  const themeColors = useThemeColors();
  const { selection } = useUI();
  const tint = themeColors.text.primary();
  const active =
    Platform.OS === 'ios' && selection.isSelectionMode && selection.selectionType === 'tasks';

  if (!active) {
    return null;
  }

  const icon = allEligibleSelected ? 'circle' : 'checkmark.circle';
  const a11y = allEligibleSelected ? 'Deselect all tasks' : 'Select all tasks';

  return (
    <Stack.Toolbar placement="right">
      <Stack.Toolbar.Button
        icon={icon}
        onPress={onPress}
        accessibilityLabel={a11y}
        tintColor={tint}
      />
    </Stack.Toolbar>
  );
}
