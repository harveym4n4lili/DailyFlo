/**
 * ios-style spring presets + shared progress/pulse runners for habit increment UI (ring + bar).
 */

import { Platform } from 'react-native';
import {
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
  type WithSpringConfig,
  type WithTimingConfig,
} from 'react-native-reanimated';

/** quick compress on finger down — same feel as uibutton highlight */
export const HABIT_RING_IOS_PRESS_IN_SPRING: WithSpringConfig = {
  damping: 22,
  stiffness: 520,
  mass: 0.45,
  overshootClamping: true,
};

/** release spring after finger lifts */
export const HABIT_RING_IOS_PRESS_OUT_SPRING: WithSpringConfig = {
  damping: 24,
  stiffness: 360,
  mass: 0.55,
  overshootClamping: true,
};

/** progress arc grows to the new value — clamped so it never bounces past the target */
export const HABIT_RING_IOS_PROGRESS_SPRING: WithSpringConfig = {
  damping: 30,
  stiffness: 280,
  mass: 0.95,
  overshootClamping: true,
};

/** brief scale bump when count changes */
export const HABIT_RING_IOS_PULSE_PEAK_SPRING: WithSpringConfig = {
  damping: 14,
  stiffness: 420,
  mass: 0.45,
  overshootClamping: false,
};

export const HABIT_RING_IOS_PULSE_SETTLE_SPRING: WithSpringConfig = {
  damping: 22,
  stiffness: 320,
  mass: 0.55,
  overshootClamping: true,
};

/** inner disc fill + icon crossfade when habit reaches today's goal */
export const HABIT_RING_IOS_COMPLETE_SPRING: WithSpringConfig = {
  damping: 26,
  stiffness: 260,
  mass: 0.85,
  overshootClamping: true,
};

/** tick on filled ring — white reads clearly on the 500-shade habit color */
export const HABIT_RING_COMPLETE_TICK_COLOR = '#FFFFFF';

/** subtle peak scale on ios — activity/health-style controls stay restrained */
export const HABIT_RING_IOS_PULSE_SCALE = 1.07;
export const HABIT_RING_IOS_PRESS_SCALE = 0.94;

export const HABIT_RING_ANDROID_PROGRESS_MS = 280;
export const HABIT_RING_ANDROID_PULSE_MS = 90;
export const HABIT_RING_ANDROID_COMPLETE_MS = 280;

export const isIosHabitRingPlatform = Platform.OS === 'ios';

/** android timing presets — kept here so the ring component stays readable */
export const HABIT_RING_ANDROID_PROGRESS_TIMING: WithTimingConfig = {
  duration: HABIT_RING_ANDROID_PROGRESS_MS,
};
export const HABIT_RING_ANDROID_PULSE_TIMING: WithTimingConfig = {
  duration: HABIT_RING_ANDROID_PULSE_MS,
};
export const HABIT_RING_ANDROID_COMPLETE_TIMING: WithTimingConfig = {
  duration: HABIT_RING_ANDROID_COMPLETE_MS,
};

/**
 * inner disc radius for complete-state fill — extends to the stroke centerline (not the inner
 * edge) so the filled disc meets the progress/track ring without a track-colored hairline gap.
 */
export function resolveHabitRingFillRadius(ringRadius: number): number {
  return ringRadius;
}

/** fill grows to the new ratio — ios spring, android timing (ring arc + simplified bar) */
export function runHabitRingProgressAnimation(
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

/** brief scale bump when today's count changes */
export function runHabitRingPulseAnimation(pulseScale: SharedValue<number>, reduceMotion: boolean) {
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

/** inner disc + tick crossfade when today's goal is reached or reset */
export function runHabitRingCompleteAnimation(
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
