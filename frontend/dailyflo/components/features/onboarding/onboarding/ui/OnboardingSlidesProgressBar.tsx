/**
 * slim header progress track — normalized `progress` 0→1 fills left→right while you swipe carousel.
 * fill uses a bottom→top linear gradient so light reads as rising through the pill while width still tracks scroll.
 */

import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { ONBOARDING_SLIDES_PROGRESS_BAR_HEIGHT } from '../constants';
import { onboardingProgressGlowStops } from './onboardingSlidesProgressGlow';

export type OnboardingSlidesProgressBarProps = {
  /** 0 = empty, 1 = full — driven by carousel scroll fraction */
  progress: number;
  trackColor: string;
  fillColor: string;
};

export function OnboardingSlidesProgressBar({ progress, trackColor, fillColor }: OnboardingSlidesProgressBarProps) {
  const clamped = Math.min(Math.max(progress, 0), 1);
  const glow = React.useMemo(() => onboardingProgressGlowStops(fillColor), [fillColor]);

  const widthAnim = React.useRef(new Animated.Value(clamped)).current;
  const [trackWidth, setTrackWidth] = React.useState(0);

  // follow scroll fraction immediately — long Animated.timings here lag behind the paging gesture.
  React.useEffect(() => {
    widthAnim.setValue(clamped);
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
      <Animated.View pointerEvents="none" style={[styles.fillClip, { width: effectiveWidth }]}>
        <LinearGradient
          colors={glow.colors as [string, string, ...string[]]}
          locations={glow.locations as [number, number, ...number[]]}
          start={{ x: 0.5, y: 1 }}
          end={{ x: 0.5, y: 0 }}
          style={styles.glowGradient}
        />
      </Animated.View>
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
  fillClip: {
    height: '100%',
    overflow: 'hidden',
    borderRadius: ONBOARDING_SLIDES_PROGRESS_BAR_HEIGHT / 2,
  },
  glowGradient: {
    flex: 1,
    width: '100%',
    minHeight: ONBOARDING_SLIDES_PROGRESS_BAR_HEIGHT,
    borderRadius: ONBOARDING_SLIDES_PROGRESS_BAR_HEIGHT / 2,
  },
});
