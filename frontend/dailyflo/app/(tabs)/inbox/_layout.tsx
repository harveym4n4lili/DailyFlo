import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { useThemeColors } from '@/hooks/useColorPalette';
import { TASK_SELECTION_STACK_ANIMATION } from '@/constants/nativeStackTransition';

// stack mirrors today/_layout — display opens as modal; nested stack lives in (modals)/display/_layout.tsx
export default function InboxLayout() {
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
                title: 'Inbox',
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
      {/* route group (modals) is omitted from the URL — href stays /inbox/display like today */}
      <Stack.Screen
        name="(modals)/display"
        options={{
          headerShown: false,
          presentation: 'modal',
          gestureEnabled: false,
          contentStyle: { backgroundColor: themeColors.background.primary() },
        }}
      />
    </Stack>
  );
}
