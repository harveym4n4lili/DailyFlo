/**
 * placeholder body for the questionnaire carousel — mirrors introductory IntroSlideSampleContent
 * so you can see horizontal motion once more pages exist.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Paddings } from '@/constants/Paddings';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';

import { ONBOARDING_SLIDES_PAGE_SLIDE_UI } from '../constants';
import { resolveOnboardingSlidesContinueButtonPaint } from '../onboardingSlidesThemeResolvers';

export type OnboardingSlideSampleContentProps = {
  pageIndex: number;
  /** lerped continue fill while stepping — overrides row token when set */
  accentFill?: string;
};

export function OnboardingSlideSampleContent({ pageIndex, accentFill }: OnboardingSlideSampleContentProps) {
  const themeColors = useThemeColors();
  const typography = useTypography();
  const uiRow = ONBOARDING_SLIDES_PAGE_SLIDE_UI[pageIndex] ?? ONBOARDING_SLIDES_PAGE_SLIDE_UI[0];
  const accentFromRow = resolveOnboardingSlidesContinueButtonPaint(themeColors, uiRow.continueButtonBackground);
  const accentFillResolved = accentFill ?? accentFromRow;

  return (
    <View style={styles.root}>
      <Text style={[typography.getOnboardingTextStyle('body-small'), styles.hint, { color: themeColors.text.tertiary() }]}>
        Questionnaire placeholder — wire real controls in this section when you add fields per step.
      </Text>
      <View
        style={[
          styles.card,
          { borderColor: themeColors.border.primary(), backgroundColor: themeColors.background.elevated() },
        ]}
      >
        <View style={[styles.accent, { backgroundColor: accentFillResolved }]} />
        <Text style={[typography.getOnboardingTextStyle('heading-3'), { color: themeColors.text.primary() }]}>
          Sample slide · step {pageIndex + 1}
        </Text>
        <View style={styles.row}>
          <View style={[styles.pill, { backgroundColor: themeColors.background.tertiary() }]} />
          <View style={[styles.pillWide, { backgroundColor: themeColors.background.secondary() }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    marginTop: Paddings.screen,
    gap: 12,
  },
  hint: {
    lineHeight: 20,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: Paddings.screen,
    gap: 14,
  },
  accent: {
    height: 4,
    width: 48,
    borderRadius: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pill: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  pillWide: {
    flex: 1,
    height: 44,
    borderRadius: 10,
  },
});
