import React from 'react';
import { View } from 'react-native';
import { Slot } from 'expo-router';
import { useThemeColors } from '@/hooks/useColorPalette';

// slot instead of stack: today only has index — stack added an extra native navigator layer between
// the tab screen and your FlatList, which breaks ios tab bar minimize / scroll coordination (first-subview chain + uikit)
export default function TodayLayout() {
  const themeColors = useThemeColors();
  return (
    <View style={{ flex: 1, backgroundColor: themeColors.background.primary() }}>
      <Slot />
    </View>
  );
}
