/**
 * circular progress ring — shows current/target inside the ring.
 * used on habit board cards for numeric daily tracking.
 * ios: uikit press compress + spring arc fill + tap pulse (ui-thread via reanimated).
 * complete: ring fills, inner disc tints to habit color, plus crossfades to tick.
 */

import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  runOnJS,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { AddIcon, TickIcon } from '@/components/ui/Icon';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import {
  HABIT_RING_ANDROID_COMPLETE_TIMING,
  HABIT_RING_ANDROID_PROGRESS_TIMING,
  HABIT_RING_ANDROID_PULSE_TIMING,
  HABIT_RING_COMPLETE_TICK_COLOR,
  HABIT_RING_IOS_COMPLETE_SPRING,
  HABIT_RING_IOS_PRESS_IN_SPRING,
  HABIT_RING_IOS_PRESS_OUT_SPRING,
  HABIT_RING_IOS_PRESS_SCALE,
  HABIT_RING_IOS_PROGRESS_SPRING,
  HABIT_RING_IOS_PULSE_PEAK_SPRING,
  HABIT_RING_IOS_PULSE_SCALE,
  HABIT_RING_IOS_PULSE_SETTLE_SPRING,
  isIosHabitRingPlatform,
  resolveHabitRingFillRadius,
} from './habitProgressRingAnimation';
import { playHabitRingTapHaptic } from './habitProgressRingHaptics';

const DEFAULT_SIZE = 24;
const DEFAULT_STROKE_WIDTH = 1.75;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function runHabitRingProgressAnimation(
  animatedProgress: SharedValue<number>,
  toValue: number,
  reduceMotion: boolean,
) {
  if (reduceMotion) {
    animatedProgress.value = toValue;
    return;
  }

  if (isIosHabitRingPlatform) {
    animatedProgress.value = withSpring(toValue, HABIT_RING_IOS_PROGRESS_SPRING);
    return;
  }

  animatedProgress.value = withTiming(toValue, HABIT_RING_ANDROID_PROGRESS_TIMING);
}

function runHabitRingPulseAnimation(pulseScale: SharedValue<number>, reduceMotion: boolean) {
  if (reduceMotion) {
    pulseScale.value = 1;
    return;
  }

  if (isIosHabitRingPlatform) {
    pulseScale.value = withSequence(
      withSpring(HABIT_RING_IOS_PULSE_SCALE, HABIT_RING_IOS_PULSE_PEAK_SPRING),
      withSpring(1, HABIT_RING_IOS_PULSE_SETTLE_SPRING),
    );
    return;
  }

  pulseScale.value = withSequence(
    withTiming(1.1, HABIT_RING_ANDROID_PULSE_TIMING),
    withTiming(1, HABIT_RING_ANDROID_PULSE_TIMING),
  );
}

function runHabitRingCompleteAnimation(
  animatedComplete: SharedValue<number>,
  toValue: number,
  reduceMotion: boolean,
) {
  if (reduceMotion) {
    animatedComplete.value = toValue;
    return;
  }

  if (isIosHabitRingPlatform) {
    animatedComplete.value = withSpring(toValue, HABIT_RING_IOS_COMPLETE_SPRING);
    return;
  }

  animatedComplete.value = withTiming(toValue, HABIT_RING_ANDROID_COMPLETE_TIMING);
}

type HabitProgressRingProps = {
  /** logged count today */
  current: number;
  /** daily goal */
  target: number;
  /** habit accent — progress arc when trackColor/iconColor not set */
  color: string;
  /** today's goal reached — drives fill + tick state */
  isComplete?: boolean;
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
  /** complete-state tick — defaults slightly larger than plusIconSize */
  tickIconSize?: number;
  /** when set, ring handles ios-native press scale + forwards tap to increment handler */
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

function ringMetrics(size: number) {
  const strokeWidth = Math.max(2, size * (DEFAULT_STROKE_WIDTH / DEFAULT_SIZE));
  const plusIconSize = Math.max(12, Math.round(size * 0.4));
  const plusStrokeWidth = Math.max(3, size * (DEFAULT_STROKE_WIDTH / DEFAULT_SIZE));
  const tickIconSize = Math.max(14, Math.round(size * 0.52));
  return { strokeWidth, plusIconSize, plusStrokeWidth, tickIconSize };
}

function resolveRingMetrics(
  size: number,
  overrides?: Pick<
    HabitProgressRingProps,
    'strokeWidth' | 'plusIconSize' | 'plusStrokeWidth' | 'tickIconSize'
  >,
) {
  const scaled = ringMetrics(size);
  return {
    strokeWidth: overrides?.strokeWidth ?? scaled.strokeWidth,
    plusIconSize: overrides?.plusIconSize ?? scaled.plusIconSize,
    plusStrokeWidth: overrides?.plusStrokeWidth ?? scaled.plusStrokeWidth,
    tickIconSize: overrides?.tickIconSize ?? scaled.tickIconSize,
  };
}

export function HabitProgressRing({
  current,
  target,
  color,
  isComplete = false,
  size = DEFAULT_SIZE,
  trackColor,
  iconColor,
  fillContainer = false,
  showCenterLabel = true,
  showCenterPlus = false,
  strokeWidth: strokeWidthOverride,
  plusIconSize: plusIconSizeOverride,
  plusStrokeWidth: plusStrokeWidthOverride,
  tickIconSize: tickIconSizeOverride,
  onPress,
  style,
  accessibilityLabel,
}: HabitProgressRingProps) {
  const themeColors = useThemeColors();
  const typography = useTypography();
  const reduceMotion = useReducedMotion();
  const prefersReducedMotion = reduceMotion === true;
  const [measuredSize, setMeasuredSize] = useState(DEFAULT_SIZE);

  const resolvedSize = fillContainer ? measuredSize : size;
  const { strokeWidth, plusIconSize, plusStrokeWidth, tickIconSize } = resolveRingMetrics(resolvedSize, {
    strokeWidth: strokeWidthOverride,
    plusIconSize: plusIconSizeOverride,
    plusStrokeWidth: plusStrokeWidthOverride,
    tickIconSize: tickIconSizeOverride,
  });

  const safeTarget = Math.max(1, target);
  const clampedCurrent = Math.min(Math.max(0, Math.round(current)), safeTarget);
  const progress = clampedCurrent / safeTarget;

  const radius = (resolvedSize - strokeWidth) / 2;
  const fillRadius = resolveHabitRingFillRadius(radius);
  const center = resolvedSize / 2;
  const circumference = 2 * Math.PI * radius;

  const resolvedTrackColor = trackColor ?? themeColors.border.primary();
  const resolvedIconColor = iconColor ?? color;
  const label = `${clampedCurrent}/${safeTarget}`;

  // shared values run on the ios ui thread — press, pulse, arc, and complete fill
  const animatedProgress = useSharedValue(progress);
  const animatedComplete = useSharedValue(isComplete ? 1 : 0);
  const pressScale = useSharedValue(1);
  const pulseScale = useSharedValue(1);
  const hasMountedRef = useRef(false);
  const hasMountedCompleteRef = useRef(false);

  // arc fill + completion pulse when count changes after a tap
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      animatedProgress.value = progress;
      return;
    }

    runHabitRingProgressAnimation(animatedProgress, progress, prefersReducedMotion);
    runHabitRingPulseAnimation(pulseScale, prefersReducedMotion);
  }, [animatedProgress, clampedCurrent, progress, pulseScale, prefersReducedMotion, safeTarget]);

  // inner disc fill + plus/tick crossfade when today's goal is reached or reset
  useEffect(() => {
    if (!hasMountedCompleteRef.current) {
      hasMountedCompleteRef.current = true;
      animatedComplete.value = isComplete ? 1 : 0;
      return;
    }

    runHabitRingCompleteAnimation(animatedComplete, isComplete ? 1 : 0, prefersReducedMotion);
  }, [animatedComplete, isComplete, prefersReducedMotion]);

  const onPressRef = useRef(onPress);
  onPressRef.current = onPress;

  const firePress = useCallback(() => {
    onPressRef.current?.();
  }, []);

  const triggerTapHaptic = useCallback(() => {
    playHabitRingTapHaptic();
  }, []);

  // gesture handler tap — ios finger-down compress uses the native touch pipeline
  const tapGesture = useMemo(
    () =>
      Gesture.Tap()
        .enabled(Boolean(onPress))
        .onBegin(() => {
          runOnJS(triggerTapHaptic)();
          if (!isIosHabitRingPlatform || prefersReducedMotion) return;
          pressScale.value = withSpring(HABIT_RING_IOS_PRESS_SCALE, HABIT_RING_IOS_PRESS_IN_SPRING);
        })
        .onFinalize((_event, success) => {
          if (isIosHabitRingPlatform && !prefersReducedMotion) {
            pressScale.value = withSpring(1, HABIT_RING_IOS_PRESS_OUT_SPRING);
          } else {
            pressScale.value = 1;
          }
          if (success) {
            runOnJS(firePress)();
          }
        }),
    [firePress, onPress, pressScale, prefersReducedMotion, triggerTapHaptic],
  );

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value * pulseScale.value }],
  }));

  const fillCircleProps = useAnimatedProps(() => ({
    r: Math.max(0.001, fillRadius * animatedComplete.value),
    fillOpacity: animatedComplete.value,
  }));

  const progressCircleProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animatedProgress.value),
  }));

  const plusIconStyle = useAnimatedStyle(() => ({
    opacity: 1 - animatedComplete.value,
    transform: [{ scale: 1 - animatedComplete.value * 0.25 }],
  }));

  const tickIconStyle = useAnimatedStyle(() => ({
    opacity: animatedComplete.value,
    transform: [{ scale: 0.55 + animatedComplete.value * 0.45 }],
  }));

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
        iconStack: {
          ...StyleSheet.absoluteFillObject,
          alignItems: 'center',
          justifyContent: 'center',
        },
        iconLayer: {
          ...StyleSheet.absoluteFillObject,
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

  const dashArray = `${circumference} ${circumference}`;

  const ringBody = (
    <Animated.View
      style={[styles.wrap, scaleStyle, style]}
      onLayout={handleLayout}
      collapsable={false}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={onPress ? { selected: isComplete } : undefined}
      accessibilityElementsHidden={!accessibilityLabel}
      importantForAccessibility={accessibilityLabel ? 'yes' : 'no-hide-descendants'}
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
          <AnimatedCircle
            cx={center}
            cy={center}
            r={fillRadius}
            fill={color}
            stroke="none"
            animatedProps={fillCircleProps}
          />
          <AnimatedCircle
            cx={center}
            cy={center}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={dashArray}
            animatedProps={progressCircleProps}
            strokeLinecap="round"
            transform={`rotate(-90 ${center} ${center})`}
          />
        </Svg>
      ) : null}
      {showCenterLabel ? <Text style={styles.label}>{label}</Text> : null}
      {showCenterPlus ? (
        <View style={styles.iconStack} pointerEvents="none">
          <Animated.View style={[styles.iconLayer, plusIconStyle]}>
            <AddIcon size={plusIconSize} color={resolvedIconColor} strokeWidth={plusStrokeWidth} />
          </Animated.View>
          <Animated.View style={[styles.iconLayer, tickIconStyle]}>
            <TickIcon size={tickIconSize} color={HABIT_RING_COMPLETE_TICK_COLOR} />
          </Animated.View>
        </View>
      ) : null}
    </Animated.View>
  );

  if (onPress) {
    return <GestureDetector gesture={tapGesture}>{ringBody}</GestureDetector>;
  }

  return ringBody;
}
