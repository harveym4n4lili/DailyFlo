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
  const fadeStart = TODAY_LIST_PILL_STICKY_SCROLL_THRESHOLD - 12;
  const fadeEnd = TODAY_LIST_PILL_STICKY_SCROLL_THRESHOLD;

  const scrollPillBarStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollYSharedValue?.value ?? 0,
      [fadeStart, fadeEnd],
      [1, 0],
      Extrapolation.CLAMP,
    ),
  }));

  const stickyPillBarStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollYSharedValue?.value ?? 0,
      [fadeStart, fadeEnd],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  }));

  return {
    pillsStuck,
    scrollPillBarStyle,
    stickyPillBarStyle,
    stickyPillBarTop: todayListPillBarTop(insets.top),
  };
}

type TodayStickyScrollPillOverlayProps = {
  top: number;
  stickyPillBarStyle: ReturnType<typeof useAnimatedStyle>;
  pillsStuck: boolean;
  children: React.ReactNode;
};

export function TodayStickyScrollPillOverlay({
  top,
  stickyPillBarStyle,
  pillsStuck,
  children,
}: TodayStickyScrollPillOverlayProps) {
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
  scrollPillBarStyle: ReturnType<typeof useAnimatedStyle>;
  pillsStuck: boolean;
  children: React.ReactNode;
};

export function TodayScrollPillBarFade({
  scrollPillBarStyle,
  pillsStuck,
  children,
}: TodayScrollPillBarFadeProps) {
  return (
    <Animated.View
      style={scrollPillBarStyle}
      pointerEvents={pillsStuck ? 'none' : 'auto'}
    >
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
