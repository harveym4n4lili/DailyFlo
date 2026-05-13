/**
 * one questionnaire step layout — shell + crossfade headline + empty body slot for art/controls.
 */

import React from 'react';
import { Animated, View } from 'react-native';

import { Paddings } from '@/constants/Paddings';

import {
  type OnboardingQuestionnaireNextStepChoice,
  type OnboardingQuestionnaireSlideModel,
} from '../constants';
import { OnboardingSlideSampleContent } from '../sections';
import { OnboardingQuestionnaireHeadlineCrossfade, OnboardingSlidesShell } from '../ui';

export type OnboardingSampleSlidePageProps = {
  /** titles/captions/chrome rows for the active habit vs task branch */
  slideModel: OnboardingQuestionnaireSlideModel;
  /** fractional step 0…n−1 — drives chrome rgb lerp + headline/body crossfades */
  blendProgress: number;
  /** same curve as `blendProgress`, drives `Animated` opacities */
  blendProgressAnim: Animated.Value;
  wakeTime: Date;
  sleepTime: Date;
  onWakeTimeChange: (next: Date) => void;
  onSleepTimeChange: (next: Date) => void;
  nextStepChoice: OnboardingQuestionnaireNextStepChoice;
  onNextStepChoiceChange: (next: OnboardingQuestionnaireNextStepChoice) => void;
  /** first task-branch slide — captured title + checkbox until wired into backend */
  taskAgendaTitle: string;
  onTaskAgendaTitleChange: (next: string) => void;
  taskAgendaChecked: boolean;
  onTaskAgendaCheckedChange: (next: boolean) => void;
};

export function OnboardingSampleSlidePage({
  slideModel,
  blendProgress,
  blendProgressAnim,
  wakeTime,
  sleepTime,
  onWakeTimeChange,
  onSleepTimeChange,
  nextStepChoice,
  onNextStepChoiceChange,
  taskAgendaTitle,
  onTaskAgendaTitleChange,
  taskAgendaChecked,
  onTaskAgendaCheckedChange,
}: OnboardingSampleSlidePageProps) {
  return (
    <OnboardingSlidesShell>
      {/* headline + caption crossfade — tokens come from `slideModel` so branch slides stay in sync */}
      <View style={{ marginBottom: Paddings.touchTarget }}>
        <OnboardingQuestionnaireHeadlineCrossfade
          blendProgressAnim={blendProgressAnim}
          pageTitles={slideModel.pageTitles}
          pageCaptions={slideModel.pageCaptions}
          pageSlideUi={slideModel.pageSlideUi}
        />
      </View>

      {/* body stacks every slide with animated opacity so wheels/copy crossfade like headlines */}
      <View style={{ flex: 1, width: '100%' }}>
        <OnboardingSlideSampleContent
          pageCount={slideModel.pageCount}
          blendProgress={blendProgress}
          blendProgressAnim={blendProgressAnim}
          wakeTime={wakeTime}
          sleepTime={sleepTime}
          onWakeTimeChange={onWakeTimeChange}
          onSleepTimeChange={onSleepTimeChange}
          nextStepChoice={nextStepChoice}
          onNextStepChoiceChange={onNextStepChoiceChange}
          taskAgendaTitle={taskAgendaTitle}
          onTaskAgendaTitleChange={onTaskAgendaTitleChange}
          taskAgendaChecked={taskAgendaChecked}
          onTaskAgendaCheckedChange={onTaskAgendaCheckedChange}
        />
      </View>
    </OnboardingSlidesShell>
  );
}
