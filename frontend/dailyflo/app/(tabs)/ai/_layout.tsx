import { Stack } from 'expo-router';
import { useThemeColors } from '@/hooks/useColorPalette';

export default function AILayout() {
  const themeColors = useThemeColors();
  return (
    <Stack
      screenOptions={{
        animation: 'default', // native iOS slide-from-right
        gestureEnabled: true,
        contentStyle: { backgroundColor: themeColors.background.primary() },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'AI',
          headerShown: false,
        }}
      />
    </Stack>
  );
}
