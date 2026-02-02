/**
 * TestModalHeaderCloseButton
 *
 * Simple close button for the test modal Stack screen header.
 * Used so the test flow stays self-contained in components/test (no dependency
 * on MainCloseButton layout). Calls onPress (e.g. router.back()) when tapped.
 */

import React from 'react';
import { Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useColorPalette';

export interface TestModalHeaderCloseButtonProps {
  /** called when the close button is pressed (e.g. router.back()) */
  onPress: () => void;
}

/**
 * Renders a header-friendly close (X) button. Fits in Stack.Screen headerLeft.
 */
export function TestModalHeaderCloseButton({ onPress }: TestModalHeaderCloseButtonProps) {
  const themeColors = useThemeColors();
  const iconColor = themeColors.text.primary();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel="Close"
    >
      <Ionicons name="close" size={24} color={iconColor} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    // extra left padding on ipad so the touch target is in the expected spot
    marginLeft: Platform.isPad ? 24 : 0,
  },
  pressed: {
    opacity: 0.6,
  },
});

export default TestModalHeaderCloseButton;
