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

export type OnboardingSlidesThemeInteractiveColorKey = keyof typeof ThemeColors.light.interactive;

export type OnboardingSlidesContinueButtonColorToken =
  | OnboardingSlidesPrimaryButtonColorKey
  | OnboardingSlidesThemeInteractiveColorKey
  | OnboardingSlidesSlideTextColor
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

/** per-slide color tokens — rows live in slideUiTokens.ts */
export type OnboardingSlidesSlideUiConfig = {
  background: OnboardingSlidesSlideBackgroundColor;
  titleColor: OnboardingSlidesSlideTextColor;
  titleHighlightColor?: OnboardingSlidesSlideTextColor;
  captionColor: OnboardingSlidesSlideTextColor;
  dotIndicatorColor: OnboardingSlidesSlideTextColor;
  continueButtonBackground: OnboardingSlidesContinueButtonColorToken;
  continueButtonIcon: OnboardingSlidesContinueButtonColorToken;
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
