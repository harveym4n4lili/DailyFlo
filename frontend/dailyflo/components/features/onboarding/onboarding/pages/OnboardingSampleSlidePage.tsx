/**
 * one questionnaire step layout — shell + crossfade headline + empty body slot for art/controls.
 */

import React from 'react';
import { Animated, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';

import { useKeyboardHeight } from '@/components/layout/ScreenLayout/Keyboard';
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
  /** when true (task branch + agenda step), paints debug backgrounds so regions line up — temporary */
  taskAgendaLayoutDebug?: boolean;
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
  taskAgendaLayoutDebug = false,
}: OnboardingSampleSlidePageProps) {
  const { height: windowHeight } = useWindowDimensions();
  // rn keyboard events → pixel height; 0 means hidden — we only allow scrolling then so headline + task row stay locked until typing needs room
  const keyboardHeight = useKeyboardHeight();
  const agendaScrollEnabled = taskAgendaLayoutDebug && keyboardHeight > 0;
  // scrollview gives children unbounded height on the vertical axis — approximate half the window so absolute-fill questionnaire layers still get a stable box (same rough fill as flex:1 in the non-scroll branch)
  const agendaScrollBodyMinHeight = Math.round(windowHeight * 0.52);

  const headlineBlock = (
    <>
      {/* headline + caption crossfade — tokens come from `slideModel` so branch slides stay in sync */}
      {/* red wrap only when debugging agenda layout — shows title/subtext bounds vs yellow body */}
      <View
        style={[
          { marginBottom: Paddings.touchTarget },
          taskAgendaLayoutDebug && styles.headlineAgendaDebug,
        ]}
      >
        <OnboardingQuestionnaireHeadlineCrossfade
          blendProgressAnim={blendProgressAnim}
          pageTitles={slideModel.pageTitles}
          pageCaptions={slideModel.pageCaptions}
          pageSlideUi={slideModel.pageSlideUi}
        />
      </View>
    </>
  );

  const slideBody = (
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
      taskAgendaLayoutDebug={taskAgendaLayoutDebug}
    />
  );

  const bodyNonScroll = (
    <View style={styles.bodySlotFlex}>{slideBody}</View>
  );

  const bodyAgendaScroll = (
    <View style={[styles.agendaScrollBodySlot, { minHeight: agendaScrollBodyMinHeight }]}>
      {slideBody}
    </View>
  );

  return (
    <OnboardingSlidesShell flushBottomWithExternalFooter={taskAgendaLayoutDebug}>
      {taskAgendaLayoutDebug ? (
        // agenda debug step: single vertical scroller wraps red headline band + yellow task slot — scroll only while keyboard is up so taps aren’t eaten when idle
        <ScrollView
          style={styles.agendaScroll}
          contentContainerStyle={styles.agendaScrollContent}
          scrollEnabled={agendaScrollEnabled}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={agendaScrollEnabled}
          bounces={agendaScrollEnabled}
        >
          <View style={styles.agendaScrollInner}>
            {headlineBlock}
            {bodyAgendaScroll}
          </View>
        </ScrollView>
      ) : (
        <>
          {headlineBlock}
          {bodyNonScroll}
        </>
      )}
    </OnboardingSlidesShell>
  );
}

const styles = StyleSheet.create({
  headlineAgendaDebug: {
    backgroundColor: 'red',
  },
  bodySlotFlex: {
    flex: 1,
    width: '100%',
  },
  agendaScrollBodySlot: {
    width: '100%',
    flexGrow: 1,
  },
  agendaScroll: {
    flex: 1,
    width: '100%',
  },
  agendaScrollContent: {
    flexGrow: 1,
  },
  agendaScrollInner: {
    flexGrow: 1,
    width: '100%',
  },
});
