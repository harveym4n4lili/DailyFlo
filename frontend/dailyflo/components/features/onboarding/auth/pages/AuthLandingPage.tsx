/**
 * brand title on the auth landing route — vertically aligned with questionnaire body tops (`OnboardingSlidesShell` uses
 * `useHeaderHeight()`; auth has no native header, so we add `getDefaultHeaderHeight(...) - insets.top` on top of the shell’s safe-area pad).
 * type: `TextStyles['auth-landing-title']` + `getAuthLandingPageTitleTextStyle` (Satoshi) in `@/constants/Typography`.
 */

import { getAuthLandingPageTitleTextStyle } from '@/constants/Typography';
import { getDefaultHeaderHeight } from '@react-navigation/elements';
import React, { useMemo } from 'react';
import { Platform, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Paddings } from '@/constants/Paddings';
import { useThemeColors } from '@/hooks/useColorPalette';

import {
  AUTH_GAP_BELOW_HEADER,
  AUTH_LANDING_DAILYFLO_TITLE,
  AUTH_LANDING_DAILYFLO_TITLE_COLOR_TOKEN,
  AUTH_LANDING_WORDMARK_APP_ICON_RADIUS_RATIO,
  AUTH_LANDING_WORDMARK_ICON_SIZE,
  AUTH_LANDING_WORDMARK_ICON_TITLE_GAP,
  AUTH_LANDING_WORDMARK_MARK_COLOR_TOKEN,
} from '../constants';
import { resolveIntroTextColor } from '../scrollTransition';
import { AuthLandingWordmarkIcon } from '../ui';

export function AuthLandingPage() {
  const themeColors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  // same total top band as native stack + status bar on `slides/index` — `(onboarding)` is `fullScreenModal` on ios, so we pass modal header (56pt + status) to match `useHeaderHeight()` there. shell already applies `insets.top`; subtract so we don’t double-count safe area.
  const stackHeaderTotalPx = getDefaultHeaderHeight(
    { width, height },
    Platform.OS === 'ios',
    insets.top,
  );
  const titleTopPad =
    Math.max(0, stackHeaderTotalPx - insets.top) +
    AUTH_GAP_BELOW_HEADER +
    // breathing room past the “invisible” stack bar — ties to full-screen padding + slides header row gap so it matches questionnaire density
    Paddings.screen +
    Paddings.onboardingSlidesHeaderSectionGap;

  const wordmarkColor = useMemo(
    () => resolveIntroTextColor(themeColors, AUTH_LANDING_DAILYFLO_TITLE_COLOR_TOKEN),
    [themeColors],
  );

  // satoshi face + metrics from `TextStyles['auth-landing-title']` — pass runtime platform so the correct loaded ttf name is used
  const titleStyle = [
    getAuthLandingPageTitleTextStyle(Platform.OS === 'web' ? 'web' : Platform.OS === 'android' ? 'android' : 'ios'),
    { color: wordmarkColor },
  ];

  const wordmarkBorderRadius = useMemo(
    () =>
      Math.max(
        4,
        Math.round(AUTH_LANDING_WORDMARK_ICON_SIZE * AUTH_LANDING_WORDMARK_APP_ICON_RADIUS_RATIO),
      ),
    [],
  );

  return (
    <View style={[styles.topAligned, { paddingTop: titleTopPad }]}>
      <View style={styles.wordmarkRow}>
        <AuthLandingWordmarkIcon
          size={AUTH_LANDING_WORDMARK_ICON_SIZE}
          borderRadius={wordmarkBorderRadius}
          markColorToken={AUTH_LANDING_WORDMARK_MARK_COLOR_TOKEN}
        />
        <Text style={titleStyle}>{AUTH_LANDING_DAILYFLO_TITLE.title}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topAligned: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  // row is only as wide as icon + title; parent `alignItems: center` centers that cluster on the screen
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AUTH_LANDING_WORDMARK_ICON_TITLE_GAP,
  },
});
