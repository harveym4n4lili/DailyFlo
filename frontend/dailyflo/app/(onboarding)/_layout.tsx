/**
 * Onboarding route group — fresh minimal shell.
 * expo-router matches files in this folder to routes; the stack picks up `index` as the default screen.
 */

import React from 'react';
import { Stack } from 'expo-router';
import { useThemeColors } from '@/hooks/useColorPalette';

export default function OnboardingLayout() {
  const themeColors = useThemeColors();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'default',
        gestureEnabled: true,
        contentStyle: { backgroundColor: themeColors.background.primary() },
      }}
    />
  );
}
