/**
 * intro swipe carousel — dot count must match horizontal ScrollView page children.
 * `ONBOARDING_INTRO_PAGE_COUNT` is derived from `INTRO_PAGE_TITLES` so dots + slides stay aligned.
 */
import type { TextStyle } from 'react-native';
import type { TextStyleName } from '@/constants/Typography';

export type IntroThemeTextColorKey =
  | 'primary'
  | 'secondary'
  | 'primarySecondaryBlend'
  | 'tertiary'
  | 'quaternary'
  | 'inverse'
  | 'invertedPrimary'
  | 'invertedSecondary'
  | 'invertedTertiary'
  | 'invertedDisabled';

/**
 * background tokens from `useThemeColors().background` — edit slides with these keys so light/dark stay consistent.
 */
export type IntroThemeBackgroundColorKey =
  | 'primary'
  | 'secondary'
  | 'primarySecondaryBlend'
  | 'tertiary'
  | 'quaternary'
  | 'elevated'
  | 'overlay'
  | 'darkOverlay'
  | 'lightOverlay'
  | 'invertedPrimary'
  | 'invertedSecondary'
  | 'invertedTertiary'
  | 'invertedElevated';

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
};

export const INTRO_PAGE_SLIDE_UI: readonly IntroSlideUiConfig[] = [
  {
    background: 'primary',
    titleColor: 'primary',
    titleHighlightColor: 'primary',
    captionColor: 'secondary',
  },
  {
    background: 'primarySecondaryBlend',
    titleColor: 'primary',
    titleHighlightColor: 'primary',
    captionColor: 'secondary',
  },
  {
    background: 'primarySecondaryBlend',
    titleColor: 'primary',
    titleHighlightColor: 'primary',
    captionColor: 'secondary',
  },
  {
    background: 'primary',
    titleColor: 'primary',
    titleHighlightColor: 'primary',
    captionColor: 'secondary',
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
