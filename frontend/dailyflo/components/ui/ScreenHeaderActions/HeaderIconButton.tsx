/**
 * HeaderIconButton – single icon button for screen header actions.
 * matches ActionContextMenu styling (GlassView on iOS, TouchableOpacity on Android).
 * used by ScreenHeaderActions for dashboard, bell, and settings icons.
 */

import React from 'react';
import { View, Pressable, TouchableOpacity, Platform, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GlassView from 'expo-glass-effect/build/GlassView';
import { useThemeColors } from '@/hooks/useColorPalette';

const ICON_SIZE = 24;
const BUTTON_SIZE = 44;
// when noWrapper (inside parent glass): minimal size, no extra padding
const ICON_ONLY_SIZE = 28;

export interface HeaderIconButtonProps {
  /** Ionicons name (e.g. "grid-outline", "notifications-outline") – ignored when iconComponent provided */
  icon?: keyof typeof Ionicons.glyphMap;
  /** custom icon component – when provided, overrides icon */
  iconComponent?: React.ReactNode;
  /** callback when pressed; when undefined, button is non-interactive (e.g. dashboard placeholder) */
  onPress?: () => void;
  style?: ViewStyle;
  accessibilityLabel?: string;
  /** tint for glass: "primary" or "elevated" */
  tint?: 'primary' | 'elevated';
  /** when true, render icon only (no GlassView/background) – parent provides single glass for multiple icons */
  noWrapper?: boolean;
}

export function HeaderIconButton({
  icon,
  iconComponent,
  onPress,
  style,
  accessibilityLabel,
  tint = 'primary',
  noWrapper = false,
}: HeaderIconButtonProps) {
  const themeColors = useThemeColors();
  const iconColor = themeColors.text.primary();
  const tintColor = tint === 'elevated' ? themeColors.background.primarySecondaryBlend() : themeColors.background.primary();

  const content = iconComponent != null ? iconComponent : <Ionicons name={icon!} size={ICON_SIZE} color={iconColor} />;

  // when noWrapper, render icon only – parent provides single glass container
  if (noWrapper) {
    if (onPress == null) {
      return <View style={[styles.iconOnly, style]}>{content}</View>;
    }
    return (
      <Pressable
        onPress={onPress}
        style={[styles.iconOnly, style]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
      >
        {content}
      </Pressable>
    );
  }

  // when no onPress, render as non-interactive view (dashboard placeholder)
  if (onPress == null) {
    return (
      <View style={[styles.wrapper, styles.touchable, { backgroundColor: tintColor }, style]}>
        {content}
      </View>
    );
  }

  if (Platform.OS === 'ios') {
    return (
      <GlassView
        style={[styles.wrapper, style]}
        glassEffectStyle="clear"
        tintColor={tintColor as any}
        isInteractive
      >
        <Pressable
          onPress={onPress}
          style={styles.pressable}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel={accessibilityLabel}
          accessibilityRole="button"
        >
          {content}
        </Pressable>
      </GlassView>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.touchable, { backgroundColor: tintColor }, style]}
      activeOpacity={0.7}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
    >
      {content}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    overflow: 'hidden',
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
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconOnly: {
    width: ICON_ONLY_SIZE,
    height: ICON_ONLY_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
