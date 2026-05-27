/**
 * MainSubmitButton – same glass circle chrome as MainCloseButton / MainBackButton,
 * but shows a checkmark (SF Symbol) for confirming modal forms (e.g. new list).
 * When animateVisibility: same scale spring show/hide as task-create SaveButton (TaskScreenContent + SaveButton.tsx).
 */

import React, { useEffect } from 'react';
import { Pressable, Text, Platform, useWindowDimensions, View } from 'react-native';
import AnimatedReanimated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { SFSymbolIcon } from '@/components/ui/Icon';
import { getTextStyle } from '@/constants/Typography';
import { Paddings } from '@/constants/Paddings';
import { useThemeColors, useColorPalette } from '@/hooks/useColorPalette';
import GlassView from 'expo-glass-effect/build/GlassView';
import {
  SAVE_BUTTON_SPRING_SHOW,
  SAVE_BUTTON_SPRING_HIDE,
} from '@/components/ui/Button/SaveButton/SaveButton';

export interface MainSubmitButtonProps {
  onPress: () => void;
  top?: number;
  left?: number;
  right?: number;
  /** when true, tap is ignored and the control is invisible (no faded chrome) */
  disabled?: boolean;
  accessibilityLabel?: string;
  /**
   * when false, keeps the old always-visible + opacity dim when disabled (legacy).
   * when true (default), same Reanimated scale springs as SaveButton visible prop (task create).
   */
  animateVisibility?: boolean;
  /** marple liquid-glass circle + canvas checkmark — display apply when draft has changes */
  brandActive?: boolean;
  /**
   * modal: fullscreen overlay + absolute position (default — android modal chrome).
   * inline: compact 42×42 glass circle for headerRight / toolbar slots (ios display apply).
   */
  layout?: 'modal' | 'inline';
}

export const MainSubmitButton: React.FC<MainSubmitButtonProps> = ({
  onPress,
  top,
  left,
  right,
  disabled = false,
  accessibilityLabel = 'Save',
  animateVisibility = true,
  brandActive = false,
  layout = 'modal',
}) => {
  const themeColors = useThemeColors();
  const { getMarpleBrandColor } = useColorPalette();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const visible = !disabled;
  const submitScale = useSharedValue(animateVisibility ? (visible ? 1 : 0) : 1);

  useEffect(() => {
    if (!animateVisibility) return;
    submitScale.value = withSpring(
      visible ? 1 : 0,
      visible ? SAVE_BUTTON_SPRING_SHOW : SAVE_BUTTON_SPRING_HIDE
    );
  }, [visible, animateVisibility, submitScale]);

  const submitAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: submitScale.value }],
  }));

  const getIOSVersion = (): number => {
    if (Platform.OS !== 'ios') return 0;
    const version = Platform.Version as string;
    const majorVersion =
      typeof version === 'string' ? parseInt(version.split('.')[0], 10) : Math.floor(version as number);
    return majorVersion;
  };

  const isNewerIOS = getIOSVersion() >= 15;
  const marpleFill = getMarpleBrandColor(500);
  const iconColor =
    brandActive && !disabled ? themeColors.background.primary() : themeColors.text.primary();
  const closeButtonBackgroundColor =
    brandActive && !disabled ? marpleFill : themeColors.background.primary();
  const topPosition = top !== undefined ? top : 20;
  const glassAvailable = Platform.OS === 'ios';
  const isInline = layout === 'inline';

  const glassCircleStyle = {
    width: 42,
    height: 42,
    borderRadius: 24,
    overflow: 'visible' as const,
  };

  const basePositionStyle = {
    position: 'absolute' as const,
    ...(right !== undefined ? { right } : { left: left ?? 0 }),
    top: topPosition,
    zIndex: brandActive && !disabled ? 20 : 10,
  };

  const absoluteWrapperStyle = {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: windowWidth,
    height: windowHeight,
    zIndex: brandActive && !disabled ? 20 : 10,
  };

  const handlePress = () => {
    if (!disabled) onPress();
  };

  const legacyOpacity = disabled ? 0.45 : 1;
  const hitWrapperPointerEvents =
    animateVisibility && disabled ? 'none' : ('box-none' as const);

  // glass is visual only — Pressable owns taps (isInteractive on GlassView can swallow touches)
  const renderGlassButton = (Outer: typeof View | typeof AnimatedReanimated.View, outerExtraStyle: object) => (
    <Outer
      pointerEvents={isInline ? 'auto' : hitWrapperPointerEvents}
      style={
        isInline
          ? [glassCircleStyle, outerExtraStyle]
          : [basePositionStyle, glassCircleStyle, outerExtraStyle]
      }
    >
      <GlassView
        style={glassCircleStyle}
        tintColor={closeButtonBackgroundColor as any}
        glassEffectStyle="regular"
        isInteractive={false}
      >
        <Pressable
          onPress={handlePress}
          disabled={disabled}
          style={{
            width: '100%',
            height: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 0,
            borderColor: themeColors.border.primary(),
            borderRadius: 21,
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          accessibilityState={{ disabled }}
        >
          <SFSymbolIcon
            name="checkmark"
            size={22}
            color={iconColor}
            fallback={<Ionicons name="checkmark" size={26} color={iconColor} />}
          />
        </Pressable>
      </GlassView>
    </Outer>
  );

  if (isNewerIOS && glassAvailable) {
    const Outer = animateVisibility ? AnimatedReanimated.View : View;
    const outerExtraStyle = animateVisibility
      ? submitAnimatedStyle
      : { opacity: legacyOpacity, transform: [{ scale: 1 }] };

    const glassBody = renderGlassButton(Outer, outerExtraStyle);
    if (isInline) {
      return glassBody;
    }

    return (
      <View pointerEvents="box-none" style={absoluteWrapperStyle}>
        {glassBody}
      </View>
    );
  }

  const Outer = animateVisibility ? AnimatedReanimated.View : View;
  const outerExtraStyle = animateVisibility
    ? submitAnimatedStyle
    : { opacity: legacyOpacity, transform: [{ scale: 1 }] };

  const fallbackPressableStyle = isInline
    ? brandActive && !disabled
      ? {
          width: 42,
          height: 42,
          borderRadius: 21,
          alignItems: 'center' as const,
          justifyContent: 'center' as const,
          backgroundColor: marpleFill,
        }
      : isNewerIOS
      ? {
          width: 42,
          height: 42,
          borderRadius: 21,
          alignItems: 'center' as const,
          justifyContent: 'center' as const,
          backgroundColor: closeButtonBackgroundColor,
        }
      : {
          paddingHorizontal: Paddings.contextMenuHorizontal,
          paddingVertical: Paddings.contextMenuVertical,
          borderRadius: 20,
          backgroundColor: themeColors.interactive.primary(),
        }
    : {
        ...(brandActive && !disabled
          ? {
              width: 42,
              height: 42,
              borderRadius: 21,
              alignItems: 'center' as const,
              justifyContent: 'center' as const,
              backgroundColor: marpleFill,
            }
          : isNewerIOS
          ? {
              width: 42,
              height: 42,
              borderRadius: 21,
              alignItems: 'center' as const,
              justifyContent: 'center' as const,
              backgroundColor: closeButtonBackgroundColor,
            }
          : {
              paddingHorizontal: Paddings.contextMenuHorizontal,
              paddingVertical: Paddings.contextMenuVertical,
              borderRadius: 20,
              backgroundColor: themeColors.interactive.primary(),
            }),
      };

  const fallbackButton = (
    <Outer
      pointerEvents={isInline ? 'auto' : hitWrapperPointerEvents}
      style={isInline ? outerExtraStyle : [basePositionStyle, outerExtraStyle]}
    >
      <Pressable
        onPress={handlePress}
        disabled={disabled}
        style={fallbackPressableStyle}
        hitSlop={isInline ? { top: 8, bottom: 8, left: 8, right: 8 } : undefined}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled }}
      >
        {isNewerIOS || (brandActive && !disabled) ? (
          <SFSymbolIcon
            name="checkmark"
            size={22}
            color={iconColor}
            fallback={<Ionicons name="checkmark" size={26} color={iconColor} />}
          />
        ) : (
          <Text style={{ ...getTextStyle('button-secondary'), color: '#FFFFFF' }}>Save</Text>
        )}
      </Pressable>
    </Outer>
  );

  if (isInline) {
    return fallbackButton;
  }

  return (
    <View pointerEvents="box-none" style={absoluteWrapperStyle}>
      {fallbackButton}
    </View>
  );
};

export default MainSubmitButton;
