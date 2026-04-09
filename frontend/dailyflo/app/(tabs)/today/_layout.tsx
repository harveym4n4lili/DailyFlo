import { Stack } from 'expo-router';
import { useThemeColors } from '@/hooks/useColorPalette';

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
        options={{
          title: 'Today',
          headerShown: false,
        }}
      />
    </Stack>
  );
}
