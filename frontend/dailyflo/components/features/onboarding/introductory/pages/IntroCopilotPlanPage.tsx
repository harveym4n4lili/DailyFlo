/**
 * intro slide: "Our Copilot, your plan" — sample swipe content only; title + subtext are fixed overlays.
 */

import React from 'react';
import { View } from 'react-native';

import { INTRO_FIXED_HEADLINE_OVERLAY_HEIGHT } from '@/components/features/onboarding/introductory/constants';
import { OnboardingIntroShell } from '@/components/features/onboarding/introductory/ui';
import { IntroSlideSampleContent } from '../sections';

export function IntroCopilotPlanPage() {
  return (
    <OnboardingIntroShell>
      <View style={{ height: INTRO_FIXED_HEADLINE_OVERLAY_HEIGHT }} />
      <IntroSlideSampleContent pageIndex={3} />
    </OnboardingIntroShell>
  );
}
