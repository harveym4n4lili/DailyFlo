/**
 * header chrome shown as soon as the slides route is focused — same layout as step 0 of the questionnaire.
 * the stack applies this via `(onboarding)/_layout` before `OnboardingQuestionnaireFlow` commits, so users
 * do not see an empty header, route title, or delayed mount vs the slide body.
 */

import React, { useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';

import { useThemeColors } from '@/hooks/useColorPalette';

import { useCompleteOnboardingAndExit } from '../../introductory/hooks/useCompleteOnboardingAndExit';
import {
  ONBOARDING_SLIDES_PAGE_COUNT,
  ONBOARDING_SLIDES_PAGE_SLIDE_UI,
  ONBOARDING_SLIDES_SKIP_BUTTON_ACCESSIBILITY_LABEL,
  ONBOARDING_SLIDES_SKIP_BUTTON_HIT_SLOP,
  ONBOARDING_SLIDES_SKIP_BUTTON_LABEL,
  ONBOARDING_SLIDES_SKIP_TEXT_STYLE,
  ONBOARDING_SLIDES_SKIP_TEXT_COLOR,
} from '../constants';
import {
  resolveOnboardingSlidesContinueButtonPaint,
  resolveOnboardingSlidesProgressTrackColor,
  resolveOnboardingSlidesTextColor,
} from '../onboardingSlidesThemeResolvers';
import { OnboardingSlidesHeaderChrome } from './OnboardingSlidesHeaderChrome';

export function OnboardingSlidesInitialHeader() {
  const navigation = useNavigation();
  const themeColors = useThemeColors();
  const { completeAndExit, busy } = useCompleteOnboardingAndExit();

  const backChevronColor = themeColors.text.secondary();

  const skipTextStyle = useMemo(
    () => [
      ONBOARDING_SLIDES_SKIP_TEXT_STYLE,
      { color: resolveOnboardingSlidesTextColor(themeColors, ONBOARDING_SLIDES_SKIP_TEXT_COLOR) },
    ],
    [themeColors],
  );

  // step 0 tokens — matches questionnaire at pageIndex 0 before blend animations run
  const row0 = ONBOARDING_SLIDES_PAGE_SLIDE_UI[0];
  const trackColor = resolveOnboardingSlidesProgressTrackColor(themeColors, row0.progressBarTrack);
  const fillColor = resolveOnboardingSlidesContinueButtonPaint(themeColors, row0.progressBarFill);
  const completionRatio = ONBOARDING_SLIDES_PAGE_COUNT <= 0 ? 0 : (0 + 1) / ONBOARDING_SLIDES_PAGE_COUNT;

  const skip = useMemo(
    () => ({
      label: ONBOARDING_SLIDES_SKIP_BUTTON_LABEL,
      accessibilityLabel: ONBOARDING_SLIDES_SKIP_BUTTON_ACCESSIBILITY_LABEL,
      hitSlop: ONBOARDING_SLIDES_SKIP_BUTTON_HIT_SLOP,
      textStyle: skipTextStyle,
      onPress: completeAndExit,
      disabled: busy,
    }),
    [busy, completeAndExit, skipTextStyle],
  );

  return (
    <OnboardingSlidesHeaderChrome
      completionRatio={completionRatio}
      trackColor={trackColor}
      fillColor={fillColor}
      backChevronColor={backChevronColor}
      onBackPress={() => navigation.goBack()}
      backAccessibilityLabel="Back to introduction"
      skip={skip}
    />
  );
}
