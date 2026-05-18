/**
 * auth funnel UI — consumed by `app/(onboarding)/auth`; questionnaire imports hooks + scroll helpers from here.
 */

export {
  AUTH_PAGE_SLIDE_UI,
  AUTH_LANDING_SLIDE_UI,
  AUTH_LANDING_SLOGAN_LEAD,
  AUTH_LANDING_SLOGAN_MIDDLE,
  AUTH_LANDING_SLOGAN_MIDDLE_BEFORE_TAIL,
  AUTH_LANDING_SLOGAN_MIDDLE_LEAD,
  AUTH_LANDING_SLOGAN_TAIL,
  AUTH_LANDING_SLOGAN_MIDDLE_STYLE_OVERRIDES,
  AUTH_LANDING_SLOGAN_MIDDLE_TEXT_STYLE,
  AUTH_LANDING_SLOGAN_MIDDLE_USE_ONBOARDING_FACE,
  AUTH_LANDING_TYPOGRAPHY_PLATFORM,
  AUTH_LANDING_WORDMARK_APP_ICON_RADIUS_RATIO,
  AUTH_LANDING_WORDMARK_ICON_SIZE,
  getAuthLandingSloganMiddleTextStyle,
  AUTH_GAP_BELOW_HEADER,
  AUTH_THEME_BACKGROUND_INVERTED_KEYS,
  AUTH_THEME_TEXT_INVERTED_KEYS,
  AUTH_BRAND_COLORS,
} from './constants';
export {
  AUTH_LANDING_PAGE_TITLE_TEXT_STYLE,
  AUTH_LANDING_TITLE_TEXT_STYLE,
  AUTH_HEADLINE_TEXT_STYLE,
  getAuthLandingPageTitleTextStyle,
} from '@/constants/Typography';
export type {
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
