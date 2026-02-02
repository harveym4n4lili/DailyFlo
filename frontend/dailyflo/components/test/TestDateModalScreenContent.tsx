/**
 * TestDateModalScreenContent
 *
 * Body content for the test date modal Stack screen (test-date-modal route).
 * Used to verify screen stacking: test-modal → test-date-modal (modal on top of modal).
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors } from '@/hooks/useColorPalette';

/**
 * Renders the main content area of the test date modal screen.
 */
export function TestDateModalScreenContent() {
  const themeColors = useThemeColors();
  const textPrimary = themeColors.text.primary();
  const textSecondary = themeColors.text.secondary();

  return (
    <View style={styles.body}>
      <Text style={[styles.title, { color: textPrimary }]}>Test date modal</Text>
      <Text style={[styles.paragraph, { color: textSecondary }]}>
        This is the second modal on the stack. Opened from the first test modal
        to verify that screen stacking works (modal on top of modal with liquid glass).
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
  },
});

export default TestDateModalScreenContent;
