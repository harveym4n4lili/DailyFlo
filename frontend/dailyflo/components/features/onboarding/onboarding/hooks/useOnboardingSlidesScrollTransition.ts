/**
 * same Animated scroll wiring as introductory `useIntroScrollTransition` —
 * keeps horizontal offset → fractional `pageProgress` so header progress bar can scrub smoothly.
 */

import { useMemo, useRef, type RefObject } from 'react';
import { Animated, type NativeSyntheticEvent, type NativeScrollEvent, type ScrollView } from 'react-native';

export type UseOnboardingSlidesScrollTransitionResult = {
  scrollRef: RefObject<ScrollView | null>;
  scrollX: Animated.Value;
  onScroll: ReturnType<typeof Animated.event>;
};

export function useOnboardingSlidesScrollTransition(
  pageCount: number,
  pageWidth: number,
  setPageProgress: (progress: number) => void,
): UseOnboardingSlidesScrollTransitionResult {
  const scrollRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const maxIndex = Math.max(pageCount - 1, 0);

  const onScroll = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
        // native driver drops many scroll deltas on some stacks — listener would only see snaps at rest.
        useNativeDriver: false,
        listener: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
          const x = e.nativeEvent.contentOffset.x;
          const raw = x / Math.max(pageWidth, 1);
          const clamped = Math.min(Math.max(raw, 0), maxIndex);
          setPageProgress(clamped);
        },
      }),
    [scrollX, pageWidth, maxIndex, setPageProgress],
  );

  return { scrollRef, scrollX, onScroll };
}
