/**
 * SolidSeparator Component
 *
 * A full-width solid line separator. Uses paddingLeft and paddingRight
 * to control where the line starts and ends (e.g. align with text content).
 * Set paddingRight to 0 for a line that meets the container’s right edge.
 * Uses borderBottomWidth: 1 to match DashedSeparator’s dash height (1px).
 *
 * Usage:
 * ```tsx
 * <SolidSeparator paddingLeft={30} paddingRight={20} />
 * ```
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useThemeColors } from '@/hooks/useColorPalette';

interface SolidSeparatorProps {
  paddingLeft?: number;
  paddingRight?: number;
  color?: string;
  style?: ViewStyle;
  /** Prevents view flattening that can cause flash on mount */
  collapsable?: boolean;
}

export default function SolidSeparator({
  paddingLeft = 0,
  paddingRight = 0,
  color,
  style,
  collapsable = false,
}: SolidSeparatorProps) {
  const themeColors = useThemeColors();
  const lineColor = color ?? themeColors.border.secondary();

  return (
    <View collapsable={collapsable} style={[styles.container, { paddingLeft, paddingRight }, style]}>
      {/* inner view fills content area (after padding) so border aligns with main label; uses border for consistent thickness */}
      <View
        style={[
          styles.line,
          { borderBottomWidth: 1, borderBottomColor: lineColor },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  line: {
    width: '100%',
    alignSelf: 'stretch',
    // borderBottomWidth draws the line; fills the horizontal space after container padding
  },
});
