/**
 * auth landing — email / apple / google rows styled like `OnboardingContinueButton` (regular glass, bleed halo, continue radius + paddings).
 * colors: email uses `AUTH_LANDING_SLIDE_UI` marple tint + blend label; apple tint is white with **light theme** `text.primary` (always dark on the white plate); google tint is blend + theme `text.primary`.
 * under the rows, `__DEV__` shows an underlined body-medium link to skip straight to slides (same route as the old continue FAB).
 */

import { Ionicons } from '@expo/vector-icons';
import type { Href } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import GlassView from 'expo-glass-effect/build/GlassView';

import { GoogleMarkIcon } from '@/components/ui/Icon';
import { ThemeColors } from '@/constants/ColorPalette';
import { Paddings } from '@/constants/Paddings';
import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { useThemeColors } from '@/hooks/useColorPalette';
import { ONBOARDING_SLIDES_CONTINUE_BUTTON_TEXT_STYLE } from '../../onboarding/constants/typography';

import { AUTH_LANDING_SLIDE_UI } from '../constants/slideUiTokens';
import {
  AUTH_LANDING_CONTINUE_WITH_APPLE_LABEL,
  AUTH_LANDING_CONTINUE_WITH_EMAIL_LABEL,
  AUTH_LANDING_CONTINUE_WITH_GOOGLE_LABEL,
  AUTH_LANDING_DEV_CONTINUE_WITHOUT_SIGN_IN_LABEL,
} from '../constants/textValues';
import { AUTH_LANDING_DEV_SKIP_SUBTEXT_STYLE } from '../constants/typography';
import { resolveIntroContinueButtonPaint } from '../scrollTransition';

/** questionnaire entry — same target the former auth continue FAB used */
const SLIDES_HREF = '/(onboarding)/slides' as Href;

/** one step tighter than `OnboardingContinueButton` vertical padding (`touchTargetSmall`) so stacked auth rows read lighter */
const authLandingAuthRowPaddingVertical =
  Paddings.onboardingContinueButtonPaddingVertical - Paddings.touchTargetSmall;

const authLandingAuthRowMinHeight =
  authLandingAuthRowPaddingVertical * 2 + Paddings.onboardingContinueButtonHitSlop * 2;

const onboardingContinueHitSlop = {
  top: Paddings.onboardingContinueButtonHitSlop,
  bottom: Paddings.onboardingContinueButtonHitSlop,
  left: Paddings.onboardingContinueButtonHitSlop,
  right: Paddings.onboardingContinueButtonHitSlop,
} as const;

const ROW_GAP = 4;
const ICON_SIZE = 24;
/** always dark primary copy on the white apple plate — `ThemeColors.light.text.primary`, not `useThemeColors().text.primary()` (that flips light in dark mode) */
const APPLE_AUTH_PRIMARY_DARK_TEXT = ThemeColors.light.text.primary;
/** apple row glass/solid fill — explicit white plate (brand convention) */
const APPLE_AUTH_PLATE_BACKGROUND = '#FFFFFF';

function getIOSMajor(): number {
  if (Platform.OS !== 'ios') return 0;
  const v = Platform.Version as string | number;
  return typeof v === 'string' ? parseInt(v.split('.')[0], 10) : Math.floor(v as number);
}

type GlassAuthRowProps = {
  label: string;
  accessibilityLabel: string;
  tintColor: string;
  labelColor: string;
} & (
  | { icon: React.ComponentProps<typeof Ionicons>['name']; leading?: never }
  | { icon?: never; leading: React.ReactNode }
);

function AuthLandingGlassAuthRow({
  label,
  icon,
  leading,
  accessibilityLabel,
  tintColor,
  labelColor,
}: GlassAuthRowProps) {
  const isNewerIOS = getIOSMajor() >= 15;
  const glassAvailable = Platform.OS === 'ios';
  const bleed = Paddings.liquidGlassBleed;

  const pressable = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={() => {}}
      hitSlop={onboardingContinueHitSlop}
      style={({ pressed }) => ({
        width: '100%',
        minHeight: authLandingAuthRowMinHeight,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: authLandingAuthRowPaddingVertical,
        paddingHorizontal: Paddings.onboardingContinueButtonPaddingHorizontal,
        borderRadius: Paddings.continueButtonRadius,
        gap: 10,
        opacity: pressed ? 0.92 : 1,
      })}
    >
      {leading ?? <Ionicons name={icon!} size={ICON_SIZE} color={labelColor} />}
      <Text style={[ONBOARDING_SLIDES_CONTINUE_BUTTON_TEXT_STYLE, { color: labelColor }]}>{label}</Text>
    </Pressable>
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

export type AuthLandingAuthMethodsSectionProps = {
  /** `footer` sits under the hero — drop top margin; `belowHeadline` keeps space under the slogan cluster */
  variant?: 'belowHeadline' | 'footer';
};

export function AuthLandingAuthMethodsSection({ variant = 'belowHeadline' }: AuthLandingAuthMethodsSectionProps) {
  const themeColors = useThemeColors();
  const router = useGuardedRouter();

  const onDevContinueWithoutSignIn = useCallback(() => {
    router.push(SLIDES_HREF);
  }, [router]);

  const emailTintColor = useMemo(
    () => resolveIntroContinueButtonPaint(themeColors, AUTH_LANDING_SLIDE_UI.continueButtonBackground),
    [themeColors],
  );
  /** apple sign-in convention — solid white plate */
  const appleTintColor = APPLE_AUTH_PLATE_BACKGROUND;
  const googleTintColor = useMemo(() => themeColors.background.primarySecondaryBlend(), [themeColors]);

  const emailLabelColor = useMemo(
    () =>
      resolveIntroContinueButtonPaint(
        themeColors,
        AUTH_LANDING_SLIDE_UI.continueButtonIcon ?? 'primarySecondaryBlend',
      ),
    [themeColors],
  );
  const googleLabelColor = useMemo(() => themeColors.text.primary(), [themeColors]);

  return (
    <View
      style={[styles.section, variant === 'footer' && styles.sectionFooter]}
      accessibilityRole="none"
    >
      <View style={styles.authRows}>
        <AuthLandingGlassAuthRow
          label={AUTH_LANDING_CONTINUE_WITH_EMAIL_LABEL}
          icon="mail-outline"
          accessibilityLabel={AUTH_LANDING_CONTINUE_WITH_EMAIL_LABEL}
          tintColor={emailTintColor}
          labelColor={emailLabelColor}
        />
        <AuthLandingGlassAuthRow
          label={AUTH_LANDING_CONTINUE_WITH_APPLE_LABEL}
          icon="logo-apple"
          accessibilityLabel={AUTH_LANDING_CONTINUE_WITH_APPLE_LABEL}
          tintColor={appleTintColor}
          labelColor={APPLE_AUTH_PRIMARY_DARK_TEXT}
        />
        <AuthLandingGlassAuthRow
          label={AUTH_LANDING_CONTINUE_WITH_GOOGLE_LABEL}
          leading={<GoogleMarkIcon size={ICON_SIZE} />}
          accessibilityLabel={AUTH_LANDING_CONTINUE_WITH_GOOGLE_LABEL}
          tintColor={googleTintColor}
          labelColor={googleLabelColor}
        />
      </View>
      {__DEV__ ? (
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={AUTH_LANDING_DEV_CONTINUE_WITHOUT_SIGN_IN_LABEL}
          onPress={onDevContinueWithoutSignIn}
          style={({ pressed }) => [styles.devSkipBlock, { opacity: pressed ? 0.75 : 1 }]}
        >
          <Text
            style={[
              AUTH_LANDING_DEV_SKIP_SUBTEXT_STYLE,
              styles.devSkipText,
              { color: themeColors.text.tertiary() },
            ]}
          >
            {AUTH_LANDING_DEV_CONTINUE_WITHOUT_SIGN_IN_LABEL}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: Paddings.screen + Paddings.touchTarget,
    width: '100%',
  },
  /** stacks the three glass rows — `gap` stays here so subtext gets clean `section` margin only */
  authRows: {
    width: '100%',
    gap: ROW_GAP,
  },
  sectionFooter: {
    marginTop: 0,
    paddingBottom: Paddings.section * 4,
  },
  /** dev-only link — one section band below social auth */
  devSkipBlock: {
    marginTop: Paddings.section,
    width: '100%',
    alignItems: 'center',
  },
  devSkipText: {
    textAlign: 'center',
  },
});
