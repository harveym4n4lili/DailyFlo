/**
 * post-intro questionnaire funnel — token unions shared by text values + slide ui tokens.
 */

import type { TextStyle } from 'react-native';

import {
  PlantBrandColors,
  ThemeColors,
  getMarpleBrandColor,
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
  | `marple:${OnboardingSlidesBrandColorShade}`
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

/** `useThemeColors().border.*` + brand strings for `scope: 'border'` */
export type OnboardingSlidesBorderColorToken =
  | OnboardingSlidesThemeBorderColorKey
  | OnboardingSlidesBrandStyleToken
  | string;

export type OnboardingSlidesThemeInteractiveColorKey = keyof typeof ThemeColors.light.interactive;

export type OnboardingSlidesContinueButtonColorToken =
  | OnboardingSlidesPrimaryButtonColorKey
  | OnboardingSlidesThemeInteractiveColorKey
  | OnboardingSlidesSlideTextColor
  | string;

/** header progress pill — `primarySecondaryBlend` (theme backgrounds), else border / brand / text rules. */
export type OnboardingSlidesProgressTrackToken =
  /** 50% blend of theme `background.primary` + `background.secondary` — empty / unfilled portion of the header bar */
  | 'primarySecondaryBlend'
  | OnboardingSlidesThemeBorderColorKey
  | OnboardingSlidesSlideTextColor
  | OnboardingSlidesBrandStyleToken
  | string;

/**
 * explicit track-only semantic — same pixels as legacy string `'primarySecondaryBlend'`, but scoped like other chrome.
 */
export type OnboardingSlidesProgressTrackBlendToken = 'primarySecondaryBlend';

/**
 * which `useThemeColors()` bucket resolves the inner `token` for general slide chrome fields.
 * (progress track also allows `scope: 'track'` — see `OnboardingSlidesScopedProgressTrackColor`.)
 * - `background` → page wash slots + brand hex
 * - `text` → typography slots + brand hex
 * - `button` → FAB / interactive / text / brand (same as continue paint)
 * - `border` → border slots + brand hex
 */
export type OnboardingSlidesColorScope = 'background' | 'text' | 'button' | 'border';

/** explicit `{ scope, token }` — any slide color field can use any scope (e.g. title from `background.primary`) */
export type OnboardingSlidesScopedSlideColor =
  | { readonly scope: 'background'; readonly token: OnboardingSlidesSlideBackgroundColor }
  | { readonly scope: 'text'; readonly token: OnboardingSlidesSlideTextColor }
  | { readonly scope: 'button'; readonly token: OnboardingSlidesContinueButtonColorToken }
  | { readonly scope: 'border'; readonly token: OnboardingSlidesBorderColorToken };

/** progress bar track — slide’s four scopes plus `track` for the background primary/secondary lerp */
export type OnboardingSlidesScopedProgressTrackColor =
  | OnboardingSlidesScopedSlideColor
  | { readonly scope: 'track'; readonly token: OnboardingSlidesProgressTrackBlendToken };

/**
 * shorthand string on a field — still resolved using that field’s default scope (background field → background, …).
 * prefer `{ scope, token }` for theme keys (`primary`, `secondary`, …) so you state text vs background vs border vs button explicitly.
 */
export type OnboardingSlidesSlideUiColorInput =
  | OnboardingSlidesScopedSlideColor
  | OnboardingSlidesSlideBackgroundColor
  | OnboardingSlidesSlideTextColor
  | OnboardingSlidesContinueButtonColorToken
  | OnboardingSlidesBorderColorToken;

/** progress track only — `scope: 'track'` for blend + any slide scope + legacy plain strings */
export type OnboardingSlidesSlideUiProgressTrackInput =
  | OnboardingSlidesScopedProgressTrackColor
  | OnboardingSlidesProgressTrackToken;

export type OnboardingSlidesSlideUiBackgroundInput = OnboardingSlidesSlideUiColorInput;
export type OnboardingSlidesSlideUiTextInput = OnboardingSlidesSlideUiColorInput;
export type OnboardingSlidesSlideUiButtonInput = OnboardingSlidesSlideUiColorInput;

export const ONBOARDING_SLIDES_BRAND_COLORS = {
  plant: {
    accent: getPlantBrandColor(500),
    soft: getPlantBrandColor(200),
  },
  sage: {
    accent: getSageBrandColor(500),
    soft: getSageBrandColor(200),
  },
  marple: {
    accent: getMarpleBrandColor(500),
    soft: getMarpleBrandColor(200),
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
  /** page wash — default resolver background; any `OnboardingSlidesSlideUiColorInput` allowed */
  background: OnboardingSlidesSlideUiColorInput;
  titleColor: OnboardingSlidesSlideUiColorInput;
  /** accent span inside the headline — falls back to `titleColor` when omitted */
  titleHighlightColor?: OnboardingSlidesSlideUiColorInput;
  /** optional per-slide font tweaks for that accent span — merged after `ONBOARDING_SLIDES_PAGE_TITLE_HIGHLIGHT_TEXT_STYLE`, before each title’s `highlight.style` in `textValues` */
  titleHighlightTypographyOverrides?: Partial<TextStyle>;
  captionColor: OnboardingSlidesSlideUiColorInput;
  dotIndicatorColor: OnboardingSlidesSlideUiColorInput;
  continueButtonBackground: OnboardingSlidesSlideUiColorInput;
  continueButtonIcon: OnboardingSlidesSlideUiColorInput;
  /** native header progress unfilled segment — `{ scope: 'track', token: 'primarySecondaryBlend' }` or any slide `{ scope, token }`; legacy strings still supported */
  progressBarTrack: OnboardingSlidesSlideUiProgressTrackInput;
  progressBarFill: OnboardingSlidesSlideUiColorInput;
  headerBackIconColor?: OnboardingSlidesSlideUiColorInput;
  /**
   * steps that render `OnboardingQuestionnaireTimeWheel` must set this so spinner tint matches the slide’s headline ramp.
   */
  timeWheelBrandRamp?: OnboardingSlidesTimeWheelBrandRamp;
  /**
   * habit/task picker only — card titles on `OnboardingNextStepChoiceCards` (`resolveOnboardingSlidesSlideUiText`).
   */
  nextStepChoiceCardTitleColor?: OnboardingSlidesSlideUiColorInput;
  /**
   * task questionnaire only — “what’s on the agenda?” body (`OnboardingQuestionnaireTaskTitleRow` + `OnboardingTaskAgendaSuggestionsSection`).
   * omit on non–task-agenda rows. first task-branch slide should set every field: colors, suggestions heading copy, and pill labels.
   */
  taskAgendaBody?: {
    /** `TextInput` + suggestion chip label color — default: `titleColor` */
    taskTitleInput?: OnboardingSlidesSlideUiColorInput;
    /** pencil icon — default: `captionColor` */
    pencilIcon?: OnboardingSlidesSlideUiColorInput;
    /** suggestions block heading color — default: `titleColor` */
    suggestionsSectionTitle?: OnboardingSlidesSlideUiColorInput;
    /** literal “Here are some suggestions:” line above the chip rows */
    suggestionsSectionHeading?: string;
    /** sideways chip labels (order = two horizontal rows after split) */
    suggestionPillLabels?: readonly string[];
  };
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
