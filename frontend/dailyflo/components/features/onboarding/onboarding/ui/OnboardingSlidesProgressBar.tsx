/**
 * slim header progress track — normalized `progress` 0→1 fills left→right while you swipe carousel.
 * parenting screen computes completion from fractional `pageProgress` so the bar advances mid-swipe too.
 */

import React from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import {
  ONBOARDING_SLIDES_CONTROL_TRANSITION_MS,
  ONBOARDING_SLIDES_PROGRESS_BAR_HEIGHT,
} from '../constants';

export type OnboardingSlidesProgressBarProps = {
  /** 0 = empty, 1 = full — driven by carousel scroll fraction */
  progress: number;
  trackColor: string;
  fillColor: string;
};

export function OnboardingSlidesProgressBar({ progress, trackColor, fillColor }: OnboardingSlidesProgressBarProps) {
  const clamped = Math.min(Math.max(progress, 0), 1);
  // native animated width needs a bounded range — interpolate from measured track width inside onLayout below
  const widthAnim = React.useRef(new Animated.Value(clamped)).current;
  const [trackWidth, setTrackWidth] = React.useState(0);

  // smooth knob so quick index jumps don't feel harsh (same easing idea as introductory dots).
  React.useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: clamped,
      duration: ONBOARDING_SLIDES_CONTROL_TRANSITION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [widthAnim, clamped]);

  const effectiveWidth =
    trackWidth <= 0
      ? widthAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 0],
        })
      : widthAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, trackWidth],
        });

  return (
    <View
      style={[styles.track, { backgroundColor: trackColor }]}
      onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
      accessibilityRole="progressbar"
      accessibilityValue={{
        min: 0,
        max: 1,
        now: clamped,
        text: `${Math.round(clamped * 100)}% complete`,
      }}
    >
      <Animated.View style={[styles.fill, { width: effectiveWidth, backgroundColor: fillColor }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: ONBOARDING_SLIDES_PROGRESS_BAR_HEIGHT,
    width: '100%',
    borderRadius: ONBOARDING_SLIDES_PROGRESS_BAR_HEIGHT / 2,
    overflow: 'hidden',
    // no flex:1 — parent `barSlot` is a column; flex would stretch vertically and ignore height
  },
  fill: {
    height: '100%',
    borderRadius: ONBOARDING_SLIDES_PROGRESS_BAR_HEIGHT / 2,
  },
});
