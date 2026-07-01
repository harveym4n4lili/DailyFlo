/**
 * today tab — scroll pills below big title, crossfade into locked row under blur.
 * shared by today list + today timeline layouts.
 */

import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  TODAY_LIST_PILL_STICKY_SCROLL_THRESHOLD,
  todayListPillBarTop,
} from '@/constants/todayScreenChrome';

const PILL_FADE_START = TODAY_LIST_PILL_STICKY_SCROLL_THRESHOLD - 12;
const PILL_FADE_END = TODAY_LIST_PILL_STICKY_SCROLL_THRESHOLD;

export function useStickyPillBarPointerEvents(scrollYSharedValue?: SharedValue<number>) {
  const [pillsStuck, setPillsStuck] = useState(false);

  useAnimatedReaction(
    () => (scrollYSharedValue?.value ?? 0) >= TODAY_LIST_PILL_STICKY_SCROLL_THRESHOLD,
    (stuck, prev) => {
      if (stuck !== prev) {
        runOnJS(setPillsStuck)(stuck);
      }
    },
    [scrollYSharedValue],
  );

  return pillsStuck;
}

export function useTodayStickyScrollPillCrossfade(scrollYSharedValue?: SharedValue<number>) {
  const insets = useSafeAreaInsets();
  const pillsStuck = useStickyPillBarPointerEvents(scrollYSharedValue);

  return {
    pillsStuck,
    stickyPillBarTop: todayListPillBarTop(insets.top),
  };
}

type TodayStickyScrollPillOverlayProps = {
  top: number;
  scrollYSharedValue?: SharedValue<number>;
  pillsStuck: boolean;
  children: React.ReactNode;
};

export function TodayStickyScrollPillOverlay({
  top,
  scrollYSharedValue,
  pillsStuck,
  children,
}: TodayStickyScrollPillOverlayProps) {
  const stickyPillBarStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollYSharedValue?.value ?? 0,
      [PILL_FADE_START, PILL_FADE_END],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  }));

  return (
    <Animated.View
      style={[styles.stickyPillBar, { top }, stickyPillBarStyle]}
      pointerEvents={pillsStuck ? 'box-none' : 'none'}
    >
      {children}
    </Animated.View>
  );
}

type TodayScrollPillBarFadeProps = {
  scrollYSharedValue?: SharedValue<number>;
  pillsStuck: boolean;
  children: React.ReactNode;
};

export function TodayScrollPillBarFade({
  scrollYSharedValue,
  pillsStuck,
  children,
}: TodayScrollPillBarFadeProps) {
  const scrollPillBarStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollYSharedValue?.value ?? 0,
      [PILL_FADE_START, PILL_FADE_END],
      [1, 0],
      Extrapolation.CLAMP,
    ),
  }));

  return (
    <Animated.View style={scrollPillBarStyle} pointerEvents={pillsStuck ? 'none' : 'auto'}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  stickyPillBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 9,
  },
});
