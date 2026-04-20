/**
 * liquid glass shell around quick-add body: ios uses GlassView, android/web use elevated surface.
 * inner veil keeps labels readable when the blurred inbox shows through the glass.
 */

import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import GlassView from 'expo-glass-effect/build/GlassView';

import { useThemeColors } from '@/hooks/useColorPalette';

const SHEET_TOP_RADIUS = 22;

export interface QuickAddGlassPanelProps {
  children: React.ReactNode;
  /**
   * space reserved above the keyboard / home indicator, applied as padding inside this shell
   * so the glass material still draws through that band (no visible seam above the keyboard).
   */
  bottomInset: number;
}

export function QuickAddGlassPanel({ children, bottomInset }: QuickAddGlassPanelProps) {
  const themeColors = useThemeColors();
  const glassVeil = themeColors.withOpacity(themeColors.background.primary(), 0.4);
  const glassTint = themeColors.withOpacity(themeColors.background.primary(), 0.7);

  const inner = (
    <View style={styles.glassInner}>
      <View style={[styles.glassVeil, { backgroundColor: glassVeil }]} pointerEvents="none" />
      {children}
    </View>
  );

  const shellBottomPad = { paddingBottom: bottomInset };

  if (Platform.OS === 'ios') {
    return (
      <GlassView
        style={[
          styles.glassShell,
          { borderTopLeftRadius: SHEET_TOP_RADIUS, borderTopRightRadius: SHEET_TOP_RADIUS },
          shellBottomPad,
        ]}
        glassEffectStyle="clear"
        tintColor={glassTint as any}
        isInteractive
      >
        {inner}
      </GlassView>
    );
  }

  return (
    <View
      style={[
        styles.glassShell,
        styles.androidSheet,
        {
          borderTopLeftRadius: SHEET_TOP_RADIUS,
          borderTopRightRadius: SHEET_TOP_RADIUS,
          backgroundColor: themeColors.background.elevated(),
          borderColor: themeColors.border.secondary(),
        },
        shellBottomPad,
      ]}
    >
      {inner}
    </View>
  );
}

const styles = StyleSheet.create({
  glassInner: {
    position: 'relative',
    width: '100%',
    backgroundColor: 'transparent',
  },
  glassShell: {
    width: '100%',
    overflow: 'hidden',
  },
  androidSheet: {
    borderWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: 0,
  },
  glassVeil: {
    ...StyleSheet.absoluteFillObject,
  },
});
