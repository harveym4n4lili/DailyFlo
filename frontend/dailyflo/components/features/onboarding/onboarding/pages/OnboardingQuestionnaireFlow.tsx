/**
 * post-intro questionnaire body — one step at a time (no horizontal swipe).
 * step changes animate `blendProgress` 0…n−1 like intro scroll so header bar + body colors rgb-lerp (`blendIntroContinueButtonColors`, etc.).
 * after “pick next step”, extra slides depend on habit vs task (`getOnboardingQuestionnaireSlideModel`).
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Keyboard, StyleSheet, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedKeyboard,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OnboardingContinueButton } from '@/components/ui/Button';
import { blendIntroContinueButtonColors } from '../../auth/scrollTransition';
import { Paddings } from '@/constants/Paddings';
import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { useThemeColors } from '@/hooks/useColorPalette';

import { useCompleteOnboardingAndExit } from '../../auth/hooks/useCompleteOnboardingAndExit';
import {
  ONBOARDING_CONTINUE_FOOTER_KEYBOARD_FINAL_Y_OFFSET_PX,
  ONBOARDING_QUESTIONNAIRE_HABIT_GOAL_STEP_INDEX,
  ONBOARDING_QUESTIONNAIRE_TASK_DURATION_STEP_INDEX,
  ONBOARDING_QUESTIONNAIRE_TASK_WOTA_STEP_INDEX,
  ONBOARDING_SLIDES_CONTINUE_BUTTON_TEXT_STYLE,
  ONBOARDING_SLIDES_CONTINUE_LABEL,
  ONBOARDING_SLIDES_FINISH_SETUP_LABEL,
  ONBOARDING_TASK_AGENDA_KEYBOARD_FINAL_Y_BLEND_REFERENCE_HEIGHT_PX,
  type OnboardingQuestionnaireNextStepChoice,
  buildOnboardingQuestionnaireStoredAnswers,
  getOnboardingQuestionnaireContinueFooterLayoutHeight,
  getOnboardingQuestionnaireSlideModel,
} from '../constants';
import { ONBOARDING_HABIT_FREQUENCY_OPTIONS } from '../constants/onboardingQuestionnaireAnswers';
import { useOnboardingSlidesHeader, useQuestionnaireBlendProgress } from '../hooks';
import {
  blendOnboardingSlidesColorAtProgress,
  resolveOnboardingSlidesProgressTrackColor,
  resolveOnboardingSlidesSlideUiBackground,
  resolveOnboardingSlidesSlideUiButton,
  resolveOnboardingSlidesSlideUiText,
} from '../onboardingSlidesThemeResolvers';
import { OnboardingSampleSlidePage } from './OnboardingSampleSlidePage';

/** when toggling habit/task on the picker step, clamp page index so we never sit past the new last slide */
function clampPageIndex(pageIndex: number, choice: OnboardingQuestionnaireNextStepChoice): number {
  const maxIdx = getOnboardingQuestionnaireSlideModel(choice).pageCount - 1;
  return Math.min(pageIndex, Math.max(0, maxIdx));
}

export function OnboardingQuestionnaireFlow() {
  const themeColors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useGuardedRouter();
  const [pageIndex, setPageIndex] = useState(0);
  const [wakeTime, setWakeTime] = useState(() => {
    const d = new Date();
    d.setHours(8, 0, 0, 0);
    return d;
  });
  const [sleepTime, setSleepTime] = useState(() => {
    const d = new Date();
    d.setHours(22, 0, 0, 0);
    return d;
  });
  const [nextStepChoice, setNextStepChoice] = useState<OnboardingQuestionnaireNextStepChoice>('habit');
  // holds what the user types on “what’s on the agenda?” — not saved yet; hook this into task create when backend wiring lands
  const [taskAgendaTitle, setTaskAgendaTitle] = useState('');
  const [taskAgendaChecked, setTaskAgendaChecked] = useState(false);
  const { completeAndExit, busy } = useCompleteOnboardingAndExit();

  const [taskEventTime, setTaskEventTime] = useState(() => {
    const d = new Date();
    d.setHours(9, 0, 0, 0);
    return d;
  });
  // default matches common focus block; glass slider snaps to same preset list as task duration elsewhere
  const [taskDurationMinutes, setTaskDurationMinutes] = useState(30);
  const [pendingWotaToTimeAdvance, setPendingWotaToTimeAdvance] = useState(false);
  /** habit branch — goal + frequency ids end up in `buildOnboardingQuestionnaireStoredAnswers` on finish */
  const [habitGoalTitle, setHabitGoalTitle] = useState('');
  const [habitFrequencyId, setHabitFrequencyId] = useState(() => ONBOARDING_HABIT_FREQUENCY_OPTIONS[0].id);

  const slideModel = useMemo(() => getOnboardingQuestionnaireSlideModel(nextStepChoice), [nextStepChoice]);

  const lastStep = Math.max(0, slideModel.pageCount - 1);

  const handleNextStepChoiceChange = useCallback((choice: OnboardingQuestionnaireNextStepChoice) => {
    setNextStepChoice(choice);
    setPageIndex((i) => clampPageIndex(i, choice));
  }, []);

  const { blendProgress, blendProgressAnim } = useQuestionnaireBlendProgress(pageIndex);

  // after wota continue: wait for keyboard to hide so the row snaps to baseline, then advance to awt (drives headline + body sub-animation)
  useEffect(() => {
    if (!pendingWotaToTimeAdvance) return undefined;
    let didRun = false;
    const advance = () => {
      if (didRun) return;
      didRun = true;
      setPageIndex((i) =>
        i === ONBOARDING_QUESTIONNAIRE_TASK_WOTA_STEP_INDEX ? i + 1 : i,
      );
      setPendingWotaToTimeAdvance(false);
    };
    const sub = Keyboard.addListener('keyboardDidHide', advance);
    const t = setTimeout(advance, 450);
    return () => {
      sub.remove();
      clearTimeout(t);
    };
  }, [pendingWotaToTimeAdvance]);

  const trackColorsByPage = useMemo(
    () =>
      slideModel.pageSlideUi.map((row) =>
        resolveOnboardingSlidesProgressTrackColor(themeColors, row.progressBarTrack),
      ),
    [themeColors, slideModel.pageSlideUi],
  );
  const progressFillColorsByPage = useMemo(
    () =>
      slideModel.pageSlideUi.map((row) => resolveOnboardingSlidesSlideUiButton(themeColors, row.progressBarFill)),
    [themeColors, slideModel.pageSlideUi],
  );
  const backgroundColorsByPage = useMemo(
    () =>
      slideModel.pageSlideUi.map((row) =>
        resolveOnboardingSlidesSlideUiBackground(themeColors, row.background),
      ),
    [themeColors, slideModel.pageSlideUi],
  );

  const continuePaintByPage = useMemo(
    () => ({
      fills: slideModel.pageSlideUi.map((row) =>
        resolveOnboardingSlidesSlideUiButton(themeColors, row.continueButtonBackground),
      ),
      icons: slideModel.pageSlideUi.map((row) =>
        resolveOnboardingSlidesSlideUiButton(themeColors, row.continueButtonIcon),
      ),
    }),
    [themeColors, slideModel.pageSlideUi],
  );

  const backIconColorsByPage = useMemo(
    () =>
      slideModel.pageSlideUi.map((row) =>
        resolveOnboardingSlidesSlideUiText(themeColors, row.headerBackIconColor ?? 'secondary'),
      ),
    [themeColors, slideModel.pageSlideUi],
  );

  const barTrack = useMemo(
    () => blendOnboardingSlidesColorAtProgress(blendProgress, trackColorsByPage),
    [blendProgress, trackColorsByPage],
  );
  const barFill = useMemo(
    () => blendOnboardingSlidesColorAtProgress(blendProgress, progressFillColorsByPage),
    [blendProgress, progressFillColorsByPage],
  );
  const stepBackground = useMemo(
    () => blendOnboardingSlidesColorAtProgress(blendProgress, backgroundColorsByPage),
    [blendProgress, backgroundColorsByPage],
  );

  const backChevronColor = useMemo(
    () => blendOnboardingSlidesColorAtProgress(blendProgress, backIconColorsByPage),
    [blendProgress, backIconColorsByPage],
  );

  const continuePaint = useMemo(
    () =>
      blendIntroContinueButtonColors(
        blendProgress,
        continuePaintByPage.fills,
        continuePaintByPage.icons,
      ),
    [blendProgress, continuePaintByPage],
  );
  const continueFill = continuePaint.fill;
  const continueLabelColor = continuePaint.icon;

  const continueLabelStyle = useMemo(
    () => [ONBOARDING_SLIDES_CONTINUE_BUTTON_TEXT_STYLE, { color: continueLabelColor }],
    [continueLabelColor],
  );

  const goBack = useCallback(() => {
    setPendingWotaToTimeAdvance(false);
    if (pageIndex > 0) {
      setPageIndex((i) => i - 1);
      return;
    }
    router.back();
  }, [pageIndex, router]);

  useOnboardingSlidesHeader({
    pageProgress: blendProgress,
    totalPages: slideModel.pageCount,
    trackColor: barTrack,
    fillColor: barFill,
    backChevronColor,
    onBackPress: goBack,
    backAccessibilityLabel: pageIndex > 0 ? 'Previous questionnaire step' : 'Back to introduction',
  });

  const onContinue = useCallback(() => {
    if (
      nextStepChoice === 'task' &&
      pageIndex === ONBOARDING_QUESTIONNAIRE_TASK_WOTA_STEP_INDEX &&
      taskAgendaTitle.trim().length === 0
    ) {
      return;
    }
    if (nextStepChoice === 'task' && pageIndex === ONBOARDING_QUESTIONNAIRE_TASK_WOTA_STEP_INDEX) {
      if (pendingWotaToTimeAdvance) return;
      // blur inputs + collapse keyboard so the shared body layer returns to y=0 before `blendProgress` runs 4→5 (wota→awt)
      Keyboard.dismiss();
      setPendingWotaToTimeAdvance(true);
      return;
    }
    if (pageIndex < lastStep) {
      setPageIndex((i) => i + 1);
      return;
    }
    const answers = buildOnboardingQuestionnaireStoredAnswers({
      branch: nextStepChoice,
      wakeTime,
      sleepTime,
      task: {
        title: taskAgendaTitle,
        completed: taskAgendaChecked,
        eventTime: taskEventTime,
        durationMinutes: taskDurationMinutes,
      },
      habit: {
        goalTitle: habitGoalTitle,
        frequencyId: habitFrequencyId,
      },
    });
    void completeAndExit(answers);
  }, [
    pageIndex,
    lastStep,
    completeAndExit,
    nextStepChoice,
    taskAgendaTitle,
    pendingWotaToTimeAdvance,
    wakeTime,
    sleepTime,
    taskAgendaChecked,
    taskEventTime,
    taskDurationMinutes,
    habitGoalTitle,
    habitFrequencyId,
  ]);

  // task wota + awt: same scroll/keyboard footer treatment on both sub-steps (one shared body layer)
  const taskAgendaLayoutDebug =
    nextStepChoice === 'task' &&
    pageIndex >= ONBOARDING_QUESTIONNAIRE_TASK_WOTA_STEP_INDEX &&
    pageIndex <= ONBOARDING_QUESTIONNAIRE_TASK_DURATION_STEP_INDEX;

  const taskAgendaContinueBlocked =
    nextStepChoice === 'task' &&
    pageIndex === ONBOARDING_QUESTIONNAIRE_TASK_WOTA_STEP_INDEX &&
    taskAgendaTitle.trim().length === 0;

  const habitGoalContinueBlocked =
    nextStepChoice === 'habit' &&
    pageIndex === ONBOARDING_QUESTIONNAIRE_HABIT_GOAL_STEP_INDEX &&
    habitGoalTitle.trim().length === 0;

  // layout height of the continue row below the flex step — keyboard only overlaps the scroll body by (keyboard height − this), so paddingBottom = that gap pins the scrollview bottom to the keyboard top
  const agendaContinueFooterLayoutHeightPx = useMemo(
    () => getOnboardingQuestionnaireContinueFooterLayoutHeight(insets.bottom, { flushFooterTop: true }),
    [insets.bottom],
  );

  // agenda step only: lift the continue strip with keyboard; tail offset uses the same height→blend curve as the agenda body so both tracks stay in sync
  const agendaFooterLiftActive = useSharedValue(0);
  useEffect(() => {
    agendaFooterLiftActive.value = taskAgendaLayoutDebug ? 1 : 0;
  }, [agendaFooterLiftActive, taskAgendaLayoutDebug]);
  const keyboard = useAnimatedKeyboard();
  const agendaFooterKeyboardStyle = useAnimatedStyle(() => {
    const kb = keyboard.height.value;
    const active = agendaFooterLiftActive.value;
    const baseLift = -kb * active;
    const tailOffset =
      active *
      interpolate(
        kb,
        [0, ONBOARDING_TASK_AGENDA_KEYBOARD_FINAL_Y_BLEND_REFERENCE_HEIGHT_PX],
        [0, ONBOARDING_CONTINUE_FOOTER_KEYBOARD_FINAL_Y_OFFSET_PX],
        Extrapolation.CLAMP,
      );
    return {
      transform: [{ translateY: baseLift + tailOffset }],
    };
  });
  // agenda scroll: pad the flex step so the scrollview’s bottom edge sits on the keyboard top (not on the continue footer’s layout top — that’s kb − footer layout height)
  const stepAgendaKeyboardPadStyle = useAnimatedStyle(() => {
    const kb = keyboard.height.value;
    const active = agendaFooterLiftActive.value;
    const pad = active * Math.max(0, kb - agendaContinueFooterLayoutHeightPx);
    return { paddingBottom: pad };
  });

  return (
    <View style={[styles.root, { backgroundColor: stepBackground }]}>
      <Animated.View style={[styles.step, stepAgendaKeyboardPadStyle]}>
        <OnboardingSampleSlidePage
          slideModel={slideModel}
          blendProgress={blendProgress}
          blendProgressAnim={blendProgressAnim}
          wakeTime={wakeTime}
          sleepTime={sleepTime}
          onWakeTimeChange={setWakeTime}
          onSleepTimeChange={setSleepTime}
          nextStepChoice={nextStepChoice}
          onNextStepChoiceChange={handleNextStepChoiceChange}
          taskAgendaTitle={taskAgendaTitle}
          onTaskAgendaTitleChange={setTaskAgendaTitle}
          taskAgendaChecked={taskAgendaChecked}
          onTaskAgendaCheckedChange={setTaskAgendaChecked}
          taskAgendaLayoutDebug={taskAgendaLayoutDebug}
          taskEventTime={taskEventTime}
          onTaskEventTimeChange={setTaskEventTime}
          taskDurationMinutes={taskDurationMinutes}
          onTaskDurationMinutesChange={setTaskDurationMinutes}
          habitGoalTitle={habitGoalTitle}
          onHabitGoalTitleChange={setHabitGoalTitle}
          habitFrequencyId={habitFrequencyId}
          onHabitFrequencyIdChange={setHabitFrequencyId}
        />
      </Animated.View>
      <Animated.View
        style={[
          styles.continueFooter,
          taskAgendaLayoutDebug && styles.continueFooterAgendaFlushTop,
          { paddingBottom: Math.max(insets.bottom, Paddings.screen) },
          agendaFooterKeyboardStyle,
        ]}
        pointerEvents="box-none"
      >
        <OnboardingContinueButton
          onPress={onContinue}
          loading={busy}
          disabled={busy || taskAgendaContinueBlocked || habitGoalContinueBlocked}
          label={pageIndex < lastStep ? ONBOARDING_SLIDES_CONTINUE_LABEL : ONBOARDING_SLIDES_FINISH_SETUP_LABEL}
          labelStyle={continueLabelStyle}
          tintColor={continueFill}
          labelColor={continueLabelColor}
          accessibilityLabel={
            pageIndex < lastStep ? 'Continue to next question' : 'Finish setup and go to the app'
          }
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  step: {
    flex: 1,
  },
  continueFooter: {
    backgroundColor: 'transparent',
    paddingHorizontal: Paddings.screen,
    paddingTop: Paddings.touchTarget,
    zIndex: 10,
    elevation: 10,
  },
  // agenda: remove top pad so the body can sit flush against the continue row when the shell drops bottom inset
  continueFooterAgendaFlushTop: {
    paddingTop: 0,
  },
});
