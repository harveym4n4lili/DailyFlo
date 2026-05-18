/**
 * auth landing — **Flow** (satoshi) + middle heading in the lead wrap; **matters,** + **to you.** (satoshi) + marple wordmark in `tailAndIconRow`.
 */

import { getDefaultHeaderHeight } from '@react-navigation/elements';
import React, { useMemo } from 'react';
import { Platform, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Paddings } from '@/constants/Paddings';
import { useThemeColors } from '@/hooks/useColorPalette';

import { getAuthLandingPageTitleTextStyle } from '@/constants/Typography';

import {
  AUTH_GAP_BELOW_HEADER,
  AUTH_LANDING_SLIDE_UI,
  AUTH_LANDING_SLOGAN_LEAD,
  AUTH_LANDING_SLOGAN_MIDDLE_BEFORE_TAIL,
  AUTH_LANDING_SLOGAN_MIDDLE_LEAD,
  AUTH_LANDING_SLOGAN_TAIL,
  AUTH_LANDING_WORDMARK_APP_ICON_RADIUS_RATIO,
  AUTH_LANDING_WORDMARK_ICON_SIZE,
  getAuthLandingSloganMiddleTextStyle,
} from '../constants';
import { resolveIntroTextColor } from '../scrollTransition';
import { AuthLandingWordmarkIcon } from '../ui';

export function AuthLandingPage() {
  const themeColors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const typoPlatform =
    Platform.OS === 'web' ? 'web' : Platform.OS === 'android' ? 'android' : 'ios';

  const stackHeaderTotalPx = getDefaultHeaderHeight(
    { width, height },
    Platform.OS === 'ios',
    insets.top,
  );
  const titleTopPad =
    Math.max(0, stackHeaderTotalPx - insets.top) +
    AUTH_GAP_BELOW_HEADER +
    Paddings.screen +
    Paddings.onboardingSlidesHeaderSectionGap;

  const slideUi = AUTH_LANDING_SLIDE_UI;

  const emphasisColor = useMemo(
    () => resolveIntroTextColor(themeColors, slideUi.sloganEmphasisColor),
    [slideUi.sloganEmphasisColor, themeColors],
  );
  const middleColor = useMemo(
    () => resolveIntroTextColor(themeColors, slideUi.sloganMiddleColor),
    [slideUi.sloganMiddleColor, themeColors],
  );
  // wordmark tick paths default to background.primary — pass so it stays the page wash next to marple
  const wordmarkTickFill = useMemo(() => themeColors.background.primary(), [themeColors]);

  const satoshiTitleTypography = getAuthLandingPageTitleTextStyle(typoPlatform);
  const middleHeadingTypography = useMemo(
    () => getAuthLandingSloganMiddleTextStyle(typoPlatform),
    [typoPlatform],
  );

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
      <View style={styles.headerCluster}>
        <View style={styles.sloganRow} accessibilityRole="header" accessible accessibilityLabel="slogan">
          <View style={styles.sloganLeadMiddleWrap}>
            <Text>
              <Text style={[satoshiTitleTypography, { color: emphasisColor }]}>{AUTH_LANDING_SLOGAN_LEAD}</Text>
              {' '}
              <Text style={[middleHeadingTypography, { color: middleColor }]}>{AUTH_LANDING_SLOGAN_MIDDLE_LEAD}</Text>
            </Text>
          </View>
          <View style={styles.tailAndIconRow}>
            <Text style={[middleHeadingTypography, { color: middleColor }]}>{AUTH_LANDING_SLOGAN_MIDDLE_BEFORE_TAIL}</Text>
            <Text style={[satoshiTitleTypography, { color: emphasisColor }]}>{AUTH_LANDING_SLOGAN_TAIL}</Text>
            <View style={styles.wordmarkWrap}>
              <AuthLandingWordmarkIcon
                size={AUTH_LANDING_WORDMARK_ICON_SIZE}
                borderRadius={wordmarkBorderRadius}
                markColorToken={slideUi.wordmarkMarkColor}
                stemFill={wordmarkTickFill}
              />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topAligned: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },
  headerCluster: {
    alignSelf: 'stretch',
    alignItems: 'flex-start',
  },
  sloganRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'flex-start',
    alignSelf: 'stretch',
  },
  /** “Flow … through …” only — intrinsic width + can shrink when the row wraps on small screens */
  sloganLeadMiddleWrap: {
    flexShrink: 1,
    maxWidth: '100%',
  },
  /** **matters,** + **to you.** + wordmark — one flex row; `flexShrink: 0` keeps them from splitting awkwardly */
  tailAndIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  wordmarkWrap: {
    marginLeft: Paddings.groupedListIconTextSpacing,
  },
});
