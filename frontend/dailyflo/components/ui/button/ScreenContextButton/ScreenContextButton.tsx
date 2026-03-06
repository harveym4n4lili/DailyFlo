/**
 * ScreenContextButton Component
 *
 * A 3-dot ellipsis button used in screen header/top sections to open context menus or dropdowns.
 * On iOS: uses expo-glass-effect GlassView for native liquid glass styling.
 * On Android: uses standard TouchableOpacity with theme styling.
 *
 * Usage: place in a screen's fixed top section; parent handles layout/positioning.
 */

import React from 'react';
import {
  Pressable,
  TouchableOpacity,
  Platform,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GlassView from 'expo-glass-effect/build/GlassView';
import { useThemeColors } from '@/hooks/useColorPalette';
import { Paddings } from '@/constants/Paddings';

export interface ScreenContextButtonProps {
  /** callback when the button is pressed (e.g. toggle dropdown visibility) */
  onPress: () => void;
  /** optional style for the container (for positioning by parent) */
  style?: ViewStyle;
  /** optional accessibility label for screen readers */
  accessibilityLabel?: string;
}

export function ScreenContextButton({
  onPress,
  style,
  accessibilityLabel = 'Open menu',
}: ScreenContextButtonProps) {
  const themeColors = useThemeColors();

  // on iOS: wrap in GlassView for native liquid glass effect
  if (Platform.OS === 'ios') {
    return (
      <GlassView
        style={[styles.glassContainer, style]}
        glassEffectStyle="clear"
        tintColor={themeColors.background.primary() as any}
        isInteractive
      >
        <Pressable
          onPress={onPress}
          style={styles.pressable}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel={accessibilityLabel}
          accessibilityRole="button"
        >
          <Ionicons name="ellipsis-horizontal" size={32} color="white" />
        </Pressable>
      </GlassView>
    );
  }

  // on Android (and other platforms): use TouchableOpacity
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.touchable, style]}
      activeOpacity={0.7}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
    >
      <Ionicons name="ellipsis-horizontal" size={32} color="white" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  glassContainer: {
    paddingVertical: Paddings.indicatorVertical,
    paddingHorizontal: Paddings.contextMenuHorizontal,
    borderRadius: 20,
    backgroundColor: 'transparent',
    overflow: 'visible',
  },
  pressable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  touchable: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
