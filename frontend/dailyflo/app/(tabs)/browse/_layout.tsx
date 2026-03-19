import { Stack } from 'expo-router';
import { useThemeColors } from '@/hooks/useColorPalette';

export default function BrowseLayout() {
  const themeColors = useThemeColors();
  return (
    <Stack
      screenOptions={{
        animation: 'default', // native iOS slide-from-right (push)
        gestureEnabled: true,
        contentStyle: { backgroundColor: themeColors.background.primary() },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Browse',
          headerShown: false,
        }}
      />
      {/* settings: same as activity-log – modal, close via MainCloseButton */}
      <Stack.Screen
        name="settings"
        options={{
          headerShown: false,
          presentation: 'modal',
          gestureEnabled: false,
          contentStyle: {
            backgroundColor: themeColors.background.primary(),
          },
        }}
      />
      {/* inbox, completed, tags: layout pages with back button + header + scroll view */}
      <Stack.Screen
        name="inbox"
        options={{
          title: 'Inbox',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="completed"
        options={{
          title: 'Completed',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="tags"
        options={{
          title: 'Tags',
          headerShown: false,
        }}
      />
    </Stack>
  );
}
