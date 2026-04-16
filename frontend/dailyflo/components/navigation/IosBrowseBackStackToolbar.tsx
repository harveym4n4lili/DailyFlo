/**
 * ios browse push screens: native left bar slot for back (sf chevron.left).
 * this renders in the stack’s navigation bar via expo-router Stack.Toolbar — not the old
 * absolute-positioned glass MainBackButton, so it stays aligned with system chrome.
 */

import React from 'react';
import { Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useThemeColors } from '@/hooks/useColorPalette';

export function IosBrowseBackStackToolbar() {
  const router = useRouter();
  const themeColors = useThemeColors();
  const tint = themeColors.text.primary();

  if (Platform.OS !== 'ios') {
    return null;
  }

  return (
    <Stack.Toolbar placement="left">
      <Stack.Toolbar.Button
        icon="chevron.left"
        onPress={() => router.back()}
        accessibilityLabel="Back"
        tintColor={tint}
      />
    </Stack.Toolbar>
  );
}
