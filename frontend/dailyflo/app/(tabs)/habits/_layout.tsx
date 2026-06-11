import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { useThemeColors } from '@/hooks/useColorPalette';

export default function HabitsLayout() {
  const themeColors = useThemeColors();
  return (
    <Stack
      screenOptions={{
        animation: 'default',
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
                headerTitle: '',
                headerShadowVisible: false,
                headerBackVisible: false,
                contentStyle: { backgroundColor: themeColors.background.primary() },
              }
            : {
                title: 'Habits',
                headerShown: false,
              }
        }
      />
      <Stack.Screen
        name="create"
        options={
          Platform.OS === 'ios'
            ? {
                headerShown: true,
                headerTransparent: true,
                headerTitle: '',
                headerShadowVisible: false,
                headerBackVisible: false,
                presentation: 'modal',
                gestureEnabled: false,
                contentStyle: { backgroundColor: themeColors.background.root() },
              }
            : {
                title: 'New Habit',
                headerShown: false,
                presentation: 'modal',
                gestureEnabled: false,
                contentStyle: { backgroundColor: themeColors.background.root() },
              }
        }
      />
    </Stack>
  );
}
