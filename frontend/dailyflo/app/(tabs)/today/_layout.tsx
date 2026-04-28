import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { useThemeColors } from '@/hooks/useColorPalette';
import { TASK_SELECTION_STACK_ANIMATION } from '@/constants/nativeStackTransition';

// stack with a single index screen — same pattern as ai/_layout (Slot + NativeTabs led to zero screens / navigator error)
export default function TodayLayout() {
  const themeColors = useThemeColors();
  return (
    <Stack
      screenOptions={{
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
                headerTitle: '',
                headerShadowVisible: false,
                headerBackVisible: false,
                contentStyle: { backgroundColor: themeColors.background.primary() },
              }
            : {
                title: 'Today',
                headerShown: false,
              }
        }
      />
      <Stack.Screen
        name="select"
        options={
          Platform.OS === 'ios'
            ? {
                animation: TASK_SELECTION_STACK_ANIMATION,
                headerShown: true,
                headerTransparent: true,
                headerTitle: '',
                headerShadowVisible: false,
                headerBackVisible: false,
                contentStyle: { backgroundColor: themeColors.background.primary() },
              }
            : {
                headerShown: false,
              }
        }
      />
    </Stack>
  );
}
