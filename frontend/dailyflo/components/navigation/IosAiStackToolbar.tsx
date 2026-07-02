/**
 * ios ai tab toolbar — activity log on the right; optional back on the left in session mode.
 */

import React from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';

import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { useThemeColors } from '@/hooks/useColorPalette';

export type IosAiStackToolbarProps = {
  showBack?: boolean;
  onBackPress?: () => void;
};

export function IosAiStackToolbar({ showBack = false, onBackPress }: IosAiStackToolbarProps) {
  const router = useGuardedRouter();
  const themeColors = useThemeColors();
  const toolbarTint = themeColors.text.primary();

  if (Platform.OS !== 'ios') {
    return null;
  }

  return (
    <>
      {showBack ? (
        <Stack.Toolbar placement="left">
          <Stack.Toolbar.Button
            icon="chevron.left"
            onPress={onBackPress}
            accessibilityLabel="Back to prompt"
            tintColor={toolbarTint}
          />
        </Stack.Toolbar>
      ) : null}
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          icon="clock.arrow.circlepath"
          onPress={() => router.push('/activity-log' as any)}
          accessibilityLabel="Activity log"
          tintColor={toolbarTint}
        />
      </Stack.Toolbar>
    </>
  );
}
