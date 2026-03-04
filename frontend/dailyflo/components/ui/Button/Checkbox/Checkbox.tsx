/**
 * Checkbox - border + tick with opacity animation.
 * Tick is in a separate layer so it's not affected by the border's press scale.
 */

import React, { useRef, useEffect } from 'react';
import { Animated, Pressable, View } from 'react-native';
import { TickIcon } from '@/components/ui/icon';
import { useThemeColors } from '@/hooks/useColorPalette';
import { CHECKBOX_SIZE_DEFAULT, CHECKBOX_TICK_SIZE_RATIO } from '@/constants/Checkbox';

const MIN_TAP_AREA = 44;
const PRESS_SCALE = 1.5;
const BORDER_RADIUS = 8;

export interface CheckboxProps {
  checked: boolean;
  onPress?: () => void;
  disabled?: boolean;
  size?: number;
  expandTapArea?: boolean;
  scale?: number;
  scaleAnimated?: Animated.Value;
}

export function Checkbox({
  checked,
  onPress,
  disabled = false,
  size = CHECKBOX_SIZE_DEFAULT,
  expandTapArea = false,
  scale = 1,
  scaleAnimated: scaleAnimatedProp,
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
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [checked, tickOpacity]);

  const springConfig = { damping: 20, stiffness: 100, mass: 0.4, useNativeDriver: true };
  const handlePressIn = () => {
    Animated.spring(builtInScale, { toValue: PRESS_SCALE, ...springConfig }).start();
  };
  const handlePressOut = () => {
    Animated.spring(builtInScale, { toValue: 1, ...springConfig }).start();
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
  const content = (
    <View style={{ width: size, height: size, position: 'relative' }}>
      <Animated.View style={[borderStyle, { position: 'absolute', left: 0, top: 0 }]} />
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
        <Animated.View style={{ opacity: tickOpacity }}>
          <TickIcon size={tickSize} color={tickColor} />
        </Animated.View>
      </View>
    </View>
  );

  const useBuiltInScale = !scaleAnimatedProp && onPress && !disabled;
  if (onPress && !disabled) {
    return (
      <Pressable
        onPress={onPress}
        onPressIn={useBuiltInScale ? handlePressIn : undefined}
        onPressOut={useBuiltInScale ? handlePressOut : undefined}
        hitSlop={hitSlop}
        style={{ alignSelf: 'flex-start' }}
      >
        {content}
      </Pressable>
    );
  }
  return content;
}