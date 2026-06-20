/**
 * circular progress ring — shows current/target inside the ring.
 * used on habit board cards for numeric daily tracking.
 */

import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { AddIcon } from '@/components/ui/Icon';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';

const DEFAULT_SIZE = 24;
const DEFAULT_STROKE_WIDTH = 1.75;

type HabitProgressRingProps = {
  /** logged count today */
  current: number;
  /** daily goal */
  target: number;
  /** habit accent — progress arc when trackColor/iconColor not set */
  color: string;
  size?: number;
  /** background ring — defaults to theme border */
  trackColor?: string;
  /** center plus — defaults to color */
  iconColor?: string;
  /** stretch to parent height/width — used in habit board header */
  fillContainer?: boolean;
  /** when false, ring is arc-only — score shown elsewhere in the row */
  showCenterLabel?: boolean;
  /** plus icon in the ring center (used when score is shown outside the ring) */
  showCenterPlus?: boolean;
  /** optional overrides — habit board card passes tokens from habitBoardUiTokens.ts */
  strokeWidth?: number;
  plusIconSize?: number;
  plusStrokeWidth?: number;
};

function ringMetrics(size: number) {
  const strokeWidth = Math.max(2, size * (DEFAULT_STROKE_WIDTH / DEFAULT_SIZE));
  const plusIconSize = Math.max(12, Math.round(size * 0.4));
  const plusStrokeWidth = Math.max(3, size * (DEFAULT_STROKE_WIDTH / DEFAULT_SIZE));
  return { strokeWidth, plusIconSize, plusStrokeWidth };
}

function resolveRingMetrics(
  size: number,
  overrides?: Pick<HabitProgressRingProps, 'strokeWidth' | 'plusIconSize' | 'plusStrokeWidth'>,
) {
  const scaled = ringMetrics(size);
  return {
    strokeWidth: overrides?.strokeWidth ?? scaled.strokeWidth,
    plusIconSize: overrides?.plusIconSize ?? scaled.plusIconSize,
    plusStrokeWidth: overrides?.plusStrokeWidth ?? scaled.plusStrokeWidth,
  };
}

export function HabitProgressRing({
  current,
  target,
  color,
  size = DEFAULT_SIZE,
  trackColor,
  iconColor,
  fillContainer = false,
  showCenterLabel = true,
  showCenterPlus = false,
  strokeWidth: strokeWidthOverride,
  plusIconSize: plusIconSizeOverride,
  plusStrokeWidth: plusStrokeWidthOverride,
}: HabitProgressRingProps) {
  const themeColors = useThemeColors();
  const typography = useTypography();
  const [measuredSize, setMeasuredSize] = useState(DEFAULT_SIZE);

  const resolvedSize = fillContainer ? measuredSize : size;
  const { strokeWidth, plusIconSize, plusStrokeWidth } = resolveRingMetrics(resolvedSize, {
    strokeWidth: strokeWidthOverride,
    plusIconSize: plusIconSizeOverride,
    plusStrokeWidth: plusStrokeWidthOverride,
  });

  const safeTarget = Math.max(1, target);
  const clampedCurrent = Math.min(Math.max(0, Math.round(current)), safeTarget);
  const progress = clampedCurrent / safeTarget;

  const radius = (resolvedSize - strokeWidth) / 2;
  const center = resolvedSize / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  const resolvedTrackColor = trackColor ?? themeColors.border.primary();
  const resolvedIconColor = iconColor ?? color;
  const label = `${clampedCurrent}/${safeTarget}`;

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      if (!fillContainer) return;
      const { width, height } = event.nativeEvent.layout;
      const next = Math.floor(Math.min(width, height));
      if (next > 0 && next !== measuredSize) {
        setMeasuredSize(next);
      }
    },
    [fillContainer, measuredSize],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: fillContainer
          ? {
              flex: 1,
              width: '100%',
              height: '100%',
              alignItems: 'center',
              justifyContent: 'center',
            }
          : {
              width: resolvedSize,
              height: resolvedSize,
              alignItems: 'center',
              justifyContent: 'center',
            },
        label: {
          ...typography.getTextStyle('body-small'),
          fontSize: Math.max(10, Math.round(resolvedSize * 0.3)),
          lineHeight: Math.max(12, Math.round(resolvedSize * 0.36)),
          color: themeColors.text.secondary(),
          fontWeight: '600',
          fontVariant: ['tabular-nums'],
        },
      }),
    [fillContainer, resolvedSize, themeColors, typography],
  );

  return (
    <View
      style={styles.wrap}
      onLayout={handleLayout}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {resolvedSize > 0 ? (
        <Svg width={resolvedSize} height={resolvedSize} style={StyleSheet.absoluteFill}>
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={resolvedTrackColor}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {progress > 0 ? (
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke={color}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${center} ${center})`}
            />
          ) : null}
        </Svg>
      ) : null}
      {showCenterLabel ? <Text style={styles.label}>{label}</Text> : null}
      {showCenterPlus ? (
        <AddIcon size={plusIconSize} color={resolvedIconColor} strokeWidth={plusStrokeWidth} />
      ) : null}
    </View>
  );
}
