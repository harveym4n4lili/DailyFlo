/**
 * post-setup notifications permission — last screen before dismissing onboarding to Today.
 * header hidden so layout matches auth landing (full-bleed background + footer CTAs).
 */

import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  AUTH_PAGE_SLIDE_UI,
  OnboardingNotificationsPage,
  resolveIntroBackgroundColor,
} from '@/components/features/onboarding';
import { useThemeColors } from '@/hooks/useColorPalette';

export default function OnboardingNotificationsRoute() {
  const themeColors = useThemeColors();
  const row = AUTH_PAGE_SLIDE_UI[0];

  const backgroundColor = useMemo(
    () => resolveIntroBackgroundColor(themeColors, row.background),
    [row.background, themeColors],
  );

  return (
    <View style={[styles.root, { backgroundColor }]}>
      <OnboardingNotificationsPage />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
