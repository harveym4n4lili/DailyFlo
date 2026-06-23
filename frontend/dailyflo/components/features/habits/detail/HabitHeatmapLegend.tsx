/**
 * Less → More swatch key for habit heatmaps — used under the grid (detail) or inline on HabitCard footer.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { getHabitHeatmapLegendItems } from './habitHeatmapColors';
import type { HabitColor } from '@/types/api/habits';

const SWATCH_GAP = 3;
const CAPTION_GAP = 6;
const DEFAULT_SWATCH = 14;
const COMPACT_SWATCH = 10;

type HabitHeatmapLegendProps = {
  color: HabitColor;
  /** smaller swatches for the habit card footer row */
  compact?: boolean;
};

export function HabitHeatmapLegend({ color, compact = false }: HabitHeatmapLegendProps) {
  const themeColors = useThemeColors();
  const typography = useTypography();
  const swatchSize = compact ? COMPACT_SWATCH : DEFAULT_SWATCH;

  const legendItems = useMemo(
    () => getHabitHeatmapLegendItems(color, themeColors),
    [color, themeColors],
  );

  const labelColor = themeColors.text.tertiary();
  const styles = useMemo(
    () => createStyles(typography, labelColor, swatchSize, compact),
    [typography, labelColor, swatchSize, compact],
  );

  return (
    <View style={styles.row} accessibilityLabel="Heatmap completion key, less to more">
      <Text style={styles.caption}>Less</Text>
      <View style={styles.swatchGroup}>
        {legendItems.map((item) => (
          <View
            key={item.score}
            style={[styles.swatch, { backgroundColor: item.fill }]}
          />
        ))}
      </View>
      <Text style={styles.caption}>More</Text>
    </View>
  );
}

const createStyles = (
  typography: ReturnType<typeof useTypography>,
  labelColor: string,
  swatchSize: number,
  compact: boolean,
) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: compact ? 4 : CAPTION_GAP,
    },
    swatchGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SWATCH_GAP,
    },
    swatch: {
      width: swatchSize,
      height: swatchSize,
      borderRadius: compact ? 3 : 4,
    },
    caption: {
      ...typography.getTextStyle('body-small'),
      color: labelColor,
      fontSize: compact ? 9 : 9,
      lineHeight: compact ? 11 : 11,
    },
  });
