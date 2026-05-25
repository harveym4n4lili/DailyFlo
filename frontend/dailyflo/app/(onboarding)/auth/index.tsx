/**
 * auth route — single brand screen before the questionnaire (`slides/`).
 * expo maps this file to `/(onboarding)/auth`; the stack hides the native header so we fill edge-to-edge.
 * social rows sit in a pinned footer (continue FAB removed until navigation wires from auth methods).
 */

import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AUTH_PAGE_SLIDE_UI,
  AuthLandingAuthMethodsSection,
  AuthLandingPage,
  OnboardingAuthShell,
  resolveIntroBackgroundColor,
} from '@/components/features/onboarding';
import { Paddings } from '@/constants/Paddings';
import { useThemeColors } from '@/hooks/useColorPalette';

export default function OnboardingAuthScreen() {
  const themeColors = useThemeColors();
  const insets = useSafeAreaInsets();
  const row = AUTH_PAGE_SLIDE_UI[0];

  const backgroundColor = useMemo(
    () => resolveIntroBackgroundColor(themeColors, row.background),
    [row.background, themeColors],
  );

  return (
    <View style={[styles.root, { backgroundColor }]}>
      <OnboardingAuthShell>
        <AuthLandingPage />
      </OnboardingAuthShell>

      <View
        style={[
          styles.authFooter,
          {
            paddingBottom: Math.max(insets.bottom, Paddings.screen),
          },
        ]}
        pointerEvents="box-none"
      >
        <AuthLandingAuthMethodsSection variant="footer" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  /** same horizontal gutter as `OnboardingAuthShell` + questionnaire continue footer */
  authFooter: {
    paddingHorizontal: Paddings.screen + Paddings.touchTarget,
    paddingTop: Paddings.touchTarget,
    zIndex: 10,
    elevation: 10,
  },
});
