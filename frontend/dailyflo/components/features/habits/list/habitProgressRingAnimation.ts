/**
 * ios-style spring presets for the habit increment ring.
 * constants only — animation runners live in HabitProgressRing.tsx (same file as reanimated hooks).
 */

import { Platform } from 'react-native';
import type { WithSpringConfig, WithTimingConfig } from 'react-native-reanimated';

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
