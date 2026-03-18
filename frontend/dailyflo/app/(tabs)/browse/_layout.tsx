import { Stack } from 'expo-router';
import { useThemeColors } from '@/hooks/useColorPalette';

export default function BrowseLayout() {
  const themeColors = useThemeColors();
  return (
    <Stack
      screenOptions={{
        animation: 'default', // native iOS slide-from-right (push)
        gestureEnabled: true,
        // match theme background so no white flash around edges during slide transition
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
      {/* settings: slides in from right when cog icon tapped, has back button */}
      <Stack.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerShown: false,
        }}
      />
    </Stack>
  );
}
