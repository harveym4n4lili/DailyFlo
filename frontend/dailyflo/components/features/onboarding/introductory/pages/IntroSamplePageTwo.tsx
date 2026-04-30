/**
 * sample intro beat 02 — routed inside horizontal pager (`app/(onboarding)/introductory`).
 */

import React from 'react';

import { OnboardingIntroShell } from '@/components/features/onboarding/OnboardingIntroShell';
import { IntroSlideBodySection, IntroSlideTitleSection } from '../sections';

export function IntroSamplePageTwo() {
  return (
    <OnboardingIntroShell>
      <IntroSlideTitleSection title="Stay in flow" />
      <IntroSlideBodySection text="This slide uses `primarySecondaryBlend` so each page can own a distinct surface while staying on-brand. Finish with continue to reach the tabs (same as skip)." />
    </OnboardingIntroShell>
  );
}
