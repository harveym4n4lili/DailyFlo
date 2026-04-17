/**
 * SelectAllButton - "Select all" text button for selection mode.
 * default: iOS GlassView pill (blur headers); Android solid TouchableOpacity.
 * nativeToolbar: plain text + Pressable for Stack.Toolbar.View — avoids glass pill inside native toolbar chrome (double box glitch).
 */

import React from 'react';
import { Pressable, Text, TouchableOpacity, Platform, StyleSheet, ViewStyle } from 'react-native';
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
  /** use inside expo-router Stack.Toolbar.View on ios — no GlassView wrapper */
  variant?: 'default' | 'nativeToolbar';
}

export function SelectAllButton({
  onPress,
  label = 'Select all',
  style,
  accessibilityLabel,
  variant = 'default',
}: SelectAllButtonProps) {
  const a11yLabel = accessibilityLabel ?? (label === 'Deselect all' ? 'Deselect all tasks' : 'Select all tasks');
  const themeColors = useThemeColors();
  const typography = useTypography();

  const textStyle = {
    ...typography.getTextStyle('heading-4'),
    color: themeColors.text.primary(),
  };

  // ios toolbar slot: one touch target only — GlassView here stacks on Stack.Toolbar.View and looks like nested chips
  if (Platform.OS === 'ios' && variant === 'nativeToolbar') {
    return (
      <Pressable
        onPress={onPress}
        style={[styles.nativeToolbarPressable, style]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityLabel={a11yLabel}
        accessibilityRole="button"
      >
        <Text style={textStyle}>{label}</Text>
      </Pressable>
    );
  }

  // on iOS (default): wrap in GlassView for native liquid glass effect (matches ActionContextMenu)
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

// vertical padding: match close button (44px height, 24px icon = 10px each side)
const CLOSE_BUTTON_V_PADDING = (44 - 24) / 2; // 10
const styles = StyleSheet.create({
  // bar-button style: same horizontal inset as glass/android pill so label width changes do not change edge rhythm
  nativeToolbarPressable: {
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: Paddings.contextMenuHorizontal,
  },
  glassContainer: {
    minHeight: 44,
    paddingVertical: CLOSE_BUTTON_V_PADDING,
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
    paddingVertical: CLOSE_BUTTON_V_PADDING,
    paddingHorizontal: Paddings.contextMenuHorizontal,
    borderRadius: 20,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
