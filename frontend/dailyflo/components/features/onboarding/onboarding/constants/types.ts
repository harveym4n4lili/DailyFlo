/**
 * post-intro questionnaire funnel — token unions shared by text values + slide ui tokens.
 */

import type { TextStyle } from 'react-native';

import {
  PlantBrandColors,
  ThemeColors,
  getMossBrandColor,
  getPlantBrandColor,
  getSageBrandColor,
} from '@/constants/ColorPalette';

export type OnboardingSlidesThemeTextColorKey = keyof typeof ThemeColors.light.text;

export type OnboardingSlidesThemeBackgroundColorKey = keyof typeof ThemeColors.light.background;

export type OnboardingSlidesBrandColorShade = keyof typeof PlantBrandColors;

export type OnboardingSlidesBrandStyleToken =
  | `brand:${OnboardingSlidesBrandColorShade}`
  | `plant:${OnboardingSlidesBrandColorShade}`
  | `sage:${OnboardingSlidesBrandColorShade}`
  | `moss:${OnboardingSlidesBrandColorShade}`;

export type OnboardingSlidesBrandBackgroundToken = OnboardingSlidesBrandStyleToken;
export type OnboardingSlidesBrandTextToken = OnboardingSlidesBrandStyleToken;

export type OnboardingSlidesSlideBackgroundColor =
  | OnboardingSlidesThemeBackgroundColorKey
  | OnboardingSlidesBrandBackgroundToken;

export type OnboardingSlidesSlideTextColor =
  | OnboardingSlidesThemeTextColorKey
  | OnboardingSlidesBrandTextToken;

export type OnboardingSlidesThemeTextInvertedColorKey = Extract<
  OnboardingSlidesThemeTextColorKey,
  `inverted${string}`
>;

export type OnboardingSlidesThemeBackgroundInvertedColorKey = Extract<
  OnboardingSlidesThemeBackgroundColorKey,
  `inverted${string}`
>;

export const ONBOARDING_SLIDES_THEME_BACKGROUND_INVERTED_KEYS = [
  'invertedPrimary',
  'invertedSecondary',
  'invertedTertiary',
  'invertedElevated',
] as const satisfies readonly OnboardingSlidesThemeBackgroundInvertedColorKey[];

export const ONBOARDING_SLIDES_THEME_TEXT_INVERTED_KEYS = [
  'invertedPrimary',
  'invertedSecondary',
  'invertedTertiary',
  'invertedDisabled',
] as const satisfies readonly OnboardingSlidesThemeTextInvertedColorKey[];

export type OnboardingSlidesPrimaryButtonColorKey = keyof typeof ThemeColors.light.primaryButton;

export type OnboardingSlidesThemeBorderColorKey = keyof typeof ThemeColors.light.border;

export type OnboardingSlidesThemeInteractiveColorKey = keyof typeof ThemeColors.light.interactive;

export type OnboardingSlidesContinueButtonColorToken =
  | OnboardingSlidesPrimaryButtonColorKey
  | OnboardingSlidesThemeInteractiveColorKey
  | OnboardingSlidesSlideTextColor
  | string;

/** header progress pill — try border slot, then same rules as text (theme + brand strings). */
export type OnboardingSlidesProgressTrackToken =
  | OnboardingSlidesThemeBorderColorKey
  | OnboardingSlidesSlideTextColor
  | OnboardingSlidesBrandStyleToken
  | string;

export const ONBOARDING_SLIDES_BRAND_COLORS = {
  plant: {
    accent: getPlantBrandColor(500),
    soft: getPlantBrandColor(200),
  },
  sage: {
    accent: getSageBrandColor(500),
    soft: getSageBrandColor(200),
  },
  moss: {
    accent: getMossBrandColor(500),
    soft: getMossBrandColor(200),
  },
} as const;

/** which botanical ramp tints the questionnaire time wheel (matches keys of `ONBOARDING_SLIDES_BRAND_COLORS`) */
export type OnboardingSlidesTimeWheelBrandRamp = keyof typeof ONBOARDING_SLIDES_BRAND_COLORS;

/** per-slide color tokens — rows live in slideUiTokens.ts (mirrors auth `AuthSlideUiConfig` + questionnaire chrome). */
export type OnboardingSlidesSlideUiConfig = {
  background: OnboardingSlidesSlideBackgroundColor;
  titleColor: OnboardingSlidesSlideTextColor;
  titleHighlightColor?: OnboardingSlidesSlideTextColor;
  captionColor: OnboardingSlidesSlideTextColor;
  dotIndicatorColor: OnboardingSlidesSlideTextColor;
  /** `OnboardingContinueButton`: glass tint + solid fill */
  continueButtonBackground: OnboardingSlidesContinueButtonColorToken;
  /** `OnboardingContinueButton`: label + spinner (intro used this for chevron) */
  continueButtonIcon: OnboardingSlidesContinueButtonColorToken;
  /** native header progress track (unfilled portion) */
  progressBarTrack: OnboardingSlidesProgressTrackToken;
  /** native header progress fill — same token family as `continueButtonBackground` (brand, `fill`, interactive, text, …). */
  progressBarFill: OnboardingSlidesContinueButtonColorToken;
  /** back chevron — theme text slot (`secondary` keeps the control quieter than body headlines) */
  headerBackIconColor?: OnboardingSlidesSlideTextColor;
  /**
   * steps that render `OnboardingQuestionnaireTimeWheel` must set this so spinner tint matches the slide’s headline ramp.
   */
  timeWheelBrandRamp?: OnboardingSlidesTimeWheelBrandRamp;
};

/** headline strings live in textValues.ts */
export type OnboardingSlidesPageTitleConfig = {
  title: string;
  titleStyle?: TextStyle;
  highlight?: {
    text: string;
    style?: TextStyle;
  };
};
