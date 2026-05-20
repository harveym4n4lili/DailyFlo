/**
 * auth landing — email / apple / google rows styled like `OnboardingContinueButton` (regular glass, bleed halo, continue radius + paddings).
 * colors: email uses `AUTH_LANDING_SLIDE_UI` marple tint + blend label; apple tint is white with **light theme** `text.primary` (always dark on the white plate); google tint is blend + theme `text.primary`.
 * under the rows, `__DEV__` shows an underlined body-medium link to skip straight to slides (same route as the old continue FAB).
 */

import { Ionicons } from '@expo/vector-icons';
import type { Href } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { GoogleMarkIcon } from '@/components/ui/Icon';
import { ThemeColors } from '@/constants/ColorPalette';
import { Paddings } from '@/constants/Paddings';
import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { useThemeColors } from '@/hooks/useColorPalette';

import { AUTH_LANDING_SLIDE_UI } from '../constants/slideUiTokens';
import {
  AUTH_LANDING_CONTINUE_WITH_APPLE_LABEL,
  AUTH_LANDING_CONTINUE_WITH_GOOGLE_LABEL,
  AUTH_LANDING_DEV_CONTINUE_WITHOUT_SIGN_IN_LABEL,
} from '../constants/textValues';
import { AUTH_LANDING_DEV_SKIP_SUBTEXT_STYLE } from '../constants/typography';
import { useAppleAuthOnboarding } from '../hooks/useAppleAuthOnboarding';
import { useGoogleAuthOnboarding } from '../hooks/useGoogleAuthOnboarding';
import { resolveIntroContinueButtonPaint } from '../scrollTransition';

import { AuthEmailMethodMenuRow } from './AuthEmailMethodMenuRow';
import { AuthLandingGlassAuthRow } from './AuthLandingGlassAuthRow';

/** questionnaire entry — same target the former auth continue FAB used */
const SLIDES_HREF = '/(onboarding)/slides' as Href;

const ROW_GAP = 4;
const ICON_SIZE = 24;
/** always dark primary copy on the white apple plate — `ThemeColors.light.text.primary`, not `useThemeColors().text.primary()` (that flips light in dark mode) */
const APPLE_AUTH_PRIMARY_DARK_TEXT = ThemeColors.light.text.primary;
/** apple row glass/solid fill — explicit white plate (brand convention) */
const APPLE_AUTH_PLATE_BACKGROUND = '#FFFFFF';

/** same horizontal gutter as `app/(onboarding)/auth/index.tsx` footer — dropdown anchors on android */
export const AUTH_LANDING_EMAIL_DROPDOWN_LEFT_OFFSET = Paddings.screen + Paddings.touchTarget;

export type AuthLandingAuthMethodsSectionProps = {
  /** `footer` sits under the hero — drop top margin; `belowHeadline` keeps space under the slogan cluster */
  variant?: 'belowHeadline' | 'footer';
};

export function AuthLandingAuthMethodsSection({ variant = 'belowHeadline' }: AuthLandingAuthMethodsSectionProps) {
  const themeColors = useThemeColors();
  const router = useGuardedRouter();
  const { onApplePress, appleBusy, appleReady } = useAppleAuthOnboarding();
  const { onGooglePress, googleBusy, googleReady } = useGoogleAuthOnboarding();

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
        <AuthEmailMethodMenuRow
          tintColor={emailTintColor}
          labelColor={emailLabelColor}
          dropdownLeftOffset={AUTH_LANDING_EMAIL_DROPDOWN_LEFT_OFFSET}
        />
        {appleReady ? (
          <AuthLandingGlassAuthRow
            label={AUTH_LANDING_CONTINUE_WITH_APPLE_LABEL}
            icon="logo-apple"
            accessibilityLabel={AUTH_LANDING_CONTINUE_WITH_APPLE_LABEL}
            tintColor={appleTintColor}
            labelColor={APPLE_AUTH_PRIMARY_DARK_TEXT}
            onPress={onApplePress}
            disabled={appleBusy}
          />
        ) : null}
        <AuthLandingGlassAuthRow
          label={AUTH_LANDING_CONTINUE_WITH_GOOGLE_LABEL}
          leading={<GoogleMarkIcon size={ICON_SIZE} />}
          accessibilityLabel={AUTH_LANDING_CONTINUE_WITH_GOOGLE_LABEL}
          tintColor={googleTintColor}
          labelColor={googleLabelColor}
          onPress={onGooglePress}
          disabled={!googleReady || googleBusy}
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
