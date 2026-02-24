/**
 * Checkbox Component
 *
 * Animated fill checkbox on all platforms.
 * Fill scales and fades from center (0→1). On iOS/Android: particles layer (Particles2 Lottie)
 * extends past bounds when burst plays on check.
 */

import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, StyleSheet, View, Platform, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import LottieView from 'lottie-react-native';
import { useThemeColors } from '@/hooks/useColorPalette';

import {
  PARTICLE_LAYER_MULTIPLIER,
  CHECKBOX_SIZE_TASK_CARD,
  CHECKBOX_MIN_TAP_AREA,
} from './constants';

const PARTICLES_ANIMATION = require('../../../../assets/animations/Particles2.json');

// Particles2.json: burst runs roughly frames 0–41
const PARTICLE_ANIMATION_END = 41;

const FILL_ANIMATION_DURATION = 120;

interface CheckboxProps {
  checked: boolean;
  onPress: () => void;
  disabled?: boolean;
  fillColor?: string;
  /** size in px (TaskCard/subtask: 16, Task view: 18) */
  size?: number;
  /** when false, particles burst animation is hidden (e.g. timeline subtask count icon) */
  showParticles?: boolean;
  /** when true, expands touch target to CHECKBOX_MIN_TAP_AREA via hitSlop (TaskCard, TimelineItem) */
  expandTapArea?: boolean;
}

export default function Checkbox({
  checked,
  onPress,
  disabled = false,
  fillColor,
  size = CHECKBOX_SIZE_TASK_CARD,
  showParticles = true,
  expandTapArea = false,
}: CheckboxProps): React.ReactElement {
  const particleLottieRef = useRef<LottieView>(null);
  const prevCheckedRef = useRef(checked);
  const themeColors = useThemeColors();
  const color = fillColor ?? themeColors.text.primary();
  const particleLayerSize = size * PARTICLE_LAYER_MULTIPLIER;
  const styles = createStyles(size, particleLayerSize, themeColors);

  // fill: scale+opacity from center (useNativeDriver: true for 60fps, no JS thread work)
  const fillScale = useRef(new Animated.Value(checked ? 1 : 0)).current;
  const lastAnimatedToRef = useRef(checked ? 1 : 0);

  const runFillAnimation = (toValue: number) => {
    if (toValue === lastAnimatedToRef.current) return;
    lastAnimatedToRef.current = toValue;
    Animated.timing(fillScale, {
      toValue,
      duration: FILL_ANIMATION_DURATION,
      useNativeDriver: true,
    }).start();
  };

  // sync when checked changes from outside (initial load, external updates)
  useEffect(() => {
    const target = checked ? 1 : 0;
    if (target !== lastAnimatedToRef.current) {
      runFillAnimation(target);
    }
  }, [checked]);

  // play particles burst when transitioning to checked (not on initial load)
  useEffect(() => {
    if (!showParticles || Platform.OS === 'web') return;
    const wasUnchecked = !prevCheckedRef.current;
    prevCheckedRef.current = checked;
    if (checked && wasUnchecked) {
      particleLottieRef.current?.play(0, PARTICLE_ANIMATION_END);
    } else if (!checked) {
      particleLottieRef.current?.play(0, 0);
    }
  }, [checked, showParticles]);

  const handlePress = () => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newValue = checked ? 0 : 1;
    if (showParticles && Platform.OS !== 'web') {
      prevCheckedRef.current = newValue === 1;
      if (newValue === 1) {
        particleLottieRef.current?.play(0, PARTICLE_ANIMATION_END);
      } else {
        particleLottieRef.current?.play(0, 0);
      }
    }
    runFillAnimation(newValue);
    onPress();
  };

  const tertiaryColor = themeColors.text.tertiary();

  // hitSlop extends touch area when expandTapArea - gives 44pt min tap target (iOS recommendation)
  const padding = expandTapArea && size < CHECKBOX_MIN_TAP_AREA
    ? Math.max(0, Math.floor((CHECKBOX_MIN_TAP_AREA - size) / 2))
    : 0;
  const hitSlop = padding > 0 ? { top: padding, bottom: padding, left: padding, right: padding } : undefined;

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={1}
      hitSlop={hitSlop}
      style={styles.container}
    >
      {/* checkbox: border (static) + fill overlay that scales and fades from center */}
      <View style={[styles.checkboxBox, styles.checkboxBoxBorder, { borderColor: tertiaryColor }]}>
        <Animated.View
          style={[
            styles.fillOverlay,
            {
              backgroundColor: color,
              opacity: fillScale,
              transform: [{ scale: fillScale }],
            },
          ]}
        />
      </View>

      {/* particles layer: absolutely positioned, larger than checkbox so burst can extend past boundaries */}
      {Platform.OS !== 'web' && showParticles && (
        <View style={styles.particlesLayer} pointerEvents="none">
          <LottieView
            ref={particleLottieRef}
            source={PARTICLES_ANIMATION}
            style={styles.particlesLottie}
            resizeMode="contain"
            autoPlay={false}
            loop={false}
            speed={1.5}
          />
        </View>
      )}
    </TouchableOpacity>
  );
}

const createStyles = (
  size?: number,
  particleLayerSize?: number,
  themeColors?: ReturnType<typeof useThemeColors>
) =>
  StyleSheet.create({
    container: {
      width: size,
      height: size,
      minWidth: size,
      minHeight: size,
      flexShrink: 0,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'visible',
    },
    checkboxBox: {
      width: size,
      height: size,
      borderRadius: 8,
      overflow: 'hidden',
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkboxBoxBorder: {
      borderWidth: 1.5,
    },
    // fill overlay - fills entire box up to the border edge
    fillOverlay: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: 0,
    },
    // center layer on checkbox: anchor at (size/2, size/2), then translate so layer center aligns
    particlesLayer: {
      position: 'absolute',
      left: size! / 2,
      top: size! / 2,
      width: particleLayerSize,
      height: particleLayerSize,
      transform: [
        { translateX: -particleLayerSize! / 2 },
        { translateY: -particleLayerSize! / 2 },
      ],
      justifyContent: 'center',
      alignItems: 'center',
    },
    particlesLottie: {
      width: particleLayerSize,
      height: particleLayerSize,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
