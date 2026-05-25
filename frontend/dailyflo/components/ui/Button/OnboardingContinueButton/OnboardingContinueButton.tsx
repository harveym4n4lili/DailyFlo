/**
 * full-width onboarding continue — text label, liquid glass on iOS 15+ (`expo-glass-effect`),
 * solid `tintColor` on android/web/older ios. outer bleed matches `ContinueButton` so blur isn’t clipped.
 */

import React from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { Paddings } from '@/constants/Paddings';
// build path avoids bad re-exports from package root (same as `ContinueButton`)
import GlassView from 'expo-glass-effect/build/GlassView';

/** min tap height — uses onboarding padding + hitSlop tokens from `Paddings` */
const onboardingContinueMinHeight =
  Paddings.onboardingContinueButtonPaddingVertical * 2 + Paddings.onboardingContinueButtonHitSlop * 2;

const onboardingContinueHitSlop = {
  top: Paddings.onboardingContinueButtonHitSlop,
  bottom: Paddings.onboardingContinueButtonHitSlop,
  left: Paddings.onboardingContinueButtonHitSlop,
  right: Paddings.onboardingContinueButtonHitSlop,
} as const;

function getIOSMajor(): number {
  if (Platform.OS !== 'ios') return 0;
  const v = Platform.Version as string | number;
  return typeof v === 'string' ? parseInt(v.split('.')[0], 10) : Math.floor(v as number);
}

export interface OnboardingContinueButtonProps {
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  label: string;
  /** typography from onboarding constants + `{ color }` merged here */
  labelStyle: StyleProp<TextStyle>;
  /** native glass tint + solid fallback fill — slide row `continueButtonBackground` */
  tintColor: string;
  /** `ActivityIndicator` + fallback if label omits color — slide row `continueButtonIcon` */
  labelColor: string;
  accessibilityLabel?: string;
  testID?: string;
  /** outer halo wrapper (width usually comes from parent `alignSelf: 'stretch'`) */
  style?: StyleProp<ViewStyle>;
}

export function OnboardingContinueButton({
  onPress,
  disabled = false,
  loading = false,
  label,
  labelStyle,
  tintColor,
  labelColor,
  accessibilityLabel,
  testID,
  style,
}: OnboardingContinueButtonProps) {
  const isNewerIOS = getIOSMajor() >= 15;
  const glassAvailable = Platform.OS === 'ios';
  const bleed = Paddings.liquidGlassBleed;
  const inactive = disabled || loading;

  // pressable fills the glass/solid surface; opacity hints loading/disabled without swapping layout
  const pressable = (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => ({
        width: '100%',
        minHeight: onboardingContinueMinHeight,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Paddings.onboardingContinueButtonPaddingVertical,
        paddingHorizontal: Paddings.onboardingContinueButtonPaddingHorizontal,
        borderRadius: Paddings.continueButtonRadius,
        opacity: inactive ? 0.75 : pressed ? 0.92 : 1,
      })}
      hitSlop={onboardingContinueHitSlop}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: inactive }}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator color={labelColor} />
      ) : (
        <Text style={labelStyle}>{label}</Text>
      )}
    </Pressable>
  );

  const haloWrap: ViewStyle = {
    overflow: 'visible',
    padding: bleed,
    alignSelf: 'stretch',
  };

  const surfaceStyle: ViewStyle = {
    width: '100%',
    minHeight: onboardingContinueMinHeight,
    borderRadius: Paddings.continueButtonRadius,
    overflow: 'visible',
  };

  const shell = (
    <View style={[haloWrap, style]}>
      {isNewerIOS && glassAvailable ? (
        <GlassView
          style={surfaceStyle}
          tintColor={tintColor as any}
          glassEffectStyle="regular"
          isInteractive
        >
          {pressable}
        </GlassView>
      ) : (
        <View style={[surfaceStyle, { backgroundColor: tintColor, overflow: 'hidden' }]}>{pressable}</View>
      )}
    </View>
  );

  return shell;
}

export default OnboardingContinueButton;
