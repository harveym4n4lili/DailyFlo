/**
 * ios browse home only: native Stack.Toolbar with sf symbols — bell + settings only (no overflow menu).
 * android keeps ScreenHeaderActions in browse/index (glass row).
 */

import React from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';

import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { useThemeColors } from '@/hooks/useColorPalette';

export type IosBrowseHomeStackToolbarProps = {
  /** optional — browse index did not wire alerts to a route yet */
  onAlertsPress?: () => void;
};

export function IosBrowseHomeStackToolbar({ onAlertsPress }: IosBrowseHomeStackToolbarProps) {
  const router = useGuardedRouter();
  const themeColors = useThemeColors();
  const tint = themeColors.text.primary();

  if (Platform.OS !== 'ios') {
    return null;
  }

  return (
    <Stack.Toolbar placement="right">
      <Stack.Toolbar.Button
        icon="bell"
        onPress={onAlertsPress ?? (() => {})}
        accessibilityLabel="Alerts"
        tintColor={tint}
      />
      <Stack.Toolbar.Button
        icon="gearshape"
        onPress={() => router.push('/(tabs)/browse/settings' as any)}
        accessibilityLabel="Settings"
        tintColor={tint}
      />
    </Stack.Toolbar>
  );
}
