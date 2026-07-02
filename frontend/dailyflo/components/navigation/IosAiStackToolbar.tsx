/**
 * ios ai tab only: single native Stack.Toolbar button (activity log).
 * replaces IosDashboardOverflowToolbar here — display settings and select tasks do not apply to chat.
 */

import React from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';

import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { useThemeColors } from '@/hooks/useColorPalette';

export function IosAiStackToolbar() {
  const router = useGuardedRouter();
  const themeColors = useThemeColors();
  const toolbarTint = themeColors.text.primary();

  if (Platform.OS !== 'ios') {
    return null;
  }

  return (
    <Stack.Toolbar placement="right">
      <Stack.Toolbar.Button
        icon="clock.arrow.circlepath"
        onPress={() => router.push('/activity-log' as any)}
        accessibilityLabel="Activity log"
        tintColor={toolbarTint}
      />
    </Stack.Toolbar>
  );
}
