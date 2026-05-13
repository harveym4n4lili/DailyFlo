/**
 * questionnaire body — wake/sleep show time wheels; last slide shows habit vs task cards; intro slide reserves space.
 * mirrors headline crossfade: every slide’s body sits in an `Animated.View` opacity tied to `blendProgressAnim` so outgoing/incoming content overlap during transitions.
 */

import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { crossfadeInputRange, crossfadeOutputRange } from '../../auth/scrollTransition';
import {
  ONBOARDING_QUESTIONNAIRE_CORE_PAGE_COUNT,
  ONBOARDING_QUESTIONNAIRE_NEXT_STEP_SLIDE_INDEX,
  ONBOARDING_QUESTIONNAIRE_SLEEP_STEP_INDEX,
  ONBOARDING_QUESTIONNAIRE_WAKE_STEP_INDEX,
  type OnboardingQuestionnaireNextStepChoice,
} from '../constants';
import { getOnboardingQuestionnaireTimeWheelBrandRampForSlide } from '../constants/slideUiTokens';
import {
  OnboardingNextStepChoiceCards,
  OnboardingQuestionnaireTaskTitleRow,
  OnboardingQuestionnaireTimeWheel,
} from '../ui';

export type OnboardingSlideSampleContentProps = {
  /** total questionnaire steps — habit vs task changes branch length */
  pageCount: number;
  /** numeric mirror of `blendProgressAnim` — picks which layer receives touches (`pointerEvents`) */
  blendProgress: number;
  /** fractional step index animation — same units as headline crossfade (`pageWidth` = 1) */
  blendProgressAnim: Animated.Value;
  wakeTime: Date;
  sleepTime: Date;
  onWakeTimeChange: (next: Date) => void;
  onSleepTimeChange: (next: Date) => void;
  nextStepChoice: OnboardingQuestionnaireNextStepChoice;
  onNextStepChoiceChange: (next: OnboardingQuestionnaireNextStepChoice) => void;
  /** task branch slide 1 — title row reads/writes questionnaire-local state until persistence exists */
  taskAgendaTitle: string;
  onTaskAgendaTitleChange: (next: string) => void;
  taskAgendaChecked: boolean;
  onTaskAgendaCheckedChange: (next: boolean) => void;
};

/** one slide’s body branch — unchanged behavior vs previous single-`pageIndex` implementation */
function QuestionnaireBodySlot({
  slideIndex,
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
}: Pick<
  OnboardingSlideSampleContentProps,
  | 'wakeTime'
  | 'sleepTime'
  | 'onWakeTimeChange'
  | 'onSleepTimeChange'
  | 'nextStepChoice'
  | 'onNextStepChoiceChange'
  | 'taskAgendaTitle'
  | 'onTaskAgendaTitleChange'
  | 'taskAgendaChecked'
  | 'onTaskAgendaCheckedChange'
> & { slideIndex: number }) {
  if (slideIndex === ONBOARDING_QUESTIONNAIRE_WAKE_STEP_INDEX) {
    const brandRamp = getOnboardingQuestionnaireTimeWheelBrandRampForSlide(slideIndex);
    return (
      <View style={styles.bodySlot} accessibilityLabel="Wake time question">
        <OnboardingQuestionnaireTimeWheel
          brandRamp={brandRamp}
          value={wakeTime}
          onChange={onWakeTimeChange}
          accessibilityLabel="Wake up time"
        />
      </View>
    );
  }

  if (slideIndex === ONBOARDING_QUESTIONNAIRE_SLEEP_STEP_INDEX) {
    const brandRamp = getOnboardingQuestionnaireTimeWheelBrandRampForSlide(slideIndex);
    return (
      <View style={styles.bodySlot} accessibilityLabel="Sleep time question">
        <OnboardingQuestionnaireTimeWheel
          brandRamp={brandRamp}
          value={sleepTime}
          onChange={onSleepTimeChange}
          accessibilityLabel="Bedtime"
        />
      </View>
    );
  }

  if (slideIndex === ONBOARDING_QUESTIONNAIRE_NEXT_STEP_SLIDE_INDEX) {
    return (
      <View style={styles.bodySlot} accessibilityLabel="Next step choice">
        <OnboardingNextStepChoiceCards value={nextStepChoice} onChange={onNextStepChoiceChange} />
      </View>
    );
  }

  if (
    slideIndex === ONBOARDING_QUESTIONNAIRE_CORE_PAGE_COUNT &&
    nextStepChoice === 'task'
  ) {
    return (
      // task agenda — fill crossfade layer height then pin row to bottom so headline/subtext breathe above empty space (same pattern as footer-aligned controls elsewhere)
      <View style={[styles.bodySlot, styles.taskAgendaBodySlot]} accessibilityLabel="Task agenda title">
        <OnboardingQuestionnaireTaskTitleRow
          title={taskAgendaTitle}
          onTitleChange={onTaskAgendaTitleChange}
          checked={taskAgendaChecked}
          onCheckedChange={onTaskAgendaCheckedChange}
        />
      </View>
    );
  }

  if (slideIndex >= ONBOARDING_QUESTIONNAIRE_CORE_PAGE_COUNT) {
    return (
      <View style={styles.bodySlot} accessibilityLabel="Questionnaire body content">
        {/* habit/task follow-up steps — inputs + artwork plug in here */}
      </View>
    );
  }

  return (
    <View style={styles.bodySlot} accessibilityLabel="Questionnaire body content">
      {/* future steps: illustrations / controls */}
    </View>
  );
}

export function OnboardingSlideSampleContent({
  pageCount,
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
}: OnboardingSlideSampleContentProps) {
  const count = pageCount;
  const last = Math.max(count - 1, 0);
  // nearest settled slide — only that layer stays interactive so faded wheels don’t steal taps
  const touchIndex = Math.min(last, Math.max(0, Math.round(blendProgress)));

  return (
    <View style={styles.stack}>
      {/* wake step holds the tallest body (time wheel) — reserves flex height like headline probe */}
      <View
        style={styles.heightProbe}
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <QuestionnaireBodySlot
          slideIndex={ONBOARDING_QUESTIONNAIRE_WAKE_STEP_INDEX}
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

      <View style={styles.crossfadeLayers} pointerEvents="box-none">
        {Array.from({ length: count }, (_, i) => {
          const opacity = blendProgressAnim.interpolate({
            inputRange: crossfadeInputRange(i, 1, count),
            outputRange: crossfadeOutputRange(i, count),
            extrapolate: 'clamp',
          });
          return (
            <Animated.View
              key={i}
              style={[styles.layer, { opacity }]}
              pointerEvents={touchIndex === i ? 'auto' : 'none'}
            >
              <QuestionnaireBodySlot
                slideIndex={i}
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
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    flex: 1,
    position: 'relative',
    width: '100%',
  },
  heightProbe: {
    opacity: 0,
  },
  crossfadeLayers: {
    ...StyleSheet.absoluteFillObject,
  },
  layer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  bodySlot: {
    flex: 1,
    width: '100%',
  },
  taskAgendaBodySlot: {
    justifyContent: 'flex-end',
  },
});
