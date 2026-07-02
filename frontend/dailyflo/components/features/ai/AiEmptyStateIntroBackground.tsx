/**
 * ai tab empty-state background — sparse blurred radial marple glow behind intro copy.
 * fades in with the greeting (same duration token as AiEmptyStateIntro).
 */

import React, { useMemo } from 'react';
import { Platform, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';

import { useBrandColors, useThemeColors } from '@/hooks/useColorPalette';
import { AI_EMPTY_STATE_GREETING_FADE_MS } from './aiEmptyStateIntroTokens';

/** two soft blobs — sparse layout, marple brand accent at low opacity */
const INTRO_BLOBS: ReadonlyArray<{
  cx: number;
  cy: number;
  rxPct: number;
  ryPct: number;
  opacity: number;
}> = [
  { cx: 0.24, cy: 0.16, rxPct: 0.58, ryPct: 0.34, opacity: 0.18 },
  { cx: 0.82, cy: 0.1, rxPct: 0.44, ryPct: 0.28, opacity: 0.12 },
];

export function AiEmptyStateIntroBackground() {
  const { width, height } = useWindowDimensions();
  const themeColors = useThemeColors();
  const { getMarpleBrandColor } = useBrandColors();

  const brandColor = useMemo(() => getMarpleBrandColor(500), [getMarpleBrandColor]);

  const blurIntensity = Platform.OS === 'ios' ? 44 : 28;

  return (
    <Animated.View
      entering={FadeIn.duration(AI_EMPTY_STATE_GREETING_FADE_MS)}
      style={styles.root}
      pointerEvents="none"
    >
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          {INTRO_BLOBS.map((blob, index) => {
            const cx = blob.cx * width;
            const cy = blob.cy * height;
            const rx = blob.rxPct * width;
            const ry = blob.ryPct * height;
            const color = brandColor;

            return (
              <RadialGradient
                key={`ai-intro-blob-def-${index}`}
                id={`aiIntroBlob${index}`}
                cx={cx}
                cy={cy}
                rx={rx}
                ry={ry}
                fx={cx}
                fy={cy}
                gradientUnits="userSpaceOnUse"
              >
                <Stop offset="0%" stopColor={color} stopOpacity={blob.opacity} />
                <Stop offset="55%" stopColor={color} stopOpacity={blob.opacity * 0.3} />
                <Stop offset="100%" stopColor={color} stopOpacity={0} />
              </RadialGradient>
            );
          })}
        </Defs>
        {INTRO_BLOBS.map((_, index) => (
          <Rect key={`ai-intro-blob-fill-${index}`} width={width} height={height} fill={`url(#aiIntroBlob${index})`} />
        ))}
      </Svg>

      <BlurView
        tint={themeColors.isDark ? 'dark' : 'light'}
        intensity={blurIntensity}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
});
