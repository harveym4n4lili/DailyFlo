/**
 * DashedVerticalLine Component
 *
 * A vertical dashed line using multiple small Views. React Native doesn't support
 * dashed borders natively, so we simulate it by rendering small rectangles stacked
 * vertically with gaps between them. Used for the timeline line and similar vertical dividers.
 *
 * Usage:
 * ```tsx
 * <DashedVerticalLine height={200} style={{ position: 'absolute', left: 21, top: 80 }} />
 * ```
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useThemeColors } from '@/hooks/useColorPalette';

interface DashedVerticalLineProps {
  // height of the dashed line area in pixels
  height: number;
  // width of each dash (default 4 to match timeline line)
  dashWidth?: number;
  // optional style override for positioning (position, left, top, etc.)
  style?: ViewStyle;
  // optional color override - defaults to primarySecondaryBlend
  color?: string;
}

/**
 * DashedVerticalLine Component
 *
 * Renders a vertical dashed line. Dash pattern: 10px dash + 4px gap = 14px per segment.
 */
export default function DashedVerticalLine({
  height,
  dashWidth = 4,
  style,
  color,
}: DashedVerticalLineProps) {
  const themeColors = useThemeColors();
  const lineColor = color ?? themeColors.background.primarySecondaryBlend();

  // pattern: 10px dash + 4px gap = 14px per segment (matches DashedSeparator proportions)
  const dashHeight = 8;
  const gapHeight = 4;
  const segmentHeight = dashHeight + gapHeight;
  const dashCount = Math.floor(height / segmentHeight);
  const dashes = Array.from({ length: dashCount }, (_, i) => i);

  return (
    <View style={[styles.container, { width: dashWidth }, style]}>
      {dashes.map((index) => (
        <View
          key={index}
          style={[
            styles.dash,
            {
              width: dashWidth,
              height: dashHeight,
              marginBottom: index < dashCount - 1 ? gapHeight : 0,
              backgroundColor: lineColor,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    flexDirection: 'column',
    alignItems: 'center',
    overflow: 'hidden',
  },
  dash: {
    // width, height, marginBottom, backgroundColor set inline
  },
});
