/**
 * tap-to-dismiss layer behind the composer: blur over the previous route + dim veil.
 * lives under the glass panel in the tree so taps on the sheet never hit this pressable.
 */

import React from 'react';
import { Platform, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';

import { useThemeColors } from '@/hooks/useColorPalette';

const BLUR_INTENSITY = Platform.OS === 'ios' ? 0 : 0;

export interface QuickAddModalBackdropProps {
  onRequestClose: () => void;
  /** optional static styles on the full-screen pressable (fade/slide usually applied by parent Animated.View) */
  style?: StyleProp<ViewStyle>;
}

export function QuickAddModalBackdrop({ onRequestClose, style }: QuickAddModalBackdropProps) {
  const themeColors = useThemeColors();
  const tint = themeColors.isDark ? 'dark' : 'light';
  const dimVeil = themeColors.withOpacity('#000000', 0.4);

  return (
    <Pressable
      style={[StyleSheet.absoluteFill, style]}
      onPress={onRequestClose}
      accessibilityRole="button"
      accessibilityLabel="Dismiss"
    >
      <BlurView tint={tint} intensity={BLUR_INTENSITY} style={StyleSheet.absoluteFill} />
      <View style={[styles.dimVeil, { backgroundColor: dimVeil }]} pointerEvents="none" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  dimVeil: {
    ...StyleSheet.absoluteFillObject,
  },
});
