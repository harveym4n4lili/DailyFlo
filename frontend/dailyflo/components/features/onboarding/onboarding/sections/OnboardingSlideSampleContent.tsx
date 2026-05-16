/**
 * questionnaire body — wake/sleep show time wheels; last slide shows habit vs task cards; intro slide reserves space.
 * mirrors headline crossfade: each step’s body stacks in absolute layers; opacity crossfade matches headline timing.
 * layers use reanimated opacity (not rn `Animated.View`) so the task-agenda keyboard lift (`Reanimated.View` inside) still fades with its parent — mixing drivers often drops opacity on native views.
 */

import React, { useEffect, useMemo } from 'react';
import { Animated, StyleSheet, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Reanimated, {
  type AnimatedStyle,
  type SharedValue,
  Extrapolation,
  interpolate,
  useAnimatedKeyboard,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

import { useThemeColors } from '@/hooks/useColorPalette';
import {
  ONBOARDING_QUESTIONNAIRE_CORE_PAGE_COUNT,
  ONBOARDING_QUESTIONNAIRE_NEXT_STEP_SLIDE_INDEX,
  ONBOARDING_QUESTIONNAIRE_SLEEP_STEP_INDEX,
  ONBOARDING_QUESTIONNAIRE_TASK_TIME_STEP_INDEX,
  ONBOARDING_QUESTIONNAIRE_TASK_WOTA_STEP_INDEX,
  ONBOARDING_QUESTIONNAIRE_WAKE_STEP_INDEX,
  type OnboardingQuestionnaireNextStepChoice,
} from '../constants';
import {
  ONBOARDING_TASK_AGENDA_SUGGESTION_PILLS,
  ONBOARDING_TASK_AGENDA_SUGGESTIONS_SECTION_TITLE,
  getOnboardingQuestionnaireTimeWheelBrandRampForSlide,
} from '../constants/slideUiTokens';
import {
  ONBOARDING_TASK_AGENDA_KEYBOARD_FINAL_Y_BLEND_REFERENCE_HEIGHT_PX,
  ONBOARDING_TASK_AGENDA_KEYBOARD_FINAL_Y_OFFSET_PX,
  ONBOARDING_TASK_AGENDA_TASK_TO_SUGGESTIONS_GAP,
  ONBOARDING_TASK_AGENDA_TIME_WHEEL_NUDGE_UP_PX,
  ONBOARDING_TASK_AGENDA_TIME_WHEEL_SECTION_BOTTOM_PADDING,
  ONBOARDING_TASK_AGENDA_TIME_WHEEL_SPINNER_TOP_INSET_PX,
  ONBOARDING_TASK_WOTA_AWT_REPLACE_SLOT_MIN_HEIGHT_PX,
  ONBOARDING_TASK_WOTA_TO_TIME_ROW_LIFT_PX,
  getOnboardingQuestionnaireContinueFooterLayoutHeight,
} from '../constants/pagerLayout';
import type { OnboardingSlidesSlideUiConfig, OnboardingSlidesTimeWheelBrandRamp } from '../constants/types';
import {
  OnboardingNextStepChoiceCards,
  OnboardingQuestionnaireTaskTitleRow,
  OnboardingQuestionnaireTimeWheel,
} from '../ui';
import {
  blendOnboardingSlidesColorAtProgress,
  resolveOnboardingSlidesSlideUiButton,
  resolveOnboardingSlidesSlideUiText,
} from '../onboardingSlidesThemeResolvers';
import { OnboardingTaskAgendaSuggestionsSection, type OnboardingTaskAgendaSuggestionBrandChrome } from './OnboardingTaskAgendaSuggestionsSection';

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
  /** per-step chrome rows — same array as headline crossfade; blended for task-agenda body (task row + suggestion rows) */
  pageSlideUi: readonly OnboardingSlidesSlideUiConfig[];
  // passed when parent is on task WOTA or AWT — scroll shell + keyboard lift (`flushFooterTop`) stay aligned on both sub-steps
  taskAgendaLayoutDebug?: boolean;
  /** task branch — native time wheel value for the AWT sub-step (same body layer as WOTA) */
  taskEventTime: Date;
  onTaskEventTimeChange: (next: Date) => void;
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
  pageSlideUi,
  taskAgendaRowLiftStyle,
  taskAgendaSuggestionBrandChrome,
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
  | 'pageSlideUi'
> & {
  slideIndex: number;
  taskAgendaSuggestionBrandChrome: OnboardingTaskAgendaSuggestionBrandChrome;
  /** reanimated translateY — lifts the whole agenda content column (task row + suggestions) with the keyboard; outer body shell stays fixed */
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

  if (
    nextStepChoice === 'task' &&
    (slideIndex === ONBOARDING_QUESTIONNAIRE_TASK_WOTA_STEP_INDEX ||
      slideIndex === ONBOARDING_QUESTIONNAIRE_TASK_TIME_STEP_INDEX)
  ) {
    // real WOTA+AWT UI lives in `TaskWotaTimeCombinedLayer` so the task row can animate across both progress ticks
    return (
      <View
        style={styles.bodySlot}
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      />
    );
  }

  if (slideIndex === ONBOARDING_QUESTIONNAIRE_NEXT_STEP_SLIDE_INDEX) {
    return (
      <View style={styles.bodySlot} accessibilityLabel="Next step choice">
        <OnboardingNextStepChoiceCards value={nextStepChoice} onChange={onNextStepChoiceChange} />
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

/**
 * maps `blendProgress` to 0→1 while animating wota→awt (indices 4→5); stays 1 through the settled awt step — must be a worklet because it runs inside `useAnimatedStyle`.
 */
function wotaToAwtTransitionUnit(progress: number): number {
  'worklet';
  if (progress < ONBOARDING_QUESTIONNAIRE_TASK_TIME_STEP_INDEX) {
    return Math.min(Math.max(progress - ONBOARDING_QUESTIONNAIRE_TASK_WOTA_STEP_INDEX, 0), 1);
  }
  return 1;
}

/**
 * task branch only — one physical layer for WOTA + AWT so the task row stays continuous while `blendProgress` crosses two progress ticks.
 * chips + wheel **crossfade in one replace slot** (opacity + z-index only) — avoids `maxHeight`/`overflow: hidden` clipping the native picker (black box). wheel gets `paddingTop`/`paddingBottom` inside that slot for spacing from chips and above the footer.
 */
type TaskWotaTimeCombinedLayerProps = {
  blendProgressSv: SharedValue<number>;
  pageSlideUi: readonly OnboardingSlidesSlideUiConfig[];
  taskAgendaRowLiftStyle: AnimatedStyle<ViewStyle>;
  taskAgendaSuggestionBrandChrome: OnboardingTaskAgendaSuggestionBrandChrome;
  taskAgendaTitle: string;
  onTaskAgendaTitleChange: (next: string) => void;
  taskAgendaChecked: boolean;
  onTaskAgendaCheckedChange: (next: boolean) => void;
  taskEventTime: Date;
  onTaskEventTimeChange: (next: Date) => void;
  pointerEvents: 'box-none' | 'none';
};

function TaskWotaTimeCombinedLayer({
  blendProgressSv,
  pageSlideUi,
  taskAgendaRowLiftStyle,
  taskAgendaSuggestionBrandChrome,
  taskAgendaTitle,
  onTaskAgendaTitleChange,
  taskAgendaChecked,
  onTaskAgendaCheckedChange,
  taskEventTime,
  onTaskEventTimeChange,
  pointerEvents: pointerEventsMode,
}: TaskWotaTimeCombinedLayerProps) {
  const taskAgendaUi = pageSlideUi[ONBOARDING_QUESTIONNAIRE_TASK_WOTA_STEP_INDEX]?.taskAgendaBody;
  const timeRamp: OnboardingSlidesTimeWheelBrandRamp =
    pageSlideUi[ONBOARDING_QUESTIONNAIRE_TASK_TIME_STEP_INDEX]?.timeWheelBrandRamp ?? 'marple';

  const rootStyle = useAnimatedStyle(() => {
    const p = blendProgressSv.value;
    // off before wota, full during wota→awt, then fades out while the “for how long?” layer fades in
    if (p < ONBOARDING_QUESTIONNAIRE_TASK_WOTA_STEP_INDEX) {
      return { opacity: 0 };
    }
    if (p < ONBOARDING_QUESTIONNAIRE_TASK_TIME_STEP_INDEX) {
      return { opacity: 1 };
    }
    return {
      opacity: interpolate(
        p,
        [
          ONBOARDING_QUESTIONNAIRE_TASK_TIME_STEP_INDEX,
          ONBOARDING_QUESTIONNAIRE_TASK_TIME_STEP_INDEX + 1,
        ],
        [1, 0],
        Extrapolation.CLAMP,
      ),
    };
  });

  // slides the title row upward while `blendProgress` moves 4→5 (same ms as headline crossfade)
  const rowWotaToAwtLiftStyle = useAnimatedStyle(() => {
    const t = wotaToAwtTransitionUnit(blendProgressSv.value);
    return {
      transform: [
        {
          translateY: -interpolate(
            t,
            [0, 1],
            [0, ONBOARDING_TASK_WOTA_TO_TIME_ROW_LIFT_PX],
            Extrapolation.CLAMP,
          ),
        },
      ],
    };
  });

  const suggestionsStyle = useAnimatedStyle(() => {
    const t = wotaToAwtTransitionUnit(blendProgressSv.value);
    return {
      opacity: interpolate(t, [0, 0.38], [1, 0], Extrapolation.CLAMP),
      zIndex: t < 0.45 ? 2 : 0,
    };
  });

  const timeWheelStyle = useAnimatedStyle(() => {
    const t = wotaToAwtTransitionUnit(blendProgressSv.value);
    return {
      opacity: interpolate(t, [0.12, 0.68], [0, 1], Extrapolation.CLAMP),
      zIndex: t < 0.45 ? 0 : 2,
    };
  });

  return (
    <Reanimated.View
      style={[styles.layer, styles.taskWotaTimeCombinedRoot, rootStyle]}
      pointerEvents={pointerEventsMode}
      accessibilityLabel="Task agenda and time"
    >
      <View style={[styles.bodySlot, styles.taskAgendaBodyShell]}>
        <View style={styles.taskAgendaContentContainer}>
          <Reanimated.View style={taskAgendaRowLiftStyle}>
            <Reanimated.View style={rowWotaToAwtLiftStyle}>
              <OnboardingQuestionnaireTaskTitleRow
                title={taskAgendaTitle}
                onTitleChange={onTaskAgendaTitleChange}
                checked={taskAgendaChecked}
                onCheckedChange={onTaskAgendaCheckedChange}
                titleInputColor={taskAgendaSuggestionBrandChrome.taskTitleInputColor}
                pencilIconColor={taskAgendaSuggestionBrandChrome.pencilIconColor}
              />
            </Reanimated.View>
            {/* one measured slot: chips ↔ wheel crossfade (opacity only). never clip with animated maxHeight + overflow — that paints a black layer over the native picker on some devices */}
            <View style={styles.taskWotaAwtReplaceSlot}>
              <Reanimated.View style={[styles.taskWotaAwtReplaceLayer, suggestionsStyle]}>
                <OnboardingTaskAgendaSuggestionsSection
                  sectionTitle={
                    taskAgendaUi?.suggestionsSectionHeading ?? ONBOARDING_TASK_AGENDA_SUGGESTIONS_SECTION_TITLE
                  }
                  suggestionLabels={taskAgendaUi?.suggestionPillLabels ?? ONBOARDING_TASK_AGENDA_SUGGESTION_PILLS}
                  activeTitle={taskAgendaTitle}
                  brandChrome={taskAgendaSuggestionBrandChrome}
                  onPickSuggestion={onTaskAgendaTitleChange}
                />
              </Reanimated.View>
              <Reanimated.View style={[styles.taskWotaAwtReplaceLayer, styles.taskWotaTimeWheelLayer, timeWheelStyle]}>
                <OnboardingQuestionnaireTimeWheel
                  brandRamp={timeRamp}
                  value={taskEventTime}
                  onChange={onTaskEventTimeChange}
                  accessibilityLabel="Task time on your timeline"
                />
              </Reanimated.View>
            </View>
          </Reanimated.View>
        </View>
      </View>
    </Reanimated.View>
  );
}

/**
 * same peak/trough pattern as `crossfadeInputRange` / `crossfadeOutputRange` with `pageWidth === 1` — runs on the ui thread inside `useAnimatedStyle`.
 */
function questionnaireBodyCrossfadeOpacity(progress: number, layerIndex: number, pageCount: number): number {
  'worklet';
  if (pageCount <= 1) {
    return 1;
  }
  if (layerIndex === 0) {
    return interpolate(progress, [0, 1], [1, 0], Extrapolation.CLAMP);
  }
  if (layerIndex === pageCount - 1) {
    return interpolate(progress, [pageCount - 2, pageCount - 1], [0, 1], Extrapolation.CLAMP);
  }
  return interpolate(progress, [layerIndex - 1, layerIndex, layerIndex + 1], [0, 1, 0], Extrapolation.CLAMP);
}

type QuestionnaireBodyCrossfadeLayerProps = Omit<
  React.ComponentProps<typeof QuestionnaireBodySlot>,
  'slideIndex'
> & {
  layerIndex: number;
  pageCount: number;
  /** copy of `blendProgressAnim` updated every frame via `addListener` — shared so fade runs on the same thread as keyboard lift */
  blendProgressSv: SharedValue<number>;
  isTouchTarget: boolean;
};

/** one stacked layer: opacity from reanimated + slot content (may contain nested `Reanimated.View`) */
function QuestionnaireBodyCrossfadeLayer({
  layerIndex,
  pageCount,
  blendProgressSv,
  isTouchTarget,
  ...slotProps
}: QuestionnaireBodyCrossfadeLayerProps) {
  const fadeStyle = useAnimatedStyle(
    () => ({
      opacity: questionnaireBodyCrossfadeOpacity(blendProgressSv.value, layerIndex, pageCount),
    }),
    [layerIndex, pageCount],
  );
  return (
    <Reanimated.View style={[styles.layer, fadeStyle]} pointerEvents={isTouchTarget ? 'auto' : 'none'}>
      <QuestionnaireBodySlot slideIndex={layerIndex} {...slotProps} />
    </Reanimated.View>
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
  pageSlideUi,
  taskAgendaLayoutDebug = false,
  taskEventTime,
  onTaskEventTimeChange,
}: OnboardingSlideSampleContentProps) {
  const count = pageCount;
  const last = Math.max(count - 1, 0);
  // nearest settled slide — only that layer stays interactive so faded wheels don’t steal taps
  const touchIndex = Math.min(last, Math.max(0, Math.round(blendProgress)));

  // wota+awt share one overlay — disable pointer hit-testing on the empty placeholder layers 4/5 while that strip is active
  const taskWotaTimeBandActive =
    nextStepChoice === 'task' &&
    blendProgress >= ONBOARDING_QUESTIONNAIRE_TASK_WOTA_STEP_INDEX &&
    blendProgress < ONBOARDING_QUESTIONNAIRE_TASK_TIME_STEP_INDEX + 1;

  const layerIsTouchTarget = (layerIndex: number) =>
    touchIndex === layerIndex &&
    !(
      taskWotaTimeBandActive &&
      (layerIndex === ONBOARDING_QUESTIONNAIRE_TASK_WOTA_STEP_INDEX ||
        layerIndex === ONBOARDING_QUESTIONNAIRE_TASK_TIME_STEP_INDEX)
    );

  const themeColors = useThemeColors();
  // lerp task-agenda chrome + slide continue fill (`plant:500` on task-branch steps) for selected suggestion pills
  const taskAgendaSuggestionBrandChrome = useMemo((): OnboardingTaskAgendaSuggestionBrandChrome => {
    const taskTitlePaints = pageSlideUi.map((row) =>
      resolveOnboardingSlidesSlideUiText(themeColors, row.taskAgendaBody?.taskTitleInput ?? row.titleColor),
    );
    const titlePaints = pageSlideUi.map((row) =>
      resolveOnboardingSlidesSlideUiText(themeColors, row.taskAgendaBody?.suggestionsSectionTitle ?? row.titleColor),
    );
    const captionPaints = pageSlideUi.map((row) =>
      resolveOnboardingSlidesSlideUiText(themeColors, row.taskAgendaBody?.pencilIcon ?? row.captionColor),
    );
    const continueFillPaints = pageSlideUi.map((row) =>
      resolveOnboardingSlidesSlideUiButton(themeColors, row.continueButtonBackground),
    );
    return {
      taskTitleInputColor: blendOnboardingSlidesColorAtProgress(blendProgress, taskTitlePaints),
      sectionTitleColor: blendOnboardingSlidesColorAtProgress(blendProgress, titlePaints),
      pencilIconColor: blendOnboardingSlidesColorAtProgress(blendProgress, captionPaints),
      selectedSlideBrandColor: blendOnboardingSlidesColorAtProgress(blendProgress, continueFillPaints),
    };
  }, [blendProgress, pageSlideUi, themeColors]);

  const insets = useSafeAreaInsets();
  // matches the continue footer layout height — keyboard overlap into the scroll area is keyboard minus this, not full keyboard (full key height over-lifted the row)
  const footerLayoutReservePx = useSharedValue(0);
  useEffect(() => {
    footerLayoutReservePx.value = getOnboardingQuestionnaireContinueFooterLayoutHeight(insets.bottom, {
      flushFooterTop: !!taskAgendaLayoutDebug,
    });
  }, [footerLayoutReservePx, insets.bottom, taskAgendaLayoutDebug]);

  // the flow still drives step index with rn `Animated.Value` (`blendProgressAnim`). task agenda uses reanimated inside the same layer, so we copy that value into a `sharedValue` every frame — both animations then run on reanimated’s side and the crossfade actually applies over the keyboard lift.
  const blendProgressSv = useSharedValue(blendProgress);
  useEffect(() => {
    blendProgressSv.value = blendProgress;
  }, [blendProgress, blendProgressSv]);
  useEffect(() => {
    const id = blendProgressAnim.addListener(({ value }) => {
      blendProgressSv.value = value;
    });
    return () => {
      blendProgressAnim.removeListener(id);
    };
  }, [blendProgressAnim, blendProgressSv]);

  // ios keyboard height — translateY lifts the stacked task row + suggestions together; outer shell stays fixed
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
          pageSlideUi={pageSlideUi}
          taskAgendaRowLiftStyle={taskAgendaRowLiftStyle}
          taskAgendaSuggestionBrandChrome={taskAgendaSuggestionBrandChrome}
        />
      </View>

      <View style={styles.crossfadeLayers} pointerEvents="box-none">
        {Array.from({ length: count }, (_, i) => (
          <QuestionnaireBodyCrossfadeLayer
            key={i}
            layerIndex={i}
            pageCount={count}
            blendProgressSv={blendProgressSv}
            isTouchTarget={layerIsTouchTarget(i)}
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
            pageSlideUi={pageSlideUi}
            taskAgendaRowLiftStyle={taskAgendaRowLiftStyle}
            taskAgendaSuggestionBrandChrome={taskAgendaSuggestionBrandChrome}
          />
        ))}
      </View>

      {nextStepChoice === 'task' ? (
        <TaskWotaTimeCombinedLayer
          blendProgressSv={blendProgressSv}
          pageSlideUi={pageSlideUi}
          taskAgendaRowLiftStyle={taskAgendaRowLiftStyle}
          taskAgendaSuggestionBrandChrome={taskAgendaSuggestionBrandChrome}
          taskAgendaTitle={taskAgendaTitle}
          onTaskAgendaTitleChange={onTaskAgendaTitleChange}
          taskAgendaChecked={taskAgendaChecked}
          onTaskAgendaCheckedChange={onTaskAgendaCheckedChange}
          taskEventTime={taskEventTime}
          onTaskEventTimeChange={onTaskEventTimeChange}
          pointerEvents={taskWotaTimeBandActive ? 'box-none' : 'none'}
        />
      ) : null}
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
  /** sits above the per-index body crossfade so wota+awt share one interactive surface */
  taskWotaTimeCombinedRoot: {
    zIndex: 2,
  },
  /** shared box for chip + wheel layers — `minHeight` reserves space without animating overflow (avoids black clip rects over native wheel) */
  taskWotaAwtReplaceSlot: {
    position: 'relative',
    width: '100%',
    marginTop: ONBOARDING_TASK_AGENDA_TASK_TO_SUGGESTIONS_GAP,
    minHeight: ONBOARDING_TASK_WOTA_AWT_REPLACE_SLOT_MIN_HEIGHT_PX,
    backgroundColor: 'transparent',
  },
  taskWotaAwtReplaceLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    backgroundColor: 'transparent',
  },
  /** wheel layer: tiny top pad + negative translateY pulls spinner higher without touching replace-slot minHeight */
  taskWotaTimeWheelLayer: {
    paddingTop: ONBOARDING_TASK_AGENDA_TIME_WHEEL_SPINNER_TOP_INSET_PX,
    paddingBottom: ONBOARDING_TASK_AGENDA_TIME_WHEEL_SECTION_BOTTOM_PADDING,
    transform: [{ translateY: -ONBOARDING_TASK_AGENDA_TIME_WHEEL_NUDGE_UP_PX }],
  },
});
