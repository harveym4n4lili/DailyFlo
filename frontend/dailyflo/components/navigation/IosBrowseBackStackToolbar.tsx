/**
 * ios browse push screens: native left bar slot for back (sf chevron.left).
 * this renders in the stack’s navigation bar via expo-router Stack.Toolbar — not the old
 * absolute-positioned glass MainBackButton, so it stays aligned with system chrome.
 */

import React from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';

import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { useThemeColors } from '@/hooks/useColorPalette';

export type IosBrowseBackStackToolbarProps = {
  /** optional — e.g. confirm discard before back; defaults to router.back() */
  onPress?: () => void;
};

export function IosBrowseBackStackToolbar({ onPress }: IosBrowseBackStackToolbarProps = {}) {
  const router = useGuardedRouter();
  const themeColors = useThemeColors();
  const tint = themeColors.text.secondary();

  if (Platform.OS !== 'ios') {
    return null;
  }

  const handlePress = onPress ?? (() => router.back());

  return (
    <Stack.Toolbar placement="left">
      <Stack.Toolbar.Button
        icon="chevron.left"
        onPress={handlePress}
        accessibilityLabel="Back"
        tintColor={tint}
      />
    </Stack.Toolbar>
  );
}
