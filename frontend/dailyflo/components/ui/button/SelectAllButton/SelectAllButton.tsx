/**
 * SelectAllButton - "Select all" text button for selection mode.
 * On iOS: uses expo-glass-effect GlassView for native liquid glass styling (matches ActionContextMenu).
 * On Android: uses TouchableOpacity with theme background.
 */

import React from 'react';
import { Pressable, TouchableOpacity, Platform, StyleSheet, ViewStyle } from 'react-native';
import { Text } from 'react-native';
import GlassView from 'expo-glass-effect/build/GlassView';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { Paddings } from '@/constants/Paddings';

export interface SelectAllButtonProps {
  onPress: () => void;
  /** "Select all" or "Deselect all" - parent computes based on selection state */
  label?: 'Select all' | 'Deselect all';
  style?: ViewStyle;
  accessibilityLabel?: string;
}

export function SelectAllButton({
  onPress,
  label = 'Select all',
  style,
  accessibilityLabel,
}: SelectAllButtonProps) {
  const a11yLabel = accessibilityLabel ?? (label === 'Deselect all' ? 'Deselect all tasks' : 'Select all tasks');
  const themeColors = useThemeColors();
  const typography = useTypography();

  const textStyle = {
    ...typography.getTextStyle('heading-4'),
    color: themeColors.text.primary(),
  };

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
          accessibilityLabel={a11yLabel}
          accessibilityRole="button"
        >
          <Text style={textStyle}>{label}</Text>
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
      accessibilityLabel={a11yLabel}
      accessibilityRole="button"
    >
      <Text style={textStyle}>{label}</Text>
    </TouchableOpacity>
  );
}

// inner padding: match ActionContextMenu iosWrapper exactly (indicatorVertical + contextMenuHorizontal)
const styles = StyleSheet.create({
  glassContainer: {
    paddingVertical: Paddings.contextMenuVertical,
    paddingHorizontal: Paddings.contextMenuHorizontal,
    borderRadius: 20,
    backgroundColor: 'transparent',
    overflow: 'visible',
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  touchable: {
    paddingVertical: Paddings.contextMenuVertical,
    paddingHorizontal: Paddings.contextMenuHorizontal,
    borderRadius: 20,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
