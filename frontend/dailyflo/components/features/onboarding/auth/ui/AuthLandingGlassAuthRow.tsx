/**
 * shared liquid-glass row for onboarding auth landing (email / apple / google).
 * extracted so the email row can be wrapped in SwiftUI Menu on ios without duplicating glass logic.
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, Pressable, Text, View, type ViewStyle } from 'react-native';
import GlassView from 'expo-glass-effect/build/GlassView';

import { Paddings } from '@/constants/Paddings';
import { ONBOARDING_SLIDES_CONTINUE_BUTTON_TEXT_STYLE } from '../../onboarding/constants/typography';

export const authLandingAuthRowPaddingVertical =
  Paddings.onboardingContinueButtonPaddingVertical - Paddings.touchTargetSmall;

export const authLandingAuthRowMinHeight =
  authLandingAuthRowPaddingVertical * 2 + Paddings.onboardingContinueButtonHitSlop * 2;

export const onboardingContinueHitSlop = {
  top: Paddings.onboardingContinueButtonHitSlop,
  bottom: Paddings.onboardingContinueButtonHitSlop,
  left: Paddings.onboardingContinueButtonHitSlop,
  right: Paddings.onboardingContinueButtonHitSlop,
} as const;

const ICON_SIZE = 24;

function getIOSMajor(): number {
  if (Platform.OS !== 'ios') return 0;
  const v = Platform.Version as string | number;
  return typeof v === 'string' ? parseInt(v.split('.')[0], 10) : Math.floor(v as number);
}

export type AuthLandingGlassAuthRowProps = {
  label: string;
  accessibilityLabel: string;
  tintColor: string;
  labelColor: string;
  onPress?: () => void;
  disabled?: boolean;
  /** when false, row is display-only (ios SwiftUI Menu owns the tap target — avoids nested pressables) */
  interactive?: boolean;
} & (
  | { icon: React.ComponentProps<typeof Ionicons>['name']; leading?: never }
  | { icon?: never; leading: React.ReactNode }
);

export function AuthLandingGlassAuthRow({
  label,
  icon,
  leading,
  accessibilityLabel,
  tintColor,
  labelColor,
  onPress,
  disabled = false,
  interactive = true,
}: AuthLandingGlassAuthRowProps) {
  const isNewerIOS = getIOSMajor() >= 15;
  const glassAvailable = Platform.OS === 'ios';
  const bleed = Paddings.liquidGlassBleed;

  const rowInnerStyle = {
    width: '100%' as const,
    minHeight: authLandingAuthRowMinHeight,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: authLandingAuthRowPaddingVertical,
    paddingHorizontal: Paddings.onboardingContinueButtonPaddingHorizontal,
    borderRadius: Paddings.continueButtonRadius,
    gap: 10,
  };

  const inner = (
    <>
      {leading ?? <Ionicons name={icon!} size={ICON_SIZE} color={labelColor} />}
      <Text style={[ONBOARDING_SLIDES_CONTINUE_BUTTON_TEXT_STYLE, { color: labelColor }]}>{label}</Text>
    </>
  );

  const pressable = interactive ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress ?? (() => {})}
      disabled={disabled}
      hitSlop={onboardingContinueHitSlop}
      style={({ pressed }) => ({
        ...rowInnerStyle,
        opacity: disabled ? 0.5 : pressed ? 0.92 : 1,
      })}
    >
      {inner}
    </Pressable>
  ) : (
    <View
      accessibilityLabel={accessibilityLabel}
      style={{ ...rowInnerStyle, opacity: disabled ? 0.5 : 1 }}
    >
      {inner}
    </View>
  );

  const haloWrap: ViewStyle = {
    overflow: 'visible',
    padding: bleed,
    alignSelf: 'stretch',
  };

  const surfaceStyle = {
    width: '100%' as const,
    minHeight: authLandingAuthRowMinHeight,
    borderRadius: Paddings.continueButtonRadius,
    overflow: 'visible' as const,
  };

  return (
    <View style={haloWrap}>
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
}
