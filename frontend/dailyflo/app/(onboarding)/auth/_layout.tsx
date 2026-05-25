/**
 * nested onboarding auth stack — landing at `index`; login/register are liquid glass formSheets (same recipe as planner month-select / browse time pick).
 */

import { Platform } from 'react-native';
import { Stack } from 'expo-router';

import { useThemeColors } from '@/hooks/useColorPalette';

const useLiquidGlass = Platform.OS === 'ios' && !Platform.isPad;

export default function OnboardingAuthLayout() {
  const themeColors = useThemeColors();

  const emailSheetOptions = {
    headerShown: false,
    gestureEnabled: true,
    presentation: Platform.OS === 'ios' ? (useLiquidGlass ? ('formSheet' as const) : ('modal' as const)) : ('modal' as const),
    sheetGrabberVisible: false,
    sheetAllowedDetents: [0.75],
    sheetInitialDetentIndex: 0,
    contentStyle: {
      backgroundColor: useLiquidGlass ? 'transparent' : themeColors.background.secondary(),
    },
  };

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'transparent' },
        gestureEnabled: true,
        animation: 'default',
      }}
    >
      <Stack.Screen name="index" options={{ gestureEnabled: false }} />
      <Stack.Screen name="login" options={emailSheetOptions} />
      <Stack.Screen name="register" options={emailSheetOptions} />
    </Stack>
  );
}
