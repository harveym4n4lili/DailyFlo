/**
 * Test date modal screen (liquid glass style)
 *
 * Opened from test-modal via router.push("/test-date-modal"). Same liquid glass
 * pattern as test-modal; used to verify screen stacking (modal on top of modal).
 * All test UI lives in components/test (TestDateModalScreenContent, TestModalHeaderCloseButton).
 */

import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { isGlassEffectAPIAvailable } from 'expo-glass-effect';
import { useThemeColors } from '@/hooks/useColorPalette';
import { TestDateModalScreenContent, TestModalHeaderCloseButton } from '@/components/test';

export default function TestDateModalScreen() {
  const router = useRouter();
  const themeColors = useThemeColors();
  const useLiquidGlass =
    Platform.OS === 'ios' && isGlassEffectAPIAvailable() && !Platform.isPad;
  const backgroundColor = useLiquidGlass
    ? 'transparent'
    : themeColors.background.primary();

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Test date modal',
          headerLeft: () =>
            Platform.OS === 'ios' ? (
              <TestModalHeaderCloseButton onPress={() => router.back()} />
            ) : undefined,
        }}
      />
      <View style={[styles.container, { backgroundColor }]}>
        <TestDateModalScreenContent />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
