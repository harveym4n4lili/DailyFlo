/**
 * one questionnaire step layout — shell + crossfade headline + empty body slot for art/controls.
 */

import React from 'react';
import { Animated, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';

import { useKeyboardHeight } from '@/components/layout/ScreenLayout/Keyboard';
import { Paddings } from '@/constants/Paddings';

import {
  ONBOARDING_QUESTIONNAIRE_TASK_DURATION_STEP_INDEX,
  type OnboardingQuestionnaireNextStepChoice,
  type OnboardingQuestionnaireSlideModel,
} from '../constants';
import { ONBOARDING_TASK_AGENDA_INNER_HORIZONTAL_PAD } from '../constants/pagerLayout';
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
  /** when true (task branch wota+awt), use full-bleed scroll + keyboard/synced footer layout */
  taskAgendaLayoutDebug?: boolean;
  taskEventTime: Date;
  onTaskEventTimeChange: (next: Date) => void;
  /** picked on the duration sub-step — same overlay as WOTA/AWT; state is local until task create is wired */
  taskDurationMinutes: number;
  onTaskDurationMinutesChange: (next: number) => void;
  habitGoalTitle: string;
  onHabitGoalTitleChange: (next: string) => void;
  habitFrequencyId: string;
  onHabitFrequencyIdChange: (next: string) => void;
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
  taskEventTime,
  onTaskEventTimeChange,
  taskDurationMinutes,
  onTaskDurationMinutesChange,
  habitGoalTitle,
  onHabitGoalTitleChange,
  habitFrequencyId,
  onHabitFrequencyIdChange,
}: OnboardingSampleSlidePageProps) {
  const { height: windowHeight } = useWindowDimensions();
  // finish slide: timeline is taller than the wake step — the default flex column caps `absoluteFill` body layers and `OnboardingSlidesShell` adds horizontal + bottom inset that squishes the strip; we scroll + go flush with the external continue footer like the agenda debug path
  const isTaskFinishTimelineStep =
    nextStepChoice === 'task' && blendProgress > ONBOARDING_QUESTIONNAIRE_TASK_DURATION_STEP_INDEX;
  const finishTimelineBodyMinHeight = Math.round(Math.max(windowHeight * 0.68, 440));
  // keyboard listeners — gate agenda scroll so it only turns on while the keyboard is visible
  const keyboardHeight = useKeyboardHeight();
  // only allow vertical scroll while the keyboard is up — avoids accidental scroll / indicator when the layout is static
  const agendaScrollEnabled = keyboardHeight > 0;
  // scrollview gives children unbounded height on the vertical axis — approximate half the window so absolute-fill questionnaire layers still get a stable box (same rough fill as flex:1 in the non-scroll branch)
  const agendaScrollBodyMinHeight = Math.round(windowHeight * 0.52);

  const headlineBlock = (
    <>
      {/* headline + caption crossfade — tokens come from `slideModel` so branch slides stay in sync */}
      <View style={{ marginBottom: Paddings.touchTarget }}>
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
      pageSlideUi={slideModel.pageSlideUi}
      taskEventTime={taskEventTime}
      onTaskEventTimeChange={onTaskEventTimeChange}
      taskDurationMinutes={taskDurationMinutes}
      onTaskDurationMinutesChange={onTaskDurationMinutesChange}
      habitGoalTitle={habitGoalTitle}
      onHabitGoalTitleChange={onHabitGoalTitleChange}
      habitFrequencyId={habitFrequencyId}
      onHabitFrequencyIdChange={onHabitFrequencyIdChange}
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

  const shellFlushBottom = taskAgendaLayoutDebug || isTaskFinishTimelineStep;
  const shellOmitHorizontalPad = taskAgendaLayoutDebug || isTaskFinishTimelineStep;

  return (
    <OnboardingSlidesShell
      flushBottomWithExternalFooter={shellFlushBottom}
      omitHorizontalPadding={shellOmitHorizontalPad}
    >
      {taskAgendaLayoutDebug ? (
        // agenda step: scrollview is full width so the vertical indicator hugs the screen edge; inner column uses the same horizontal inset as the shell’s default questionnaire padding (`ONBOARDING_TASK_AGENDA_INNER_HORIZONTAL_PAD`)
        <ScrollView
          style={styles.agendaScroll}
          contentContainerStyle={styles.agendaScrollContent}
          scrollEnabled={agendaScrollEnabled}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={agendaScrollEnabled}
          indicatorStyle="default"
          bounces={agendaScrollEnabled}
        >
          <View style={[styles.agendaScrollInner, styles.agendaScrollInnerScreenPad]}>
            {headlineBlock}
            {bodyAgendaScroll}
          </View>
        </ScrollView>
      ) : isTaskFinishTimelineStep ? (
        <ScrollView
          style={styles.finishTimelineScroll}
          contentContainerStyle={styles.finishTimelineScrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator
          bounces
        >
          <View style={styles.finishTimelineHeadlinePad}>{headlineBlock}</View>
          <View style={[styles.finishTimelineBodySlot, { minHeight: finishTimelineBodyMinHeight }]}>
            {slideBody}
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
  agendaScrollInnerScreenPad: {
    paddingHorizontal: ONBOARDING_TASK_AGENDA_INNER_HORIZONTAL_PAD,
  },
  finishTimelineScroll: {
    flex: 1,
    width: '100%',
  },
  finishTimelineScrollContent: {
    flexGrow: 1,
  },
  /** same horizontal rhythm as the default shell — only the headline uses it when the shell is full-bleed for the timeline */
  finishTimelineHeadlinePad: {
    paddingHorizontal: Paddings.screen + Paddings.touchTarget,
  },
  finishTimelineBodySlot: {
    width: '100%',
    flexGrow: 1,
  },
});
