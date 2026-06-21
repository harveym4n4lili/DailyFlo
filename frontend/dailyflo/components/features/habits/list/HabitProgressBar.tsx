/**
 * horizontal today-progress track for simplified HabitCard — habit-colored fill on a muted track.
 */

import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';

import { useThemeColors } from '@/hooks/useColorPalette';
import {
  HABIT_CARD_PROGRESS_BAR_HEIGHT,
  HABIT_CARD_PROGRESS_BAR_RADIUS,
} from './habitCardUiTokens';

type HabitProgressBarProps = {
  /** 0–1 fill ratio */
  progress: number;
  fillColor: string;
  trackColor?: string;
};

export function HabitProgressBar({ progress, fillColor, trackColor }: HabitProgressBarProps) {
  const themeColors = useThemeColors();
  const styles = useMemo(() => createStyles(), []);

  const clampedProgress = Math.min(1, Math.max(0, progress));
  const resolvedTrackColor = trackColor ?? themeColors.border.primary();

  return (
    <View
      style={[styles.track, { backgroundColor: resolvedTrackColor }]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clampedProgress * 100) }}
    >
      {clampedProgress > 0 ? (
        <View
          style={[
            styles.fill,
            {
              width: `${clampedProgress * 100}%`,
              backgroundColor: fillColor,
            },
          ]}
        />
      ) : null}
    </View>
  );
}

const createStyles = () =>
  StyleSheet.create({
    track: {
      width: '100%',
      height: HABIT_CARD_PROGRESS_BAR_HEIGHT,
      borderRadius: HABIT_CARD_PROGRESS_BAR_RADIUS,
      overflow: 'hidden',
    },
    fill: {
      height: '100%',
      borderRadius: HABIT_CARD_PROGRESS_BAR_RADIUS,
    },
  });
