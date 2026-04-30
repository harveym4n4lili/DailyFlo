/**
 * shared onboarding chrome — composed into routes under `app/(onboarding)/`.
 */

export { ONBOARDING_INTRO_PAGE_COUNT } from './onboardingIntroConstants';
export { ONBOARDING_COMPLETE_STORAGE_KEY, useCompleteOnboardingAndExit } from './useCompleteOnboardingAndExit';
export { useOnboardingIntroHeader, type UseOnboardingIntroHeaderOpts } from './useOnboardingIntroHeader';

export { OnboardingDotIndicator, type OnboardingDotIndicatorProps } from './OnboardingDotIndicator';

export {
  OnboardingIntroShell,
  type OnboardingIntroShellProps,
} from './OnboardingIntroShell';

// introductory carousel pages + reusable slide sections (`introductory/pages`, `introductory/sections`)
export {
  IntroSamplePageOne,
  IntroSamplePageTwo,
  IntroSlideTitleSection,
  IntroSlideBodySection,
} from './introductory';
