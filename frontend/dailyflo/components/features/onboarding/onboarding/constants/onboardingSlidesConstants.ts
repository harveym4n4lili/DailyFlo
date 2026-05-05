/**
 * questionnaire carousel (`app/(onboarding)/slides`) — dot/progress count must match horizontal pager pages.
 * structure mirrors `introductory/constants/onboardingIntroConstants.ts` so both funnels stay consistent.
 */
import type { TextStyle } from 'react-native';
import {
  PlantBrandColors,
  ThemeColors,
  getMossBrandColor,
  getPlantBrandColor,
  getSageBrandColor,
} from '@/constants/ColorPalette';
import type { TextStyleName } from '@/constants/Typography';

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

export type OnboardingSlidesSlideUiConfig = {
  background: OnboardingSlidesSlideBackgroundColor;
  titleColor: OnboardingSlidesSlideTextColor;
  titleHighlightColor?: OnboardingSlidesSlideTextColor;
  captionColor: OnboardingSlidesSlideTextColor;
  dotIndicatorColor: OnboardingSlidesSlideTextColor;
  continueButtonBackground: OnboardingSlidesContinueButtonColorToken;
  continueButtonIcon: OnboardingSlidesContinueButtonColorToken;
};

export const ONBOARDING_SLIDES_PAGE_SLIDE_UI: readonly OnboardingSlidesSlideUiConfig[] = [
  {
    background: 'primary',
    titleColor: 'primary',
    titleHighlightColor: 'primary',
    captionColor: 'secondary',
    dotIndicatorColor: 'secondary',
    continueButtonBackground: 'fill',
    continueButtonIcon: 'icon',
  },
];

export type OnboardingSlidesTextStyleToken = {
  typography: TextStyleName;
  color: OnboardingSlidesSlideTextColor;
};

export type OnboardingSlidesPageTitleConfig = {
  title: string;
  titleStyle?: TextStyle;
  highlight?: {
    text: string;
    style?: TextStyle;
  };
};

export const ONBOARDING_SLIDES_TEXT_TOKENS: Readonly<{
  title: OnboardingSlidesTextStyleToken;
}> = {
  title: {
    typography: 'heading-2',
    color: 'primary',
  },
};

export const ONBOARDING_SLIDES_PAGE_TITLES: readonly OnboardingSlidesPageTitleConfig[] = [
  {
    title: 'Tell us how you flow',
    titleStyle: {
      fontSize: 32,
      fontWeight: 400,
    },
    highlight: {
      text: 'flow',
      style: {
        fontWeight: 600,
      },
    },
  },
];

export const ONBOARDING_SLIDES_PAGE_CAPTIONS: readonly string[] = [
  'A few quick answers help DailyFlo match how you like to plan.',
];

export const ONBOARDING_SLIDES_PAGE_COUNT = ONBOARDING_SLIDES_PAGE_TITLES.length;

export const ONBOARDING_SLIDES_TITLE_AREA_HEIGHT = 120;

export const ONBOARDING_SLIDES_TITLE_SUBTEXT_GAP = 8;

export const ONBOARDING_SLIDES_SUBTEXT_AREA_HEIGHT = 88;

export const ONBOARDING_SLIDES_FIXED_HEADLINE_OVERLAY_HEIGHT =
  ONBOARDING_SLIDES_TITLE_AREA_HEIGHT +
  ONBOARDING_SLIDES_TITLE_SUBTEXT_GAP +
  ONBOARDING_SLIDES_SUBTEXT_AREA_HEIGHT;

/** native header progress bar + shared chrome timing — easing set in `OnboardingSlidesProgressBar` */
export const ONBOARDING_SLIDES_CONTROL_TRANSITION_MS = 320;

/** header completion bar thickness (dp); `OnboardingSlidesProgressBar` uses half this for pill `borderRadius` */
export const ONBOARDING_SLIDES_PROGRESS_BAR_HEIGHT = 10;

if (__DEV__ && ONBOARDING_SLIDES_PAGE_SLIDE_UI.length !== ONBOARDING_SLIDES_PAGE_COUNT) {
  console.warn(
    '[onboarding] ONBOARDING_SLIDES_PAGE_SLIDE_UI length must match ONBOARDING_SLIDES_PAGE_TITLES — fix onboarding/constants/onboardingSlidesConstants.ts',
  );
}

if (__DEV__ && ONBOARDING_SLIDES_PAGE_CAPTIONS.length !== ONBOARDING_SLIDES_PAGE_COUNT) {
  console.warn(
    '[onboarding] ONBOARDING_SLIDES_PAGE_CAPTIONS length must match ONBOARDING_SLIDES_PAGE_TITLES — fix onboarding/constants/onboardingSlidesConstants.ts',
  );
}

if (__DEV__ && ONBOARDING_SLIDES_PAGE_COUNT < 1) {
  console.warn('[onboarding] ONBOARDING_SLIDES_PAGE_COUNT must be >= 1');
}
