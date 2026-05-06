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
  {
    background: 'primary',
    titleColor: 'primary',
    titleHighlightColor: 'primary',
    captionColor: 'secondary',
    dotIndicatorColor: 'secondary',
    continueButtonBackground: 'fill',
    continueButtonIcon: 'icon',
  },
  {
    background: 'primary',
    titleColor: 'primary',
    titleHighlightColor: 'primary',
    captionColor: 'secondary',
    dotIndicatorColor: 'secondary',
    continueButtonBackground: 'fill',
    continueButtonIcon: 'icon',
  },
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

/**
 * skip label — typography + theme text color.
 * keep in sync with `INTRO_SKIP_TEXT_STYLE_TOKEN` in onboardingIntroConstants.ts (same body-large + secondary).
 */
export const ONBOARDING_SLIDES_SKIP_TEXT_STYLE_TOKEN: OnboardingSlidesTextStyleToken = {
  typography: 'body-large',
  color: 'secondary',
};

/** same touch expansion as introductory skip — keep numeric values aligned with `INTRO_SKIP_BUTTON_HIT_SLOP` */
export const ONBOARDING_SLIDES_SKIP_BUTTON_HIT_SLOP = {
  top: 12,
  bottom: 12,
  left: 12,
  right: 8,
} as const;

export const ONBOARDING_SLIDES_SKIP_BUTTON_ACCESSIBILITY_LABEL = 'Skip onboarding';

export const ONBOARDING_SLIDES_SKIP_BUTTON_LABEL = 'Skip';

/**
 * overlay placement — same numbers as `INTRO_SKIP_BUTTON_ABSOLUTE_LAYOUT` — for intro-style floating skip only.
 * questionnaire slides embed skip in `useOnboardingSlidesHeader`'s title row instead (native header paints above body overlays).
 * skip stays out of `navigation.setOptions({ headerRight })` on ios — liquid glass wraps bar-slot controls there.
 */
export const ONBOARDING_SLIDES_SKIP_BUTTON_ABSOLUTE_LAYOUT = {
  offsetRight: 16,
  zIndex: 3,
  topInsetPlus: 10,
} as const;

export type OnboardingSlidesPageTitleConfig = {
  title: string;
  titleStyle?: TextStyle;
  highlight?: {
    text: string;
    style?: TextStyle;
  };
};

export const ONBOARDING_SLIDES_TEXT_TOKENS: Readonly<{
  skip: OnboardingSlidesTextStyleToken;
  title: OnboardingSlidesTextStyleToken;
}> = {
  skip: ONBOARDING_SLIDES_SKIP_TEXT_STYLE_TOKEN,
  title: {
    typography: 'heading-2',
    color: 'primary',
  },
};

export const ONBOARDING_SLIDES_PAGE_TITLES: readonly OnboardingSlidesPageTitleConfig[] = [
  {
    title: "Let's get started planning",
    titleStyle: {
      fontSize: 32,
      fontWeight: 400,
    },
    highlight: {
      text: 'planning',
      style: {
        fontWeight: 600,
      },
    },
  },
  {
    title: 'What time do you wake up?',
    titleStyle: {
      fontSize: 32,
      fontWeight: 400,
    },
    highlight: {
      text: 'wake',
      style: {
        fontWeight: 600,
      },
    },
  },
  {
    title: 'What time do you sleep?',
    titleStyle: {
      fontSize: 32,
      fontWeight: 400,
    },
    highlight: {
      text: 'sleep',
      style: {
        fontWeight: 600,
      },
    },
  },
  {
    title: 'Are you making a task or a habit?',
    titleStyle: {
      fontSize: 32,
      fontWeight: 400,
    },
    highlight: {
      text: 'habit',
      style: {
        fontWeight: 600,
      },
    },
  },
];

export const ONBOARDING_SLIDES_PAGE_CAPTIONS: readonly string[] = [
  'A couple of quick choices help DailyFlo line up your day with how you actually work.',
  "We'll anchor your timeline around when your morning usually begins.",
  'Wind-down time keeps evening blocks and reminders feeling realistic.',
  'Tasks are one-off to-dos; habits are things you want to repeat — you can tune both anytime.',
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
