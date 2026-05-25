/**
 * header chrome shown as soon as the slides route is focused — same layout as step 0 of the questionnaire.
 * the stack applies this via `(onboarding)/_layout` before `OnboardingQuestionnaireFlow` commits, so users
 * do not see an empty header, route title, or delayed mount vs the slide body.
 */

import React from 'react';
import { useNavigation } from '@react-navigation/native';

import { useThemeColors } from '@/hooks/useColorPalette';

import {
  ONBOARDING_QUESTIONNAIRE_CORE_PAGE_SLIDE_UI,
  ONBOARDING_QUESTIONNAIRE_MAX_PAGE_COUNT,
} from '../constants';
import {
  resolveOnboardingSlidesProgressTrackColor,
  resolveOnboardingSlidesSlideUiButton,
  resolveOnboardingSlidesSlideUiText,
} from '../onboardingSlidesThemeResolvers';
import { OnboardingSlidesHeaderChrome } from './OnboardingSlidesHeaderChrome';

export function OnboardingSlidesInitialHeader() {
  const navigation = useNavigation();
  const themeColors = useThemeColors();

  // step 0 tokens — matches questionnaire at pageIndex 0 before blend animations run
  const row0 = ONBOARDING_QUESTIONNAIRE_CORE_PAGE_SLIDE_UI[0];
  const trackColor = row0
    ? resolveOnboardingSlidesProgressTrackColor(themeColors, row0.progressBarTrack)
    : resolveOnboardingSlidesProgressTrackColor(themeColors, {
        scope: 'track',
        token: 'primarySecondaryBlend',
      });
  const fillColor = row0
    ? resolveOnboardingSlidesSlideUiButton(themeColors, row0.progressBarFill)
    : resolveOnboardingSlidesSlideUiButton(themeColors, 'fill');
  const backChevronColor = resolveOnboardingSlidesSlideUiText(
    themeColors,
    row0?.headerBackIconColor ?? 'secondary',
  );
  const completionRatio =
    ONBOARDING_QUESTIONNAIRE_MAX_PAGE_COUNT <= 0 ? 0 : (0 + 1) / ONBOARDING_QUESTIONNAIRE_MAX_PAGE_COUNT;

  return (
    <OnboardingSlidesHeaderChrome
      completionRatio={completionRatio}
      trackColor={trackColor}
      fillColor={fillColor}
      backChevronColor={backChevronColor}
      onBackPress={() => navigation.goBack()}
      backAccessibilityLabel="Back to DailyFlo"
    />
  );
}
