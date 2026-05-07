/**
 * slim header progress track — normalized `progress` 0→1 fills left→right.
 * parent passes a **settled** fraction (one value per carousel page); fill eases between steps.
 *
 * reanimated drives width on the UI thread (same stack as modals / tab chrome) so motion stays smooth on iOS.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { ONBOARDING_SLIDES_CONTROL_TRANSITION_MS, ONBOARDING_SLIDES_PROGRESS_BAR_HEIGHT } from '../constants';

export type OnboardingSlidesProgressBarProps = {
  /** 0 = empty, 1 = full — steps once per page; width eases between values */
  progress: number;
  trackColor: string;
  fillColor: string;
};

export function OnboardingSlidesProgressBar({ progress, trackColor, fillColor }: OnboardingSlidesProgressBarProps) {
  const clamped = Math.min(Math.max(progress, 0), 1);

  // 0…1 fill factor — animated with withTiming so updates run off the js render path (smoother on iOS).
  const fillUnit = useSharedValue(clamped);
  // track width from layout — multiplied in worklet so the pill width tracks real pixels.
  const trackWidthPx = useSharedValue(0);
  // skip timing on first commit so the bar does not tween from 0 on cold mount.
  const didMountRef = React.useRef(false);

  React.useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      fillUnit.value = clamped;
      return;
    }
    fillUnit.value = withTiming(clamped, {
      duration: ONBOARDING_SLIDES_CONTROL_TRANSITION_MS,
      easing: Easing.out(Easing.cubic),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fillUnit is a stable reanimated ref; only clamped should rerun this.
  }, [clamped]);

  const fillAnimatedStyle = useAnimatedStyle(() => ({
    width: Math.max(0, fillUnit.value * trackWidthPx.value),
  }));

  const onTrackLayout = React.useCallback((e: { nativeEvent: { layout: { width: number } } }) => {
    // shared value writes from onLayout stay compatible with the fill worklet below.
    trackWidthPx.value = e.nativeEvent.layout.width;
  }, [trackWidthPx]);

  return (
    <View
      style={[styles.track, { backgroundColor: trackColor }]}
      onLayout={onTrackLayout}
      accessibilityRole="progressbar"
      accessibilityValue={{
        min: 0,
        max: 1,
        now: clamped,
        text: `${Math.round(clamped * 100)}% complete`,
      }}
    >
      <Animated.View
        pointerEvents="none"
        style={[styles.fill, { backgroundColor: fillColor }, fillAnimatedStyle]}
      />
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
