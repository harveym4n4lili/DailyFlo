/**
 * Habit — inner stack for /habit/[habitId] (detail formSheet on the root stack).
 * use Stack (not Slot): Slot can leave multiple child natives mounted; RNScreens formSheet
 * then warns "expects at most 2 subviews" on RNSSafeAreaView and layout/content breaks.
 */

import React from 'react';
import { Stack } from 'expo-router';
import { useThemeColors } from '@/hooks/useColorPalette';

export default function HabitLayout() {
  const themeColors = useThemeColors();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'default',
        contentStyle: { flex: 1 },
      }}
    >
      <Stack.Screen
        name="[habitId]"
        options={{
          headerShown: false,
          contentStyle: {
            flex: 1,
            backgroundColor: themeColors.background.primary(),
          },
        }}
      />
    </Stack>
  );
}
