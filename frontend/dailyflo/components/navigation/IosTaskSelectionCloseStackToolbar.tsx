/**
 * ios task multi-select: native left bar button (sf xmark) exits selection — same symbol as
 * SelectionCloseButton / browse modal close, but in Stack.Toolbar so it stays with the nav bar
 * (no glass circle in the blur overlay).
 */

import React, { useCallback } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Stack } from 'expo-router';

import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useUI } from '@/store/hooks';

export type IosTaskSelectionCloseStackToolbarProps = {
  /**
   * route-based selection screens: pop the stack; useFocusEffect cleanup calls exitSelectionMode.
   * in-place (e.g. android today): clear selection in redux only.
   */
  dismissWithRouterBack?: boolean;
};

export function IosTaskSelectionCloseStackToolbar({
  dismissWithRouterBack = false,
}: IosTaskSelectionCloseStackToolbarProps) {
  const router = useGuardedRouter();
  const themeColors = useThemeColors();
  const { selection, exitSelectionMode } = useUI();
  const tint = themeColors.text.primary();
  const active =
    Platform.OS === 'ios' && selection.isSelectionMode && selection.selectionType === 'tasks';

  const onPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (dismissWithRouterBack) {
      router.back();
    } else {
      exitSelectionMode();
    }
  }, [dismissWithRouterBack, router, exitSelectionMode]);

  if (!active) {
    return null;
  }

  return (
    <Stack.Toolbar placement="left">
      <Stack.Toolbar.Button
        icon="xmark"
        onPress={onPress}
        accessibilityLabel="Cancel selection"
        tintColor={tint}
      />
    </Stack.Toolbar>
  );
}
