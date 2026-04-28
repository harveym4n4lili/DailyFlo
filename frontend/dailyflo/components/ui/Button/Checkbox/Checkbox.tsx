/**
 * Checkbox - border + tick with opacity animation.
 * Tick is in a separate layer so it's not affected by the border's press scale.
 * When selectionMode: animates to a circular shape and slightly smaller size.
 */

import React, { useRef, useEffect } from 'react';
import { Animated, Pressable, View } from 'react-native';
import AnimatedReanimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { TickIcon } from '@/components/ui/Icon';
import { useThemeColors } from '@/hooks/useColorPalette';
import {
  CHECKBOX_SIZE_DEFAULT,
  CHECKBOX_TICK_SIZE_RATIO,
  CHECKBOX_TICK_ANIMATION_MS,
  CHECKBOX_SELECTION_MODE_SIZE_OFFSET,
  CHECKBOX_SELECTION_SHAPE_ANIMATION_MS,
} from '@/constants/Checkbox';

const MIN_TAP_AREA = 44;
const PRESS_SCALE = 1.3;
// default rounded-square (must be < size/2 so it's not a circle); selection mode animates to circle (size/2)
const BORDER_RADIUS = 8;

export interface CheckboxProps {
  checked: boolean;
  onPress?: () => void;
  disabled?: boolean;
  size?: number;
  expandTapArea?: boolean;
  scale?: number;
  scaleAnimated?: Animated.Value;
  /** when true: animates to circle + 1px smaller (used in TaskCard selection mode) */
  selectionMode?: boolean;
}

export function Checkbox({
  checked,
  onPress,
  disabled = false,
  size = CHECKBOX_SIZE_DEFAULT,
  expandTapArea = false,
  scale = 1,
  scaleAnimated: scaleAnimatedProp,
  selectionMode = false,
}: CheckboxProps) {
  const themeColors = useThemeColors();
  const borderColor = themeColors.text.tertiary();
  const tickColor = themeColors.text.primary();

  const padding = expandTapArea && size < MIN_TAP_AREA
    ? Math.max(0, Math.floor((MIN_TAP_AREA - size) / 2))
    : 0;
  const hitSlop = padding > 0 ? { top: padding, bottom: padding, left: padding, right: padding } : undefined;

  const builtInScale = useRef(new Animated.Value(1)).current;
  const scaleAnimated = scaleAnimatedProp ?? (onPress && !disabled ? builtInScale : undefined);

  const tickOpacity = useRef(new Animated.Value(checked ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(tickOpacity, {
      toValue: checked ? 1 : 0,
      duration: CHECKBOX_TICK_ANIMATION_MS,
      useNativeDriver: true,
    }).start();
  }, [checked, tickOpacity]);

  // --- selection mode shape (Reanimated on native/UI thread) ---
  // always start at 0 so we animate from rounded-square -> circle when entering selection mode
  const selectionProgress = useSharedValue(0);
  const selectionSizeSmall = size - CHECKBOX_SELECTION_MODE_SIZE_OFFSET;
  const selectionRadiusCircle = selectionSizeSmall / 2;
  const selectionScale = selectionSizeSmall / size;

  // when selectionMode changes, animate between default + circular shape on UI thread
  useEffect(() => {
    selectionProgress.value = withTiming(selectionMode ? 1 : 0, {
      duration: CHECKBOX_SELECTION_SHAPE_ANIMATION_MS,
    });
  }, [selectionMode, selectionProgress]);

  const springConfig = { damping: 20, stiffness: 250, mass: 0.2, useNativeDriver: true };

  // tap-only animation: always play scale up then down, independent of hold duration
  const animateTap = () => {
    builtInScale.setValue(1);
    Animated.sequence([
      Animated.spring(builtInScale, { toValue: PRESS_SCALE, ...springConfig }),
      Animated.spring(builtInScale, { toValue: 1, ...springConfig }),
    ]).start();
  };

  const borderStyle: any = {
    width: size,
    height: size,
    borderRadius: BORDER_RADIUS,
    borderWidth: 1.5,
    borderColor,
  };
  if (scaleAnimated) {
    borderStyle.transform = [{ scale: scaleAnimated }];
  } else if (scale !== 1) {
    borderStyle.transform = [{ scale }];
  }

  const tickSize = size * CHECKBOX_TICK_SIZE_RATIO;

  // container size animates 22px -> (22 - offset)px on native thread
  const selectionContainerStyle = useAnimatedStyle(
    () => ({
      width: interpolate(selectionProgress.value, [0, 1], [size, selectionSizeSmall]),
      height: interpolate(selectionProgress.value, [0, 1], [size, selectionSizeSmall]),
      position: 'relative' as const,
    }),
    [size, selectionSizeSmall],
  );

  // border animates borderRadius and size on native thread
  const selectionBorderStyle = useAnimatedStyle(
    () => ({
      width: interpolate(selectionProgress.value, [0, 1], [size, selectionSizeSmall]),
      height: interpolate(selectionProgress.value, [0, 1], [size, selectionSizeSmall]),
      borderRadius: interpolate(
        selectionProgress.value,
        [0, 1],
        [BORDER_RADIUS, selectionRadiusCircle],
      ),
      borderWidth: 1.5,
      borderColor,
      position: 'absolute' as const,
      left: 0,
      top: 0,
    }),
    [size, selectionSizeSmall, selectionRadiusCircle, borderColor],
  );

  // tick scales with the checkbox size on native thread
  const selectionTickScaleStyle = useAnimatedStyle(
    () => ({
      transform: [
        {
          scale: interpolate(selectionProgress.value, [0, 1], [1, selectionScale]),
        },
      ],
    }),
    [selectionScale],
  );

  // always use the Reanimated-driven shape (so we can animate both enter and exit)
  const reanimatedContent = (
    <AnimatedReanimated.View style={selectionContainerStyle}>
      <AnimatedReanimated.View style={selectionBorderStyle} />
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          justifyContent: 'center',
          alignItems: 'center',
        }}
        pointerEvents="none"
      >
        <AnimatedReanimated.View style={selectionTickScaleStyle}>
          <Animated.View style={{ opacity: tickOpacity }}>
            <TickIcon size={tickSize} color={tickColor} />
          </Animated.View>
        </AnimatedReanimated.View>
      </View>
    </AnimatedReanimated.View>
  );
  const content = reanimatedContent;

  if (onPress && !disabled) {
    const useBuiltInScale = !scaleAnimatedProp;
    const wrappedContent = useBuiltInScale ? (
      <Animated.View style={{ transform: [{ scale: builtInScale }] }}>
        {content}
      </Animated.View>
    ) : (
      content
    );

    return (
      <Pressable
        onPress={() => {
          if (useBuiltInScale) {
            animateTap();
          }
          onPress();
        }}
        hitSlop={hitSlop}
        style={{ alignSelf: 'center' }}
      >
        {wrappedContent}
      </Pressable>
    );
  }
  return content;
}