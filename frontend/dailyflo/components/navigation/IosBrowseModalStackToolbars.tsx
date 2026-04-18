/**
 * ios browse modals: close (xmark) in the native left bar; optional trailing action on the right.
 * Stack.Toolbar attaches only when browse/_layout gives the screen headerShown on ios — glass
 * MainCloseButton / MainCreateButton / MainSubmitButton stay on android with headerShown false.
 */

import React from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';

import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { useThemeColors } from '@/hooks/useColorPalette';

export function IosBrowseModalCloseStackToolbar() {
  const router = useGuardedRouter();
  const themeColors = useThemeColors();
  const tint = themeColors.text.primary();

  if (Platform.OS !== 'ios') {
    return null;
  }

  return (
    <Stack.Toolbar placement="left">
      <Stack.Toolbar.Button
        icon="xmark"
        onPress={() => router.back()}
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
