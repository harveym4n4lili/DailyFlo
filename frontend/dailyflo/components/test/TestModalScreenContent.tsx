/**
 * TestModalScreenContent
 *
 * Body content for the test modal Stack screen (test-modal route).
 * Renders title, paragraph, and a button to open the test date modal
 * so we can verify screen stacking (modal on top of modal).
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeColors } from '@/hooks/useColorPalette';

/**
 * Renders the main content area of the test modal screen.
 * Includes a button that pushes test-date-modal to verify screen stack.
 */
export function TestModalScreenContent() {
  const router = useRouter();
  const themeColors = useThemeColors();
  const textPrimary = themeColors.text.primary();
  const textSecondary = themeColors.text.secondary();
  const bgButton = themeColors.background.secondary();
  const borderColor = themeColors.border.primary();

  return (
    <View style={styles.body}>
      <Text style={[styles.title, { color: textPrimary }]}>Test modal</Text>
      <Text style={[styles.paragraph, { color: textSecondary }]}>
        This screen is opened by the test FAB. It uses the same liquid glass
        pattern as the create-task spec: form sheet + transparent content when
        available. Content lives in components/test to keep testing isolated.
      </Text>
      <Pressable
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: bgButton, borderColor },
          pressed && styles.buttonPressed,
        ]}
        onPress={() => router.push('/test-date-modal')}
        accessibilityRole="button"
        accessibilityLabel="Open another date modal"
      >
        <Text style={[styles.buttonLabel, { color: textPrimary }]}>
          Open another date modal
        </Text>
      </Pressable>
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
    marginBottom: 24,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TestModalScreenContent;
