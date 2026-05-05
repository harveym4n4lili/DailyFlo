/**
 * post-intro questionnaire funnel — consumed by `app/(onboarding)/slides`; route hosts the horizontal pager.
 */

export * from './constants';
export {
  useOnboardingSlidesHeader,
  useOnboardingSlidesScrollTransition,
} from './hooks';
export type {
  UseOnboardingSlidesHeaderOpts,
  UseOnboardingSlidesScrollTransitionResult,
} from './hooks';
export { OnboardingSlidesProgressBar, OnboardingSlidesShell } from './ui';
export type { OnboardingSlidesProgressBarProps, OnboardingSlidesShellProps } from './ui';
export { OnboardingSampleSlidePage } from './pages';
export type { OnboardingSampleSlidePageProps } from './pages';
export { OnboardingSlideSampleContent } from './sections';
export type { OnboardingSlideSampleContentProps } from './sections';
