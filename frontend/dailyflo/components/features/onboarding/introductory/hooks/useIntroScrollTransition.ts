/**
 * wires `scrollX` + `Animated.event` for the intro swipe carousel — drives crossfade layers + dot header progress.
 */

import { useMemo, useRef, type RefObject } from 'react';
import { Animated, type NativeSyntheticEvent, type NativeScrollEvent, type ScrollView } from 'react-native';

export type UseIntroScrollTransitionResult = {
  scrollRef: RefObject<ScrollView | null>;
  scrollX: Animated.Value;
  onScroll: ReturnType<typeof Animated.event>;
};

export function useIntroScrollTransition(
  pageCount: number,
  pageWidth: number,
  setPageProgress: (progress: number) => void,
): UseIntroScrollTransitionResult {
  const scrollRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const onScroll = useMemo(
    () =>
      Animated.event(
        [{ nativeEvent: { contentOffset: { x: scrollX } } }],
        {
          useNativeDriver: true,
          listener: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
            const x = e.nativeEvent.contentOffset.x;
            const raw = x / Math.max(pageWidth, 1);
            const clamped = Math.min(Math.max(raw, 0), pageCount - 1);
            setPageProgress(clamped);
          },
        },
      ),
    [scrollX, pageWidth, pageCount, setPageProgress],
  );

  return { scrollRef, scrollX, onScroll };
}
