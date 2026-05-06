/**
 * shared onboarding chrome — composed into routes under `app/(onboarding)/`.
 */

export {
  INTRO_THEME_BACKGROUND_INVERTED_KEYS,
  INTRO_THEME_TEXT_INVERTED_KEYS,
  ONBOARDING_INTRO_PAGE_COUNT,
  INTRO_TITLE_AREA_HEIGHT,
  INTRO_TITLE_SUBTEXT_GAP,
  INTRO_SUBTEXT_AREA_HEIGHT,
  INTRO_FIXED_HEADLINE_OVERLAY_HEIGHT,
  INTRO_TEXT_TOKENS,
  INTRO_SKIP_TEXT_STYLE_TOKEN,
  INTRO_SKIP_BUTTON_HIT_SLOP,
  INTRO_SKIP_BUTTON_ABSOLUTE_LAYOUT,
  INTRO_SKIP_BUTTON_ACCESSIBILITY_LABEL,
  INTRO_SKIP_BUTTON_LABEL,
  INTRO_PAGE_TITLES,
  INTRO_PAGE_CAPTIONS,
  INTRO_PAGE_SLIDE_UI,
} from './introductory';
export type {
  IntroPageTitleConfig,
  IntroPrimaryButtonColorKey,
  IntroSlideUiConfig,
  IntroTextStyleToken,
  IntroThemeBackgroundColorKey,
  IntroThemeBackgroundInvertedColorKey,
  IntroThemeTextColorKey,
  IntroThemeTextInvertedColorKey,
} from './introductory';
export { ONBOARDING_COMPLETE_STORAGE_KEY, useCompleteOnboardingAndExit } from './introductory';
export {
  useIntroScrollTransition,
  useOnboardingIntroHeader,
  type UseIntroScrollTransitionResult,
  type UseOnboardingIntroHeaderOpts,
} from './introductory';
export {
  blendIntroContinueButtonColors,
  resolveIntroBackgroundColor,
  resolveIntroContinueButtonPaint,
  resolveIntroTextColor,
  crossfadeInputRange,
  crossfadeOutputRange,
  lerpIntroHexColor,
  splitIntroTitleHighlight,
} from './introductory';
export { IntroScrollCrossfadeBackgrounds, IntroScrollCrossfadeTitleLayer } from './introductory';
export type {
  IntroScrollCrossfadeBackgroundsProps,
  IntroScrollCrossfadeTitleLayerProps,
} from './introductory';

export { OnboardingDotIndicator, type OnboardingDotIndicatorProps } from './introductory';

export {
  OnboardingIntroShell,
  type OnboardingIntroShellProps,
} from './introductory';

// introductory carousel pages + reusable slide sections (`introductory/pages`, `introductory/sections`)
export {
  IntroWelcomeDailyFloPage,
  IntroYourDayTimelinePage,
  IntroHabitsFlowPage,
  IntroCopilotPlanPage,
  IntroSlideTitleSection,
  IntroSlideBodySection,
  IntroSlideSampleContent,
} from './introductory';

// post-intro questionnaire carousel (`app/(onboarding)/slides`)
export * from './onboarding';
