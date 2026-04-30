/**
 * sample intro beat 01 — routed inside horizontal pager (`app/(onboarding)/introductory`).
 */

import React from 'react';

import { OnboardingIntroShell } from '@/components/features/onboarding/OnboardingIntroShell';
import { IntroSlideBodySection, IntroSlideTitleSection } from '../sections';

export function IntroSamplePageOne() {
  return (
    <OnboardingIntroShell>
      <IntroSlideTitleSection title="Welcome to DailyFlo" />
      <IntroSlideBodySection text="This slide uses the primary background edge-to-edge. Swipe sideways for the second sample, or tap continue." />
    </OnboardingIntroShell>
  );
}
