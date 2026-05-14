/**
 * questionnaire body — wake/sleep show time wheels; last slide shows habit vs task cards; intro slide reserves space.
 * mirrors headline crossfade: every slide’s body sits in an `Animated.View` opacity tied to `blendProgressAnim` so outgoing/incoming content overlap during transitions.
 */

import React, { useEffect } from 'react';
import { Animated, StyleSheet, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Reanimated, {
  type AnimatedStyle,
  Extrapolation,
  interpolate,
  useAnimatedKeyboard,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

import { Paddings } from '@/constants/Paddings';
import { crossfadeInputRange, crossfadeOutputRange } from '../../auth/scrollTransition';
import {
  ONBOARDING_QUESTIONNAIRE_CORE_PAGE_COUNT,
  ONBOARDING_QUESTIONNAIRE_NEXT_STEP_SLIDE_INDEX,
  ONBOARDING_QUESTIONNAIRE_SLEEP_STEP_INDEX,
  ONBOARDING_QUESTIONNAIRE_WAKE_STEP_INDEX,
  type OnboardingQuestionnaireNextStepChoice,
} from '../constants';
import {
  ONBOARDING_TASK_AGENDA_KEYBOARD_FINAL_Y_BLEND_REFERENCE_HEIGHT_PX,
  ONBOARDING_TASK_AGENDA_KEYBOARD_FINAL_Y_OFFSET_PX,
  getOnboardingQuestionnaireContinueFooterLayoutHeight,
} from '../constants/pagerLayout';
import { getOnboardingQuestionnaireTimeWheelBrandRampForSlide } from '../constants/slideUiTokens';
import {
  OnboardingNextStepChoiceCards,
  OnboardingQuestionnaireTaskTitleRow,
  OnboardingQuestionnaireTimeWheel,
} from '../ui';
import { OnboardingTaskAgendaExamplePreview } from './OnboardingTaskAgendaExamplePreview';

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
  // passed when parent is on task “agenda” step — flushes footer reserve for keyboard lift (scroll/shell use same flag)
  taskAgendaLayoutDebug?: boolean;
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
  taskAgendaLayoutDebug,
  taskAgendaRowLiftStyle,
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
  | 'taskAgendaLayoutDebug'
> & {
  slideIndex: number;
  /** reanimated translateY — lifts the whole agenda content column (task row + example) with the keyboard; outer body shell stays fixed */
  taskAgendaRowLiftStyle: AnimatedStyle<ViewStyle>;
}) {
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
      // task agenda: outer shell (flex) + content wrapper = task row + example (both keyboard-lifted together)
      <View style={[styles.bodySlot, styles.taskAgendaBodyShell]} accessibilityLabel="Task agenda body">
        <View style={styles.taskAgendaContentContainer} accessibilityLabel="Task agenda content">
          {/* one lift so the example block travels with the task row and stays directly under it while the keyboard is open */}
          <Reanimated.View style={taskAgendaRowLiftStyle}>
            <OnboardingQuestionnaireTaskTitleRow
              title={taskAgendaTitle}
              onTitleChange={onTaskAgendaTitleChange}
              checked={taskAgendaChecked}
              onCheckedChange={onTaskAgendaCheckedChange}
            />
            <View style={styles.taskAgendaBelowTitle}>
              <OnboardingTaskAgendaExamplePreview />
            </View>
          </Reanimated.View>
        </View>
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
  taskAgendaLayoutDebug = false,
}: OnboardingSlideSampleContentProps) {
  const count = pageCount;
  const last = Math.max(count - 1, 0);
  // nearest settled slide — only that layer stays interactive so faded wheels don’t steal taps
  const touchIndex = Math.min(last, Math.max(0, Math.round(blendProgress)));

  const insets = useSafeAreaInsets();
  // matches the continue footer layout height — keyboard overlap into the scroll area is keyboard minus this, not full keyboard (full key height over-lifted the row)
  const footerLayoutReservePx = useSharedValue(0);
  useEffect(() => {
    footerLayoutReservePx.value = getOnboardingQuestionnaireContinueFooterLayoutHeight(insets.bottom, {
      flushFooterTop: !!taskAgendaLayoutDebug,
    });
  }, [footerLayoutReservePx, insets.bottom, taskAgendaLayoutDebug]);

  // ios keyboard height — translateY lifts the stacked task row + example together; outer shell stays fixed
  const keyboardMotion = useAnimatedKeyboard();
  const taskAgendaRowLiftStyle = useAnimatedStyle(() => {
    const kb = keyboardMotion.height.value;
    const reserve = footerLayoutReservePx.value;
    const liftPx = Math.max(0, kb - reserve);
    // tail offset ramps with `kb` so it tracks show/hide instead of popping on/off at kb>0
    const tailOffset = interpolate(
      kb,
      [0, ONBOARDING_TASK_AGENDA_KEYBOARD_FINAL_Y_BLEND_REFERENCE_HEIGHT_PX],
      [0, ONBOARDING_TASK_AGENDA_KEYBOARD_FINAL_Y_OFFSET_PX],
      Extrapolation.CLAMP,
    );
    return {
      transform: [{ translateY: -liftPx + tailOffset }],
    };
  });

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
          taskAgendaLayoutDebug={taskAgendaLayoutDebug}
          taskAgendaRowLiftStyle={taskAgendaRowLiftStyle}
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
                taskAgendaLayoutDebug={taskAgendaLayoutDebug}
                taskAgendaRowLiftStyle={taskAgendaRowLiftStyle}
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
  taskAgendaBodyShell: {
    justifyContent: 'flex-end',
  },
  taskAgendaContentContainer: {
    width: '100%',
  },
  taskAgendaBelowTitle: {
    marginTop: Paddings.touchTarget,
  },
});
