import React from 'react';
import { View } from 'react-native';
import { Slot } from 'expo-router';
import { useThemeColors } from '@/hooks/useColorPalette';

// slot only (no stack): keeps one native layer between the tab and ScrollView — best chance for ios tab bar minimize + scroll coordination
export default function MinimizeTestLayout() {
  const themeColors = useThemeColors();
  return (
    <View style={{ flex: 1, backgroundColor: themeColors.background.primary() }}>
      <Slot />
    </View>
  );
}
