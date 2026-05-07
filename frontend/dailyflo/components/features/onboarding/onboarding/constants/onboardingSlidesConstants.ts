/**
 * questionnaire carousel (`app/(onboarding)/slides`) — dot/progress count must match horizontal pager pages.
 * structure mirrors `introductory/constants/onboardingIntroConstants.ts` so both funnels stay consistent.
 * typography + skip spacing mirror the intro file (`getOnboardingTextStyle`, shared `Paddings` hit slop).
 */import { Platform, type TextStyle } from 'react-native';
import {
  PlantBrandColors,
  ThemeColors,
  getMossBrandColor,
  getPlantBrandColor,
  getSageBrandColor,
} from '@/constants/ColorPalette';
import { Paddings } from '@/constants/Paddings';
import { FontWeight, getOnboardingTextStyle, type Platform as TypographyPlatform } from '@/constants/Typography';

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

// questionnaire typography — same as intro: `getOnboardingTextStyle` from Typography.ts (sf pro rounded on ios).
const ONBOARDING_SLIDES_TYPOGRAPHY_PLATFORM = Platform.OS as TypographyPlatform;

/** skip in header row — `getOnboardingTextStyle('body-large')` from Typography.ts (same as intro skip) */
export const ONBOARDING_SLIDES_SKIP_TEXT_STYLE = getOnboardingTextStyle(
  'body-large',
  ONBOARDING_SLIDES_TYPOGRAPHY_PLATFORM,
);

/** theme text key for skip — use with `resolveOnboardingSlidesTextColor` */
export const ONBOARDING_SLIDES_SKIP_TEXT_COLOR: OnboardingSlidesSlideTextColor = 'secondary';

/** questionnaire headline base before caption + per-slide merges */
export const ONBOARDING_SLIDES_PAGE_TITLE_TEXT_STYLE = getOnboardingTextStyle(
  'heading-1',
  ONBOARDING_SLIDES_TYPOGRAPHY_PLATFORM,
);

/** caption under questionnaire titles — `body-large` via Typography helper */
export const ONBOARDING_SLIDES_CAPTION_TEXT_STYLE = getOnboardingTextStyle(
  'body-large',
  ONBOARDING_SLIDES_TYPOGRAPHY_PLATFORM,
);

/** same touch expansion as introductory skip — uses `Paddings` */
export const ONBOARDING_SLIDES_SKIP_BUTTON_HIT_SLOP = {
  top: Paddings.listItemVertical,
  bottom: Paddings.listItemVertical,
  left: Paddings.listItemVertical,
  right: Paddings.touchTarget,
} as const;

export const ONBOARDING_SLIDES_SKIP_BUTTON_ACCESSIBILITY_LABEL = 'Skip onboarding';

export const ONBOARDING_SLIDES_SKIP_BUTTON_LABEL = 'Skip';

/**
 * overlay placement — same numbers as `INTRO_SKIP_BUTTON_ABSOLUTE_LAYOUT` — for intro-style floating skip only.
 * questionnaire slides embed skip in `useOnboardingSlidesHeader`'s title row instead (native header paints above body overlays).
 * skip stays out of `navigation.setOptions({ headerRight })` on ios — liquid glass wraps bar-slot controls there.
 */
export const ONBOARDING_SLIDES_SKIP_BUTTON_ABSOLUTE_LAYOUT = {
  offsetRight: Paddings.screenSmall,
  zIndex: 3,
  topInsetPlus: Paddings.groupedListHeaderContentGap,
} as const;

export type OnboardingSlidesPageTitleConfig = {
  title: string;
  titleStyle?: TextStyle;
  highlight?: {
    text: string;
    style?: TextStyle;
  };
};

/** questionnaire headline base comes from `ONBOARDING_SLIDES_PAGE_TITLE_TEXT_STYLE`; bump weight for the emphasized word only. */
const ONBOARDING_SLIDES_PAGE_TITLE_HIGHLIGHT_STYLE: TextStyle = {
  fontWeight: FontWeight.bold,
};

export const ONBOARDING_SLIDES_PAGE_TITLES: readonly OnboardingSlidesPageTitleConfig[] = [
  {
    title: "Start planning your day...",
    highlight: {
      text: 'planning',
      style: ONBOARDING_SLIDES_PAGE_TITLE_HIGHLIGHT_STYLE,
    },
  },
  {
    title: 'What time do you wake up?',
    highlight: {
      text: 'wake',
      style: ONBOARDING_SLIDES_PAGE_TITLE_HIGHLIGHT_STYLE,
    },
  },
  {
    title: 'What time do you sleep?',
    highlight: {
      text: 'sleep',
      style: ONBOARDING_SLIDES_PAGE_TITLE_HIGHLIGHT_STYLE,
    },
  },
  {
    title: 'Are you making a task or a habit?',
    highlight: {
      text: 'habit',
      style: ONBOARDING_SLIDES_PAGE_TITLE_HIGHLIGHT_STYLE,
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

export const ONBOARDING_SLIDES_TITLE_SUBTEXT_GAP = Paddings.touchTarget;

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
