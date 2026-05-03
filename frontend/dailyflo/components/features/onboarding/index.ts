/**
 * shared onboarding chrome — composed into routes under `app/(onboarding)/`.
 */

export {
  ONBOARDING_INTRO_PAGE_COUNT,
  INTRO_TITLE_AREA_HEIGHT,
  INTRO_TITLE_SUBTEXT_GAP,
  INTRO_SUBTEXT_AREA_HEIGHT,
  INTRO_FIXED_HEADLINE_OVERLAY_HEIGHT,
  INTRO_TEXT_TOKENS,
  INTRO_PAGE_TITLES,
  INTRO_PAGE_CAPTIONS,
  INTRO_PAGE_SLIDE_UI,
} from './introductory';
export type {
  IntroPageTitleConfig,
  IntroSlideUiConfig,
  IntroTextStyleToken,
  IntroThemeBackgroundColorKey,
  IntroThemeTextColorKey,
} from './introductory';
export { ONBOARDING_COMPLETE_STORAGE_KEY, useCompleteOnboardingAndExit } from './introductory';
export {
  useIntroScrollTransition,
  useOnboardingIntroHeader,
  type UseIntroScrollTransitionResult,
  type UseOnboardingIntroHeaderOpts,
} from './introductory';
export {
  resolveIntroBackgroundColor,
  resolveIntroTextColor,
  crossfadeInputRange,
  crossfadeOutputRange,
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
