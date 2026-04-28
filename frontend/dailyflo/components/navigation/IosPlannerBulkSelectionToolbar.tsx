/**
 * ios-only: planner task selection header — select all / deselect all only.
 * bulk complete / date / move / delete live on IosTaskSelectionBottomToolbar (native bottom Stack.Toolbar).
 */

import React from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';

import { SelectAllButton } from '@/components/ui/Button';
import { useUI } from '@/store/hooks';

export type PlannerSelectAllToolbarConfig = {
  onPress: () => void;
  allEligibleSelected: boolean;
};

export type IosPlannerBulkSelectionToolbarProps = {
  plannerSelectAll?: PlannerSelectAllToolbarConfig;
};

export function IosPlannerBulkSelectionToolbar({ plannerSelectAll }: IosPlannerBulkSelectionToolbarProps) {
  const { selection } = useUI();
  const { isSelectionMode, selectionType } = selection;

  if (Platform.OS !== 'ios' || !isSelectionMode || selectionType !== 'tasks' || !plannerSelectAll) {
    return null;
  }

  const selectAllLabel = plannerSelectAll.allEligibleSelected ? 'Deselect all' : 'Select all';

  return (
    <Stack.Toolbar placement="right">
      <Stack.Toolbar.View>
        <SelectAllButton
          variant="nativeToolbar"
          onPress={plannerSelectAll.onPress}
          label={selectAllLabel}
        />
      </Stack.Toolbar.View>
    </Stack.Toolbar>
  );
}
