/**
 * Test modal screen (liquid glass style)
 *
 * Opened by FABTest via router.push("/test-modal"). Uses the same liquid glass
 * pattern as LIQUID_GLASS_CREATE_TASK_MODAL.md: when liquid glass is available,
 * the main container is transparent so the native form sheet shows the glass look.
 * All test UI lives in components/test (TestModalScreenContent, TestModalHeaderCloseButton).
 */

import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { isGlassEffectAPIAvailable } from 'expo-glass-effect';
import { useThemeColors } from '@/hooks/useColorPalette';
import { TestModalScreenContent, TestModalHeaderCloseButton } from '@/components/test';

export default function TestModalScreen() {
  const router = useRouter();
  const themeColors = useThemeColors();
  // when liquid glass is on, use transparent so the native sheet shows glass
  const useLiquidGlass =
    Platform.OS === 'ios' && isGlassEffectAPIAvailable() && !Platform.isPad;
  const backgroundColor = useLiquidGlass
    ? 'transparent'
    : themeColors.background.primary();

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Test modal',
          headerLeft: () =>
            Platform.OS === 'ios' ? (
              <TestModalHeaderCloseButton onPress={() => router.back()} />
            ) : undefined,
        }}
      />
      <View style={[styles.container, { backgroundColor }]}>
        <TestModalScreenContent />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
