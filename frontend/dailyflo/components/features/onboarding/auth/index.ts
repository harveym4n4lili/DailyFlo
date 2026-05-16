/**
 * auth funnel UI — consumed by `app/(onboarding)/auth`; questionnaire imports hooks + scroll helpers from here.
 */

export {
  AUTH_PAGE_TITLE,
  AUTH_PAGE_SLIDE_UI,
  AUTH_HEADLINE_TEXT_STYLE,
  AUTH_GAP_BELOW_HEADER,
  AUTH_THEME_BACKGROUND_INVERTED_KEYS,
  AUTH_THEME_TEXT_INVERTED_KEYS,
  AUTH_BRAND_COLORS,
} from './constants';
export type {
  AuthPageTitleConfig,
  AuthSlideUiConfig,
  IntroPrimaryButtonColorKey,
  IntroThemeBackgroundColorKey,
  IntroThemeBackgroundInvertedColorKey,
  IntroThemeTextColorKey,
  IntroThemeTextInvertedColorKey,
  IntroContinueButtonColorToken,
  IntroSlideBackgroundColor,
  IntroSlideTextColor,
} from './constants';

export { AuthLandingPage } from './pages';

export { OnboardingAuthShell } from './ui';
export type { OnboardingAuthShellProps } from './ui';

export { ONBOARDING_COMPLETE_STORAGE_KEY, useCompleteOnboardingAndExit } from './hooks';
export type { OnboardingQuestionnaireStoredAnswersV1 } from '../onboarding/constants/onboardingQuestionnaireAnswers';
export { ONBOARDING_QUESTIONNAIRE_ANSWERS_STORAGE_KEY } from '../onboarding/constants/onboardingQuestionnaireAnswers';

export {
  blendIntroContinueButtonColors,
  crossfadeInputRange,
  crossfadeOutputRange,
  lerpIntroHexColor,
  resolveIntroBackgroundColor,
  resolveIntroContinueButtonPaint,
  resolveIntroTextColor,
  splitIntroTitleHighlight,
} from './scrollTransition';
