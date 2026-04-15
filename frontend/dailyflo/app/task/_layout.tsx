/**
 * Task – inner stack for /task/index (redirect) and /task/[taskId] (edit).
 * use Stack (not Slot): Slot can leave multiple child natives mounted; RNScreens formSheet
 * then warns "expects at most 2 subviews" on RNSSafeAreaView and layout/content breaks.
 *
 * ios edit route: native header on so Stack.Toolbar can attach (alpha api, ios only).
 */

import React from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { useThemeColors } from '@/hooks/useColorPalette';

export default function TaskLayout() {
  const themeColors = useThemeColors();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'default',
        contentStyle: { flex: 1 },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="[taskId]"
        options={
          Platform.OS === 'ios'
            ? {
                headerShown: true,
                headerTransparent: true,
                headerTitle: '',
                headerShadowVisible: false,
                headerBackVisible: false,
                contentStyle: {
                  flex: 1,
                  backgroundColor: themeColors.background.primary(),
                },
              }
            : { headerShown: false }
        }
      />
    </Stack>
  );
}
