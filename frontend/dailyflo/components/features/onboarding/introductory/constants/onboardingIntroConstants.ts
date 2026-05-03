/**
 * intro swipe carousel — dot count must match horizontal ScrollView page children.
 * `ONBOARDING_INTRO_PAGE_COUNT` is derived from `INTRO_PAGE_TITLES` so dots + slides stay aligned.
 */
import type { TextStyle } from 'react-native';
import { ThemeColors } from '@/constants/ColorPalette';
import type { TextStyleName } from '@/constants/Typography';

// color keys are derived from `ThemeColors` in ColorPalette.ts so names match the design system
// (same paths as `getThemeColor(theme, 'text', variant)` / `useThemeColors().text[variant]()`).
export type IntroThemeTextColorKey = keyof typeof ThemeColors.light.text;

// same as `getThemeColor(theme, 'background', variant)` / `useThemeColors().background[variant]()`.
export type IntroThemeBackgroundColorKey = keyof typeof ThemeColors.light.background;

// inverted surface / text pairs — use these when `background` is an `inverted*` token so contrast matches ColorPalette.
export type IntroThemeTextInvertedColorKey = Extract<IntroThemeTextColorKey, `inverted${string}`>;
export type IntroThemeBackgroundInvertedColorKey = Extract<
  IntroThemeBackgroundColorKey,
  `inverted${string}`
>;

/** background.inverted* names from ThemeColors — handy when picking a dark band / light card in intro */
export const INTRO_THEME_BACKGROUND_INVERTED_KEYS = [
  'invertedPrimary',
  'invertedSecondary',
  'invertedTertiary',
  'invertedElevated',
] as const satisfies readonly IntroThemeBackgroundInvertedColorKey[];

/** text.inverted* names — use on inverted backgrounds instead of `primary` / `secondary` */
export const INTRO_THEME_TEXT_INVERTED_KEYS = [
  'invertedPrimary',
  'invertedSecondary',
  'invertedTertiary',
  'invertedDisabled',
] as const satisfies readonly IntroThemeTextInvertedColorKey[];

// same slots as `ThemeColors.light.primaryButton` / `useThemeColors().primaryButton`.
export type IntroPrimaryButtonColorKey = keyof typeof ThemeColors.light.primaryButton;

/**
 * per-slide ui colors — one entry per intro page, same order as `INTRO_PAGE_TITLES` / `INTRO_PAGE_CAPTIONS`.
 * change tokens here to restyle each slide without touching layout components.
 */
export type IntroSlideUiConfig = {
  background: IntroThemeBackgroundColorKey;
  titleColor: IntroThemeTextColorKey;
  /** if omitted, highlight reuses `titleColor` */
  titleHighlightColor?: IntroThemeTextColorKey;
  captionColor: IntroThemeTextColorKey;
  /**
   * header dot indicator fill — same tokens as `titleColor` / `useThemeColors().text`.
   * inactive dots reuse this color at lower opacity; pick inverted text on inverted slides so dots stay visible.
   */
  dotIndicatorColor: IntroThemeTextColorKey;
  /**
   * floating continue FAB — circle fill / iOS glass tint.
   * `fill` / `icon` → `primaryButton`; names like `primary` → `interactive` / `text` in `useThemeColors()`; else hex/rgb string.
   */
  continueButtonBackground: string;
  /** chevron + loading spinner — same resolution order as `continueButtonBackground` */
  continueButtonIcon: string;
};

export const INTRO_PAGE_SLIDE_UI: readonly IntroSlideUiConfig[] = [
  {
    background: 'primary',
    titleColor: 'primary',
    titleHighlightColor: 'primary',
    captionColor: 'secondary',
    dotIndicatorColor: 'primary',
    continueButtonBackground: 'primary',
    continueButtonIcon: 'icon',
  },
  {
    background: 'invertedPrimary',
    titleColor: 'invertedSecondary',
    titleHighlightColor: 'invertedPrimary',
    captionColor: 'invertedSecondary',
    dotIndicatorColor: 'invertedPrimary',
    continueButtonBackground: 'fill',
    continueButtonIcon: 'icon',
  },
  {
    background: 'invertedPrimary',
    titleColor: 'invertedPrimary',
    titleHighlightColor: 'invertedPrimary',
    captionColor: 'invertedSecondary',
    dotIndicatorColor: 'invertedPrimary',
    continueButtonBackground: 'fill',
    continueButtonIcon: 'icon',
  },
  {
    background: 'quaternary',
    titleColor: 'primary',
    titleHighlightColor: 'primary',
    captionColor: 'secondary',
    dotIndicatorColor: 'primary',
    continueButtonBackground: 'fill',
    continueButtonIcon: 'icon',
  },
];

export type IntroTextStyleToken = {
  // typography token from the shared typography system
  typography: TextStyleName;
  // theme text color token from useThemeColors().text
  color: IntroThemeTextColorKey;
};

/**
 * one config entry per intro slide.
 * edit title text + overall typography for each screen in this file.
 */
export type IntroPageTitleConfig = {
  /** full title text for this intro screen */
  title: string;
  /** overall typography applied to the full title text */
  titleStyle?: TextStyle;
  /** optional single word/phrase to style differently inside the title */
  highlight?: {
    /** exact text to find in `title` (first match only) */
    text: string;
    /** style override for just the highlighted text */
    style?: TextStyle;
  };
};

// one place for shared intro text tokens so route components stay style-free
export const INTRO_TEXT_TOKENS: Readonly<{
  skip: IntroTextStyleToken;
  title: IntroTextStyleToken;
}> = {
  skip: {
    typography: 'body-large',
    color: 'secondary',
  },
  title: {
    typography: 'heading-1',
    // title fill is per slide in `INTRO_PAGE_SLIDE_UI.titleColor` — this field stays for the shared token shape
    color: 'primary',
  },
};

/**
 * edit each screen title and typography here.
 * titleStyle merges on top of `heading-2` in the intro screen.
 */
export const INTRO_PAGE_TITLES: readonly IntroPageTitleConfig[] = [
  {
    title: 'Welcome to DailyFlo',
    titleStyle: {
      fontSize: 54,
      fontWeight: 400,
    },
    highlight: {
      text: 'DailyFlo',
      style: {
        
        fontWeight: 600,

      },
    },
  },
  {
    title: 'Your day on a Timeline',
    titleStyle: {
        fontSize: 54,
        fontWeight: 400,
    },
    highlight: {
        text: 'Timeline',
        style: {
          fontWeight: 600,
        },
      },
  },
  {
    title: 'Build habits \nwith flow',
    titleStyle: {
      fontSize: 54,
      fontWeight: 400,
    },
    highlight: {
      text: 'habits',
      style: {
        fontWeight: 600,
      },
    },
  },
  {
    title: 'Our Copilot, \nyour plan',
    titleStyle: {
      fontSize: 54,
      fontWeight: 400,
    },
    highlight: {
      text: 'Copilot',
      style: {
        fontWeight: 600,
      },
    },
  },
];

/**
 * body caption copy for each intro screen.
 * keep order aligned with `INTRO_PAGE_TITLES` / carousel pages so each slide gets the right caption.
 */
export const INTRO_PAGE_CAPTIONS: readonly string[] = [
  '',
  'See your whole day at a glance and stay focused on what matters most.',
  'Build routines that keep your progress steady every day.',
  '',
];

export const ONBOARDING_INTRO_PAGE_COUNT = INTRO_PAGE_TITLES.length;

if (__DEV__ && INTRO_PAGE_SLIDE_UI.length !== ONBOARDING_INTRO_PAGE_COUNT) {
  // keeps dots, backgrounds, and copy arrays from drifting apart silently
  console.warn(
    '[onboarding] INTRO_PAGE_SLIDE_UI length must match INTRO_PAGE_TITLES — fix introductory/constants/onboardingIntroConstants.ts',
  );
}

/**
 * vertical space reserved for the fixed crossfading title in the intro carousel.
 * paired with `INTRO_SUBTEXT_AREA_HEIGHT` for the headline stack; pages spacer uses the combined constant below.
 */
export const INTRO_TITLE_AREA_HEIGHT = 120;

/** small gap between title and subtext inside the fixed headline overlay */
export const INTRO_TITLE_SUBTEXT_GAP = 8;

/**
 * room for crossfading caption lines (body-large); keeps the fixed block height stable when a slide has no caption.
 */
export const INTRO_SUBTEXT_AREA_HEIGHT = 88;

/** total height of the fixed title + subtext overlay — match spacer at top of each swipe page */
export const INTRO_FIXED_HEADLINE_OVERLAY_HEIGHT =
  INTRO_TITLE_AREA_HEIGHT + INTRO_TITLE_SUBTEXT_GAP + INTRO_SUBTEXT_AREA_HEIGHT;

/**
 * duration (ms) for intro chrome that should move together — header dots + continue FAB fade.
 * easing: `Easing.out(Easing.cubic)` in callers (matches `OnboardingDotIndicator`).
 */
export const INTRO_CONTROL_TRANSITION_MS = 320;
