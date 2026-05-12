/**
 * one questionnaire step layout — shell + crossfade headline + empty body slot for art/controls.
 */

import React from 'react';
import { Animated, View } from 'react-native';

import { Paddings } from '@/constants/Paddings';

import { OnboardingSlideSampleContent } from '../sections';
import { OnboardingQuestionnaireHeadlineCrossfade, OnboardingSlidesShell } from '../ui';

export type OnboardingSampleSlidePageProps = {
  pageIndex?: number;
  /** fractional step index animation — drives headline opacity crossfade between titles */
  blendProgressAnim: Animated.Value;
  wakeTime: Date;
  sleepTime: Date;
  onWakeTimeChange: (next: Date) => void;
  onSleepTimeChange: (next: Date) => void;
};

export function OnboardingSampleSlidePage({
  pageIndex = 0,
  blendProgressAnim,
  wakeTime,
  sleepTime,
  onWakeTimeChange,
  onSleepTimeChange,
}: OnboardingSampleSlidePageProps) {
  return (
    <OnboardingSlidesShell>
      {/* headline + caption crossfade — wired to token colors per step in OnboardingQuestionnaireHeadlineCrossfade */}
      <View style={{ marginBottom: Paddings.touchTarget }}>
        <OnboardingQuestionnaireHeadlineCrossfade blendProgressAnim={blendProgressAnim} />
      </View>

      {/* body: illustrations, form fields, and step chrome go in OnboardingSlideSampleContent (or replace that component) */}
      <OnboardingSlideSampleContent
        pageIndex={pageIndex}
        wakeTime={wakeTime}
        sleepTime={sleepTime}
        onWakeTimeChange={onWakeTimeChange}
        onSleepTimeChange={onSleepTimeChange}
      />
    </OnboardingSlidesShell>
  );
}
