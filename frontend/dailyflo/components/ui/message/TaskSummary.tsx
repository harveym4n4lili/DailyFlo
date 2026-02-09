/**
 * TaskSummary Component
 *
 * A UI component for displaying a dynamic today message on the today screen.
 * Placeholder structure - ready for implementation of greeting/message logic.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors } from '@/hooks/useColorPalette';

export function TaskSummary() {
  const themeColors = useThemeColors();

  return (
    <View style={styles.container}>
      <Text style={[styles.text, { color: themeColors.text }]}>
        {/* dynamic today message will go here */}
        Task summary
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  text: {
    fontSize: 16,
    fontWeight: '500',
  },
});
