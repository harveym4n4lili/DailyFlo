/**
 * ios task multi-select: native right Stack.Toolbar slot with Select all / Deselect all text.
 * Stack.Toolbar.Button is icon-only; Stack.Toolbar.View wraps SelectAllButton with variant nativeToolbar (no glass pill).
 */

import React from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { SelectAllButton } from '@/components/ui/button';
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
  const { selection } = useUI();
  // only mount when redux says we are in task selection (same guard the old icon button used)
  const active =
    Platform.OS === 'ios' && selection.isSelectionMode && selection.selectionType === 'tasks';

  if (!active) {
    return null;
  }

  const label = allEligibleSelected ? 'Deselect all' : 'Select all';

  return (
    <Stack.Toolbar placement="right">
      <Stack.Toolbar.View>
        <SelectAllButton variant="nativeToolbar" onPress={onPress} label={label} />
      </Stack.Toolbar.View>
    </Stack.Toolbar>
  );
}
