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
  getOnboardingQuestionnaireContinueFooterLayoutHeight,
} from '../constants/pagerLayout';
import type { OnboardingSlidesSlideUiConfig } from '../constants/types';
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
    const taskAgendaUi = pageSlideUi[slideIndex]?.taskAgendaBody;
    return (
      // task agenda: outer shell (flex) + content wrapper = task row + suggestions (both keyboard-lifted together)
      <View style={[styles.bodySlot, styles.taskAgendaBodyShell]} accessibilityLabel="Task agenda body">
        <View style={styles.taskAgendaContentContainer} accessibilityLabel="Task agenda content">
          {/* one lift so the suggestions block travels with the task row while the keyboard is open */}
          <Reanimated.View style={taskAgendaRowLiftStyle}>
            <OnboardingQuestionnaireTaskTitleRow
              title={taskAgendaTitle}
              onTitleChange={onTaskAgendaTitleChange}
              checked={taskAgendaChecked}
              onCheckedChange={onTaskAgendaCheckedChange}
              titleInputColor={taskAgendaSuggestionBrandChrome.taskTitleInputColor}
              pencilIconColor={taskAgendaSuggestionBrandChrome.pencilIconColor}
            />
            <View style={styles.taskAgendaBelowTitle}>
                  {/* tapping a chip copies its label into the title field — sparkles mark suggestions vs the real row checkbox */}
              <OnboardingTaskAgendaSuggestionsSection
                sectionTitle={
                  taskAgendaUi?.suggestionsSectionHeading ?? ONBOARDING_TASK_AGENDA_SUGGESTIONS_SECTION_TITLE
                }
                suggestionLabels={
                  taskAgendaUi?.suggestionPillLabels ?? ONBOARDING_TASK_AGENDA_SUGGESTION_PILLS
                }
                activeTitle={taskAgendaTitle}
                brandChrome={taskAgendaSuggestionBrandChrome}
                onPickSuggestion={onTaskAgendaTitleChange}
              />
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
}: OnboardingSlideSampleContentProps) {
  const count = pageCount;
  const last = Math.max(count - 1, 0);
  // nearest settled slide — only that layer stays interactive so faded wheels don’t steal taps
  const touchIndex = Math.min(last, Math.max(0, Math.round(blendProgress)));

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
            isTouchTarget={touchIndex === i}
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
    marginTop: ONBOARDING_TASK_AGENDA_TASK_TO_SUGGESTIONS_GAP,
  },
});
