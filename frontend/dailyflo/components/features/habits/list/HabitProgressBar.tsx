/**
 * horizontal today-progress track for simplified HabitCard — same spring fill + pulse as the ring.
 */

import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet, type LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue } from 'react-native-reanimated';

import { useThemeColors } from '@/hooks/useColorPalette';
import {
  HABIT_CARD_PROGRESS_BAR_HEIGHT,
  HABIT_CARD_PROGRESS_BAR_RADIUS,
} from './habitCardUiTokens';
import {
  runHabitRingProgressAnimation,
  runHabitRingPulseAnimation,
} from './habitProgressRingAnimation';

type HabitProgressBarProps = {
  /** 0–1 fill ratio */
  progress: number;
  fillColor: string;
  trackColor?: string;
};

export function HabitProgressBar({ progress, fillColor, trackColor }: HabitProgressBarProps) {
  const themeColors = useThemeColors();
  const prefersReducedMotion = useReducedMotion() === true;
  const styles = useMemo(() => createStyles(), []);

  const clampedProgress = Math.min(1, Math.max(0, progress));
  const resolvedTrackColor = trackColor ?? themeColors.border.primary();

  const trackWidth = useSharedValue(0);
  const animatedProgress = useSharedValue(clampedProgress);
  const pulseScale = useSharedValue(1);
  const hasMountedRef = useRef(false);

  // match ring — spring/timing fill + tap pulse when today's count changes
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      animatedProgress.value = clampedProgress;
      return;
    }

    runHabitRingProgressAnimation(animatedProgress, clampedProgress, prefersReducedMotion);
    runHabitRingPulseAnimation(pulseScale, prefersReducedMotion);
  }, [animatedProgress, clampedProgress, prefersReducedMotion, pulseScale]);

  const handleTrackLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const width = event.nativeEvent.layout.width;
      if (width > 0) {
        trackWidth.value = width;
      }
    },
    [trackWidth],
  );

  const trackScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: pulseScale.value }],
  }));

  const fillStyle = useAnimatedStyle(() => ({
    width: trackWidth.value * animatedProgress.value,
    backgroundColor: fillColor,
  }));

  return (
    <Animated.View style={trackScaleStyle}>
      <View
        style={[styles.track, { backgroundColor: resolvedTrackColor }]}
        onLayout={handleTrackLayout}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: Math.round(clampedProgress * 100) }}
      >
        <Animated.View style={[styles.fill, fillStyle]} />
      </View>
    </Animated.View>
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
