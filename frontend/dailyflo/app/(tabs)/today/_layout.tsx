import React from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { useThemeColors } from '@/hooks/useColorPalette';

export default function TodayLayout() {
  const themeColors = useThemeColors();
  return (
    <View style={{ flex: 1 }}>
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
            title: 'Today',
            headerShown: false 
          }} 
        />
      </Stack>
    </View>
  );
}
