/**
 * Checkbox Component
 *
 * Standard View + Ionicons checkbox on all platforms.
 * On iOS/Android: a particles layer (Particles2 Lottie) sits inside the checkbox
 * with absolute positioning so it can extend past the checkbox boundaries when
 * the burst animation plays on check.
 */

import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, StyleSheet, View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import LottieView from 'lottie-react-native';
import { useThemeColors } from '@/hooks/useColorPalette';

import {
  PARTICLE_LAYER_MULTIPLIER,
  CHECKBOX_SIZE_TASK_CARD,
} from './constants';

const PARTICLES_ANIMATION = require('../../../../assets/animations/Particles2.json');

// Particles2.json: burst runs roughly frames 0–41
const PARTICLE_ANIMATION_END = 41;

interface CheckboxProps {
  checked: boolean;
  onPress: () => void;
  disabled?: boolean;
  fillColor?: string;
  /** size in px (TaskCard/subtask: 16, Task view: 18) */
  size?: number;
  /** when false, particles burst animation is hidden (e.g. timeline subtask count icon) */
  showParticles?: boolean;
}

export default function Checkbox({
  checked,
  onPress,
  disabled = false,
  fillColor,
  size = CHECKBOX_SIZE_TASK_CARD,
  showParticles = true,
}: CheckboxProps): React.ReactElement {
  const particleLottieRef = useRef<LottieView>(null);
  const prevCheckedRef = useRef(checked);
  const themeColors = useThemeColors();
  const color = fillColor ?? themeColors.text.primary();
  const particleLayerSize = size * PARTICLE_LAYER_MULTIPLIER;
  const styles = createStyles(color, checked, size, particleLayerSize, themeColors);

  // play particles burst only when transitioning to checked (not on initial load)
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
    onPress();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={1}
      style={styles.container}
    >
      {/* standard checkbox: border + fill + Ionicons checkmark */}
      <View style={styles.checkboxBox}>
        {checked && (
          <Ionicons
            name="checkmark"
            size={Math.round(size / 2)}
            color={themeColors.text.invertedPrimary()}
          />
        )}
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
  color?: string,
  checked?: boolean,
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
      borderWidth: 1.5,
      borderColor: checked ? (color ?? themeColors?.text.primary()) : (themeColors?.text.tertiary() ?? '#888'),
      backgroundColor: checked ? (color ?? themeColors?.text.primary()) : 'transparent',
      justifyContent: 'center',
      alignItems: 'center',
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
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
