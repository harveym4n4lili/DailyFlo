import { Stack } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';
import { useThemeColors } from '@/hooks/useColorPalette';

const useLiquidGlass = Platform.OS === 'ios' && !Platform.isPad;

export default function PlannerLayout() {
  const themeColors = useThemeColors();

  return (
    <Stack
      screenOptions={{
        animation: 'default', // native iOS slide-from-right for push screens
        gestureEnabled: true,
        contentStyle: { backgroundColor: themeColors.background.primary() },
      }}
    >
      <Stack.Screen
        name="index"
        options={
          Platform.OS === 'ios'
            ? {
                headerShown: true,
                headerTransparent: true,
                // keep bar visually minimal; liquid/material headers can look heavier than we want
                headerBlurEffect: 'none',
                headerStyle: { backgroundColor: 'transparent' },
                // transparent fill; planner month control is headerTitle on ios
                headerBackground: () => (
                  <View
                    pointerEvents="none"
                    style={[StyleSheet.absoluteFill, { backgroundColor: 'transparent' }]}
                  />
                ),
                headerTitle: '',
                headerShadowVisible: false,
                headerBackVisible: false,
                contentStyle: { backgroundColor: themeColors.background.primary() },
              }
            : {
                title: 'Planner',
                headerShown: false,
                contentStyle: { backgroundColor: themeColors.background.primary() },
              }
        }
      />
      {/* month select: glass draggable sheet at 60%, opened when tapping month/year in planner */}
      <Stack.Screen
        name="month-select"
        options={{
          headerShown: false,
          presentation: Platform.OS === 'ios' ? (useLiquidGlass ? 'formSheet' : 'modal') : 'modal',
          sheetGrabberVisible: false,
          sheetAllowedDetents: [0.6],
          sheetInitialDetentIndex: 0,
          contentStyle: {
            backgroundColor: useLiquidGlass ? 'transparent' : themeColors.background.secondary(),
          },
        }}
      />
    </Stack>
  );
}
