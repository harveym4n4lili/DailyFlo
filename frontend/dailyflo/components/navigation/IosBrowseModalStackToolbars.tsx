/**
 * ios modals: close (xmark) in the native left bar; optional trailing action on the right.
 * Stack.Toolbar attaches when the stack screen uses headerShown on ios (browse modals, task-create, etc.).
 * android: glass MainCloseButton in-screen where the screen sets headerShown false.
 */

import React from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';

import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { useThemeColors } from '@/hooks/useColorPalette';

export type IosBrowseModalCloseStackToolbarProps = {
  /** optional — e.g. task-create debounced close; defaults to router.back() */
  onPress?: () => void;
};

export function IosBrowseModalCloseStackToolbar({ onPress }: IosBrowseModalCloseStackToolbarProps = {}) {
  const router = useGuardedRouter();
  const themeColors = useThemeColors();
  const tint = themeColors.text.primary();

  if (Platform.OS !== 'ios') {
    return null;
  }

  const handlePress = onPress ?? (() => router.back());

  return (
    <Stack.Toolbar placement="left">
      <Stack.Toolbar.Button
        icon="xmark"
        onPress={handlePress}
        accessibilityLabel="Close"
        tintColor={tint}
      />
    </Stack.Toolbar>
  );
}

export type IosBrowseModalTrailingStackToolbarProps = {
  icon: 'plus' | 'checkmark';
  onPress: () => void;
  accessibilityLabel: string;
  /** when true, the bar button still renders but does nothing (native item may not gray out like glass) */
  disabled?: boolean;
};

export function IosBrowseModalTrailingStackToolbar({
  icon,
  onPress,
  accessibilityLabel,
  disabled = false,
}: IosBrowseModalTrailingStackToolbarProps) {
  const themeColors = useThemeColors();
  const tint = themeColors.text.primary();

  if (Platform.OS !== 'ios') {
    return null;
  }

  return (
    <Stack.Toolbar placement="right">
      <Stack.Toolbar.Button
        icon={icon}
        onPress={disabled ? () => {} : onPress}
        accessibilityLabel={accessibilityLabel}
        tintColor={tint}
      />
    </Stack.Toolbar>
  );
}
