/**
 * intro backgrounds: only two opaque layers at a time (base + fading overlay).
 * stacking N semi-transparent fills made mid-transition colors look darker ("dip"); this matches a simple A→B crossfade.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { useThemeColors } from '@/hooks/useColorPalette';

import type { IntroSlideUiConfig } from '../constants';
import { resolveIntroBackgroundColor } from '../scrollTransition';

export type IntroScrollCrossfadeBackgroundsProps = {
  scrollX: Animated.Value;
  pageWidth: number;
  slideUiList: readonly IntroSlideUiConfig[];
};

/** maps fractional scroll position (0..n-1) to base + next-slide overlay opacity */
function computeIntroBackgroundCrossfade(
  colors: readonly string[],
  clampedPageProgress: number,
): { base: string; overlay: string; overlayOpacity: number } {
  const n = colors.length;
  if (n === 0) {
    return { base: 'transparent', overlay: 'transparent', overlayOpacity: 0 };
  }
  if (n === 1) {
    return { base: colors[0], overlay: colors[0], overlayOpacity: 0 };
  }
  const c = Math.min(Math.max(clampedPageProgress, 0), n - 1);
  if (c >= n - 1) {
    return { base: colors[n - 1], overlay: colors[n - 1], overlayOpacity: 0 };
  }
  const i = Math.floor(c);
  const t = c - i;
  return { base: colors[i], overlay: colors[i + 1], overlayOpacity: t };
}

export function IntroScrollCrossfadeBackgrounds({
  scrollX,
  pageWidth,
  slideUiList,
}: IntroScrollCrossfadeBackgroundsProps) {
  const themeColors = useThemeColors();
  const colors = useMemo(
    () => slideUiList.map((s) => resolveIntroBackgroundColor(themeColors.background, s.background)),
    // use `theme` not whole `themeColors` — the hook returns a fresh object each render and would rebind listeners
    [slideUiList, themeColors.theme],
  );

  const lastProgressRef = useRef(0);
  const [blend, setBlend] = useState(() => computeIntroBackgroundCrossfade(colors, 0));

  // theme / slide list changed — re-resolve hex while keeping current scroll progress
  useEffect(() => {
    setBlend(computeIntroBackgroundCrossfade(colors, lastProgressRef.current));
  }, [colors]);

  useEffect(() => {
    const id = scrollX.addListener(({ value }) => {
      const w = Math.max(pageWidth, 1);
      const progress = value / w;
      const clamped = Math.min(Math.max(progress, 0), colors.length - 1);
      lastProgressRef.current = clamped;
      setBlend(computeIntroBackgroundCrossfade(colors, clamped));
    });
    return () => {
      scrollX.removeListener(id);
    };
  }, [scrollX, pageWidth, colors]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: blend.base }]} />
      <View
        style={[StyleSheet.absoluteFillObject, { backgroundColor: blend.overlay, opacity: blend.overlayOpacity }]}
      />
    </View>
  );
}
