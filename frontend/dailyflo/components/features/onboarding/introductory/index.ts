/**
 * introductory funnel UI — consumed by `app/(onboarding)/introductory`; route shells stay under `app/`.
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
} from './constants';
export type {
  IntroPageTitleConfig,
  IntroSlideUiConfig,
  IntroTextStyleToken,
  IntroThemeBackgroundColorKey,
  IntroThemeTextColorKey,
} from './constants';

export {
  IntroWelcomeDailyFloPage,
  IntroYourDayTimelinePage,
  IntroHabitsFlowPage,
  IntroCopilotPlanPage,
} from './pages';
export {
  IntroSlideTitleSection,
  IntroSlideBodySection,
  IntroSlideSampleContent,
} from './sections';

export { OnboardingDotIndicator, OnboardingIntroShell } from './ui';
export type { OnboardingDotIndicatorProps, OnboardingIntroShellProps } from './ui';

export {
  ONBOARDING_COMPLETE_STORAGE_KEY,
  useCompleteOnboardingAndExit,
  useIntroScrollTransition,
  useOnboardingIntroHeader,
} from './hooks';
export type { UseIntroScrollTransitionResult, UseOnboardingIntroHeaderOpts } from './hooks';

export {
  crossfadeInputRange,
  crossfadeOutputRange,
  resolveIntroBackgroundColor,
  resolveIntroTextColor,
  splitIntroTitleHighlight,
} from './scrollTransition';

export { IntroScrollCrossfadeBackgrounds, IntroScrollCrossfadeTitleLayer } from './components';
export type {
  IntroScrollCrossfadeBackgroundsProps,
  IntroScrollCrossfadeTitleLayerProps,
} from './components';
