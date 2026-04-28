/**
 * SelectionCloseButton - close (X) button for exiting selection mode.
 * On iOS: uses expo-glass-effect GlassView for native liquid glass styling.
 * On Android: uses TouchableOpacity with theme background.
 * Matches the liquid glass pattern used by ActionContextMenu and ScreenContextButton.
 */

import React from 'react';
import { Pressable, TouchableOpacity, Platform, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GlassView from 'expo-glass-effect/build/GlassView';
import { useThemeColors } from '@/hooks/useColorPalette';
import { SFSymbolIcon } from '@/components/ui/Icon';

export interface SelectionCloseButtonProps {
  onPress: () => void;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

export function SelectionCloseButton({
  onPress,
  style,
  accessibilityLabel = 'Cancel selection',
}: SelectionCloseButtonProps) {
  const themeColors = useThemeColors();
  const iconColor = themeColors.text.primary();
  // SF Symbol on iOS, Ionicons fallback on Android/Web (matches MainCloseButton)
  const closeIcon = (
    <SFSymbolIcon
      name="xmark"
      size={24}
      color={iconColor}
      fallback={<Ionicons name="close" size={24} color={iconColor} />}
    />
  );

  // on iOS: wrap in GlassView for native liquid glass effect (matches ActionContextMenu)
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
          {closeIcon}
        </Pressable>
      </GlassView>
    );
  }

  // on Android: TouchableOpacity with solid background
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.touchable, { backgroundColor: themeColors.background.secondary() }, style]}
      activeOpacity={0.7}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
    >
      {closeIcon}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  glassContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'transparent',
    overflow: 'visible',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressable: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  touchable: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
