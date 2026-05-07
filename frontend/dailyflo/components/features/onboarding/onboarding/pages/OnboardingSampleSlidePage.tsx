/**
 * sample page for onboarding questionnaire — shell + crossfade headline/caption + demo card.
 */

import React from 'react';
import { Animated, View } from 'react-native';

import { Paddings } from '@/constants/Paddings';

import { OnboardingSlideSampleContent } from '../sections';
import { OnboardingQuestionnaireHeadlineCrossfade, OnboardingSlidesShell } from '../ui';

export type OnboardingSampleSlidePageProps = {
  pageIndex?: number;
  /** same `Animated.Value` as `useQuestionnaireBlendProgress` — drives title crossfade */
  blendProgressAnim: Animated.Value;
  /** lerped continue fill for sample card accent */
  blendedAccentFill?: string;
};

export function OnboardingSampleSlidePage({
  pageIndex = 0,
  blendProgressAnim,
  blendedAccentFill,
}: OnboardingSampleSlidePageProps) {
  return (
    <OnboardingSlidesShell>
      <View style={{ marginBottom: Paddings.touchTarget }}>
        <OnboardingQuestionnaireHeadlineCrossfade blendProgressAnim={blendProgressAnim} />
      </View>
      <OnboardingSlideSampleContent pageIndex={pageIndex} accentFill={blendedAccentFill} />
    </OnboardingSlidesShell>
  );
}
