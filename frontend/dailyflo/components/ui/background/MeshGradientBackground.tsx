/**
 * full-screen blurred mesh gradient: stacked radial blobs + BlurView + optional dark veil.
 * customize via `config` prop or edit presets in constants/meshGradientBackground.ts
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, Platform, useWindowDimensions, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import {
  MESH_GRADIENT_PRESET_COOL_TOP_GLOW,
  mergeMeshGradientConfig,
  type MeshGradientConfig,
} from '@/constants/meshGradientBackground';

export type MeshGradientPresetName = 'coolTopGlow';

const PRESETS: Record<MeshGradientPresetName, MeshGradientConfig> = {
  coolTopGlow: MESH_GRADIENT_PRESET_COOL_TOP_GLOW,
};

export type MeshGradientBackgroundProps = {
  /** named palette + blob layout; default `coolTopGlow` (cold green-blue, top-center glow) */
  preset?: MeshGradientPresetName;
  /** shallow-merge over preset — override colors, blurIntensity, overlayOpacity, blobs, etc. */
  config?: Partial<MeshGradientConfig>;
  style?: ViewStyle;
  /** when false, renders nothing */
  visible?: boolean;
};

export function MeshGradientBackground({
  preset = 'coolTopGlow',
  config: partial,
  style,
  visible = true,
}: MeshGradientBackgroundProps) {
  const base = PRESETS[preset] ?? MESH_GRADIENT_PRESET_COOL_TOP_GLOW;
  const cfg = useMemo(() => mergeMeshGradientConfig(base, partial), [base, partial]);
  const { width: w, height: h } = useWindowDimensions();

  if (!visible) {
    return null;
  }

  const blurAmount =
    Platform.OS === 'ios'
      ? cfg.blurIntensity
      : (cfg.blurIntensityAndroid ?? Math.round(cfg.blurIntensity * 0.66));

  return (
    <View style={[styles.root, style]} pointerEvents="none">
      <View style={[styles.layer, { backgroundColor: cfg.baseColor }]} />

      <Svg width={w} height={h} style={styles.layer}>
        <Defs>
          {cfg.blobs.map((b, i) => {
            const c = cfg.colors[b.colorIndex % cfg.colors.length];
            const cx = b.cx * w;
            const cy = b.cy * h;
            const rx = b.rxPct * w;
            const ry = b.ryPct * h;
            return (
              <RadialGradient
                key={`mesh-def-${i}`}
                id={`meshBlob${i}`}
                cx={cx}
                cy={cy}
                rx={rx}
                ry={ry}
                fx={cx}
                fy={cy}
                gradientUnits="userSpaceOnUse"
              >
                <Stop offset="0%" stopColor={c} stopOpacity={b.opacity} />
                <Stop offset="50%" stopColor={c} stopOpacity={b.opacity * 0.32} />
                <Stop offset="100%" stopColor={c} stopOpacity={0} />
              </RadialGradient>
            );
          })}
        </Defs>
        {cfg.blobs.map((_, i) => (
          <Rect key={`mesh-fill-${i}`} width={w} height={h} fill={`url(#meshBlob${i})`} />
        ))}
      </Svg>

      <BlurView tint={cfg.blurTint} intensity={blurAmount} style={styles.layer} />

      <View
        style={[styles.layer, { backgroundColor: `rgba(0,0,0,${cfg.overlayOpacity})` }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
  },
  layer: {
    ...StyleSheet.absoluteFillObject,
  },
});
