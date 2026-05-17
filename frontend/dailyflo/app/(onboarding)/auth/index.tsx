/**
 * auth route — single brand screen before the questionnaire (`slides/`).
 * expo maps this file to `/(onboarding)/auth`; the stack hides the native header so we fill edge-to-edge.
 */

import React, { useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  AUTH_PAGE_SLIDE_UI,
  AuthLandingPage,
  OnboardingAuthShell,
  resolveIntroBackgroundColor,
  resolveIntroContinueButtonPaint,
} from '@/components/features/onboarding';
import { ContinueButton } from '@/components/ui/Button';
import { ArrowLongRightIcon } from '@/components/ui/Icon';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import type { Href } from 'expo-router';

// questionnaire stack — cast keeps tsc happy until expo regenerates route types from the file tree
const SLIDES_HREF = '/(onboarding)/slides' as Href;

export default function OnboardingAuthScreen() {
  const themeColors = useThemeColors();
  const router = useGuardedRouter();
  const row = AUTH_PAGE_SLIDE_UI[0];

  const backgroundColor = useMemo(
    () => resolveIntroBackgroundColor(themeColors, row.background),
    [row.background, themeColors],
  );

  const fillColor = useMemo(
    () => resolveIntroContinueButtonPaint(themeColors, row.continueButtonBackground),
    [row.continueButtonBackground, themeColors],
  );

  const onContinue = useCallback(() => {
    router.push(SLIDES_HREF);
  }, [router]);

  return (
    <View style={[styles.root, { backgroundColor }]}>
      <OnboardingAuthShell>
        <AuthLandingPage />
      </OnboardingAuthShell>

      <View style={[StyleSheet.absoluteFillObject, { zIndex: 10, elevation: 10 }]} pointerEvents="box-none">
        {/* icon uses same hex as root background (`row.background`) */}
        <ContinueButton
          onPress={onContinue}
          fillColor={fillColor}
          iconColor={backgroundColor}
          renderIcon={(c) => <ArrowLongRightIcon size={22} color={c} />}
          accessibilityLabel="Continue to onboarding"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
