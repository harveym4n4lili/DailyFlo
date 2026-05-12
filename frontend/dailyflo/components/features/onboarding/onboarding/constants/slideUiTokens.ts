/**
 * questionnaire — one token row per step (order matches `textValues` titles/captions).
 *
 * theme words vs brand ramps:
 * - `primary` / `secondary` on backgrounds, borders, text = app theme slots (not plant/moss/sage).
 * - `plant:500`, `moss:600`, `sage:300`, … = explicit ramps from ColorPalette (same strings as intro).
 *
 * progress bar: use a light brand shade for the unfilled track and a stronger shade for fill
 * (resolver tries brand strings first, then theme.border.*, then theme text).
 *
 * header back chevron: use theme text `secondary` so it stays quieter than headline brand shades.
 *
 * time wheel: set `timeWheelBrandRamp` on steps that show `OnboardingQuestionnaireTimeWheel` so spinner tint matches that slide’s plant/moss/sage chrome.
 */

import type {
  OnboardingSlidesSlideUiConfig,
  OnboardingSlidesTimeWheelBrandRamp,
} from './types';

export const ONBOARDING_SLIDES_PAGE_SLIDE_UI: readonly OnboardingSlidesSlideUiConfig[] = [
  {
    background: 'primary',
    titleColor: 'plant:800',
    titleHighlightColor: 'plant:800',
    captionColor: 'plant:700',
    dotIndicatorColor: 'plant:600',
    continueButtonBackground: 'plant:500',
    continueButtonIcon: 'plant:800',
    progressBarTrack: 'secondary',
    progressBarFill: 'plant:500',
    headerBackIconColor: 'secondary',
  },
  {
    background: 'primary',
    titleColor: 'moss:800',
    titleHighlightColor: 'moss:800',
    captionColor: 'moss:700',
    dotIndicatorColor: 'moss:600',
    continueButtonBackground: 'moss:500',
    continueButtonIcon: 'moss:800',
    progressBarTrack: 'secondary',
    progressBarFill: 'moss:500',
    headerBackIconColor: 'secondary',
    timeWheelBrandRamp: 'moss',
  },
  {
    background: 'primary',
    titleColor: 'sage:800',
    titleHighlightColor: 'sage:800',
    captionColor: 'sage:700',
    dotIndicatorColor: 'sage:600',
    continueButtonBackground: 'sage:500',
    continueButtonIcon: 'sage:800',
    progressBarTrack: 'secondary',
    progressBarFill: 'sage:500',
    headerBackIconColor: 'secondary',
    timeWheelBrandRamp: 'sage',
  },
  {
    background: 'primary',
    titleColor: 'plant:800',
    titleHighlightColor: 'plant:800',
    captionColor: 'plant:700',
    dotIndicatorColor: 'plant:600',
    continueButtonBackground: 'plant:500',
    continueButtonIcon: 'plant:800',
    progressBarTrack: 'secondary',
    progressBarFill: 'plant:500',
    headerBackIconColor: 'secondary',
  },
  {
    background: 'primary',
    titleColor: 'moss:800',
    titleHighlightColor: 'moss:800',
    captionColor: 'secondary',
    dotIndicatorColor: 'moss:600',
    continueButtonBackground: 'moss:600',
    continueButtonIcon: 'moss:800',
    progressBarTrack: 'secondary',
    progressBarFill: 'moss:500',
    headerBackIconColor: 'secondary',
  },
];

/** resolves `timeWheelBrandRamp` for a slide — throws if the step shows a wheel but the token row forgot to set it */
export function getOnboardingQuestionnaireTimeWheelBrandRampForSlide(
  pageIndex: number,
): OnboardingSlidesTimeWheelBrandRamp {
  const ramp = ONBOARDING_SLIDES_PAGE_SLIDE_UI[pageIndex]?.timeWheelBrandRamp;
  if (ramp == null) {
    throw new Error(
      `[DailyFlo onboarding] slide index ${pageIndex} has no timeWheelBrandRamp — set it in slideUiTokens next to that row.`,
    );
  }
  return ramp;
}
