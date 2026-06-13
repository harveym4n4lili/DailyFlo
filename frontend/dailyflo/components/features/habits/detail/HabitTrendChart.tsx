/**
 * rolling 7-day completion rate over the last 30 days — lightweight svg line.
 */

import React, { useMemo, useState } from 'react';
import { View, StyleSheet, LayoutChangeEvent } from 'react-native';
import Svg, { Polyline, Line } from 'react-native-svg';

import { useThemeColors } from '@/hooks/useColorPalette';
import { getTaskColorValue } from '@/utils/taskColors';
import type { HabitColor, HabitTrendData } from '@/types/api/habits';

const CHART_HEIGHT = 120;
const PADDING_X = 4;
const PADDING_Y = 8;

type HabitTrendChartProps = {
  trend: HabitTrendData;
  color: HabitColor;
};

export function HabitTrendChart({ trend, color }: HabitTrendChartProps) {
  const themeColors = useThemeColors();
  const accent = getTaskColorValue(color);
  const [width, setWidth] = useState(280);

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0) setWidth(w);
  };

  const points = trend.points;
  const polylinePoints = useMemo(() => {
    if (points.length === 0) return '';
    const innerW = width - PADDING_X * 2;
    const innerH = CHART_HEIGHT - PADDING_Y * 2;
    return points
      .map((p, i) => {
        const x = PADDING_X + (i / Math.max(points.length - 1, 1)) * innerW;
        const y = PADDING_Y + innerH * (1 - p.rolling7DayRate);
        return `${x},${y}`;
      })
      .join(' ');
  }, [points, width]);

  const gridY = PADDING_Y + (CHART_HEIGHT - PADDING_Y * 2) * 0.5;

  return (
    <View style={styles.wrap} onLayout={onLayout}>
      <Svg width={width} height={CHART_HEIGHT}>
        <Line
          x1={PADDING_X}
          y1={gridY}
          x2={width - PADDING_X}
          y2={gridY}
          stroke={themeColors.withOpacity(themeColors.text.tertiary(), 0.35)}
          strokeWidth={1}
          strokeDasharray="4 4"
        />
        {polylinePoints ? (
          <Polyline
            points={polylinePoints}
            fill="none"
            stroke={accent}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ) : null}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    height: CHART_HEIGHT,
  },
});
