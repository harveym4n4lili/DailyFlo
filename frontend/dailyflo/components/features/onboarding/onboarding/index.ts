/**
 * post-intro questionnaire funnel — consumed by `app/onboarding` and `app/(onboarding)/slides`.
 */

export * from './constants';
export {
  resolveOnboardingSlidesTextColor,
  resolveOnboardingSlidesContinueButtonPaint,
  resolveOnboardingSlidesProgressTrackColor,
  resolveOnboardingSlidesBackgroundColor,
  resolveOnboardingSlidesBorderColor,
  resolveOnboardingSlidesSlideUiField,
  resolveOnboardingSlidesSlideUiBackground,
  resolveOnboardingSlidesSlideUiText,
  resolveOnboardingSlidesSlideUiButton,
  isOnboardingSlidesScopedSlideColor,
  isOnboardingSlidesScopedProgressTrackColor,
  blendOnboardingSlidesColorAtProgress,
  type OnboardingSlideThemeColors,
} from './onboardingSlidesThemeResolvers';
export {
  useOnboardingSlidesHeader,
  useQuestionnaireBlendProgress,
  type UseOnboardingSlidesHeaderOpts,
  type UseQuestionnaireBlendProgressResult,
} from './hooks';
export {
  OnboardingSlidesProgressBar,
  OnboardingSlidesShell,
  OnboardingQuestionnaireHeadlineCrossfade,
  OnboardingSlidesHeaderChrome,
  OnboardingSlidesInitialHeader,
  OnboardingQuestionnaireTimeWheel,
} from './ui';
export type {
  OnboardingSlidesProgressBarProps,
  OnboardingSlidesShellProps,
  OnboardingQuestionnaireHeadlineCrossfadeProps,
  OnboardingSlidesHeaderChromeProps,
  OnboardingQuestionnaireTimeWheelProps,
} from './ui';
export { OnboardingSampleSlidePage, OnboardingQuestionnaireFlow } from './pages';
export type { OnboardingSampleSlidePageProps } from './pages';
export { OnboardingSlideSampleContent } from './sections';
export type { OnboardingSlideSampleContentProps } from './sections';
