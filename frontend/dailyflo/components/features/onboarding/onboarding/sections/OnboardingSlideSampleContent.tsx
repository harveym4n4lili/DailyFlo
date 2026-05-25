/**
 * questionnaire body — wake/sleep show time wheels; last slide shows habit vs task cards; intro slide reserves space.
 * mirrors headline crossfade: each step’s body stacks in absolute layers; opacity crossfade matches headline timing.
 * layers use reanimated opacity (not rn `Animated.View`) so the task-agenda keyboard lift (`Reanimated.View` inside) still fades with its parent — mixing drivers often drops opacity on native views.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions, type ViewStyle } from 'react-native';
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

import { QuickAddLabelOnlyPill } from '@/components/features/tasks/quickAdd';
import { getTaskCardHeight } from '@/components/features/timeline/timelineUtils';
import { Paddings } from '@/constants/Paddings';
import { useThemeColors } from '@/hooks/useColorPalette';
import {
  ONBOARDING_QUESTIONNAIRE_CORE_PAGE_COUNT,
  ONBOARDING_QUESTIONNAIRE_HABIT_FREQUENCY_STEP_INDEX,
  ONBOARDING_QUESTIONNAIRE_HABIT_GOAL_STEP_INDEX,
  ONBOARDING_QUESTIONNAIRE_NEXT_STEP_SLIDE_INDEX,
  ONBOARDING_QUESTIONNAIRE_SLEEP_STEP_INDEX,
  ONBOARDING_QUESTIONNAIRE_TASK_DURATION_STEP_INDEX,
  ONBOARDING_QUESTIONNAIRE_TASK_FINISH_STEP_INDEX,
  ONBOARDING_QUESTIONNAIRE_TASK_TIME_STEP_INDEX,
  ONBOARDING_QUESTIONNAIRE_TASK_WOTA_STEP_INDEX,
  ONBOARDING_QUESTIONNAIRE_WAKE_STEP_INDEX,
  type OnboardingQuestionnaireNextStepChoice,
} from '../constants';
import { getOnboardingPlannerTimelineMinScrollBodyHeightPx } from '../ui/OnboardingPlannerTimeline';
import { ONBOARDING_HABIT_FREQUENCY_OPTIONS } from '../constants/onboardingQuestionnaireAnswers';
import {
  ONBOARDING_SLIDES_HABIT_FREQUENCY_OPTION_TEXT_STYLE,
  ONBOARDING_SLIDES_TASK_AND_HABIT_FIELD_TITLE_TEXT_STYLE,
} from '../constants/typography';
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
  ONBOARDING_TASK_AGENDA_TIME_WHEEL_SPINNER_BAND_MIN_HEIGHT_PX,
  ONBOARDING_TASK_AGENDA_TIME_WHEEL_SPINNER_TOP_INSET_PX,
  ONBOARDING_DURATION_SLIDER_TO_CUSTOM_PILL_GAP_PX,
  ONBOARDING_TASK_WOTA_AWT_REPLACE_SLOT_MIN_HEIGHT_PX,
  ONBOARDING_TASK_WOTA_TO_TIME_ROW_LIFT_PX,
  ONBOARDING_TASK_TITLE_SURFACE_RADIUS,
  getOnboardingQuestionnaireContinueFooterLayoutHeight,
} from '../constants/pagerLayout';
import type { OnboardingSlidesSlideUiConfig, OnboardingSlidesTimeWheelBrandRamp } from '../constants/types';
import {
  OnboardingNextStepChoiceCards,
  OnboardingQuestionnaireDurationGlassSlider,
  OnboardingQuestionnaireFinishTimelineBody,
  OnboardingQuestionnaireTaskTitleRow,
  OnboardingQuestionnaireTimeWheel,
} from '../ui';
import {
  blendOnboardingSlidesColorAtProgress,
  resolveOnboardingSlidesSlideUiButton,
  resolveOnboardingSlidesSlideUiText,
} from '../onboardingSlidesThemeResolvers';
import { OnboardingTaskAgendaSuggestionsSection, type OnboardingTaskAgendaSuggestionBrandChrome } from './OnboardingTaskAgendaSuggestionsSection';

/** habit branch — single-line goal; state lives in `OnboardingQuestionnaireFlow` until finish writes AsyncStorage snapshot */
function OnboardingHabitGoalField({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  const themeColors = useThemeColors();
  const primaryTint = themeColors.primaryButton.fill();
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder="e.g. Morning stretch"
      placeholderTextColor={themeColors.text.tertiary()}
      selectionColor={primaryTint}
      cursorColor={primaryTint}
      underlineColorAndroid="transparent"
      returnKeyType="done"
      accessibilityLabel="Habit goal"
      style={[
        ONBOARDING_SLIDES_TASK_AND_HABIT_FIELD_TITLE_TEXT_STYLE,
        {
          width: '100%',
          paddingVertical: Paddings.card,
          paddingHorizontal: Paddings.card,
          backgroundColor: themeColors.background.primarySecondaryBlend(),
          borderRadius: ONBOARDING_TASK_TITLE_SURFACE_RADIUS,
          color: themeColors.text.primary(),
          ...(Platform.OS === 'android' ? { textAlignVertical: 'center' as const, includeFontPadding: false } : {}),
        },
      ]}
    />
  );
}

/** habit branch — frequency picks a stable `id` string stored in the questionnaire JSON */
function OnboardingHabitFrequencyField({
  valueId,
  onChange,
}: {
  valueId: string;
  onChange: (nextId: string) => void;
}) {
  const themeColors = useThemeColors();
  return (
    <View style={{ width: '100%', gap: Paddings.touchTargetSmall }}>
      {ONBOARDING_HABIT_FREQUENCY_OPTIONS.map((opt) => {
        const selected = opt.id === valueId;
        return (
          <Pressable
            key={opt.id}
            onPress={() => onChange(opt.id)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={opt.label}
            style={{
              paddingVertical: Paddings.touchTargetSmall,
              paddingHorizontal: Paddings.screen,
              borderRadius: Paddings.formDataPillRadius,
              backgroundColor: selected
                ? themeColors.background.secondary()
                : themeColors.background.primarySecondaryBlend(),
            }}
          >
            <Text style={[ONBOARDING_SLIDES_HABIT_FREQUENCY_OPTION_TEXT_STYLE, { color: themeColors.text.primary() }]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

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
  // passed when parent is on the shared task-agenda strip (WOTA, AWT, duration) — scroll shell + keyboard lift (`flushFooterTop`) stay aligned
  taskAgendaLayoutDebug?: boolean;
  /** task branch — native time wheel value for the AWT sub-step (same body layer as WOTA) */
  taskEventTime: Date;
  onTaskEventTimeChange: (next: Date) => void;
  /** task branch — duration minutes for “for how long?” (same strip as WOTA/AWT; wheel crossfades into glass slider) */
  taskDurationMinutes: number;
  onTaskDurationMinutesChange: (next: number) => void;
  /** habit branch — mirrors task title storage until JSON is written on finish */
  habitGoalTitle: string;
  onHabitGoalTitleChange: (next: string) => void;
  habitFrequencyId: string;
  onHabitFrequencyIdChange: (next: string) => void;
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
  taskEventTime,
  taskDurationMinutes,
  habitGoalTitle,
  onHabitGoalTitleChange,
  habitFrequencyId,
  onHabitFrequencyIdChange,
  onFinishTimelineScrollBodyHeightChange,
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
  | 'taskEventTime'
  | 'taskDurationMinutes'
  | 'taskAgendaLayoutDebug'
  | 'pageSlideUi'
  | 'habitGoalTitle'
  | 'onHabitGoalTitleChange'
  | 'habitFrequencyId'
  | 'onHabitFrequencyIdChange'
> & {
  slideIndex: number;
  taskAgendaSuggestionBrandChrome: OnboardingTaskAgendaSuggestionBrandChrome;
  /** reanimated translateY — lifts the whole agenda content column (task row + suggestions) with the keyboard; outer body shell stays fixed */
  taskAgendaRowLiftStyle: AnimatedStyle<ViewStyle>;
  /** finish slide — timeline reports real scroll-body height after `onLayout` so the crossfade stack’s probe isn’t short vs the task row */
  onFinishTimelineScrollBodyHeightChange?: (heightPx: number) => void;
}) {
  const themeColors = useThemeColors();
  const nextStepCardTitleColor = useMemo(() => {
    const row = pageSlideUi[ONBOARDING_QUESTIONNAIRE_NEXT_STEP_SLIDE_INDEX];
    const token = row?.nextStepChoiceCardTitleColor ?? { scope: 'text', token: 'plant:700' };
    return resolveOnboardingSlidesSlideUiText(themeColors, token);
  }, [pageSlideUi, themeColors]);

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
      slideIndex === ONBOARDING_QUESTIONNAIRE_TASK_TIME_STEP_INDEX ||
      slideIndex === ONBOARDING_QUESTIONNAIRE_TASK_DURATION_STEP_INDEX)
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
        <OnboardingNextStepChoiceCards
          cardTitleColor={nextStepCardTitleColor}
          value={nextStepChoice}
          onChange={onNextStepChoiceChange}
        />
      </View>
    );
  }

  if (
    nextStepChoice === 'habit' &&
    slideIndex === ONBOARDING_QUESTIONNAIRE_HABIT_GOAL_STEP_INDEX
  ) {
    return (
      <View style={styles.bodySlot} accessibilityLabel="Habit goal question">
        <OnboardingHabitGoalField value={habitGoalTitle} onChange={onHabitGoalTitleChange} />
      </View>
    );
  }

  if (
    nextStepChoice === 'habit' &&
    slideIndex === ONBOARDING_QUESTIONNAIRE_HABIT_FREQUENCY_STEP_INDEX
  ) {
    return (
      <View style={styles.bodySlot} accessibilityLabel="Habit frequency question">
        <OnboardingHabitFrequencyField valueId={habitFrequencyId} onChange={onHabitFrequencyIdChange} />
      </View>
    );
  }

  if (nextStepChoice === 'task' && slideIndex === ONBOARDING_QUESTIONNAIRE_TASK_FINISH_STEP_INDEX) {
    return (
      <View style={styles.bodySlot} accessibilityLabel="Task timeline preview">
        <OnboardingQuestionnaireFinishTimelineBody
          wakeTime={wakeTime}
          sleepTime={sleepTime}
          taskEventTime={taskEventTime}
          taskDurationMinutes={taskDurationMinutes}
          taskAgendaTitle={taskAgendaTitle}
          onTaskAgendaTitleChange={onTaskAgendaTitleChange}
          taskAgendaChecked={taskAgendaChecked}
          onTaskAgendaCheckedChange={onTaskAgendaCheckedChange}
          titleInputColor={taskAgendaSuggestionBrandChrome.taskTitleInputColor}
          pencilIconColor={taskAgendaSuggestionBrandChrome.pencilIconColor}
          onScrollBodyHeightChange={onFinishTimelineScrollBodyHeightChange}
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
 * after AWT settles (`TASK_TIME_STEP_INDEX`), `blendProgress` runs time→duration — 0 on the time step, 1 on the duration step.
 * used only to crossfade the native wheel into the glass duration slider (same replace slot as chips↔wheel).
 */
function awtToDurationTransitionUnit(progress: number): number {
  'worklet';
  if (progress < ONBOARDING_QUESTIONNAIRE_TASK_TIME_STEP_INDEX) {
    return 0;
  }
  return Math.min(Math.max(progress - ONBOARDING_QUESTIONNAIRE_TASK_TIME_STEP_INDEX, 0), 1);
}

/**
 * task branch only — one physical layer for WOTA + AWT + duration so the task row + replace slot stay continuous across three progress ticks.
 * chips + wheel + duration slider **crossfade in one replace slot** (opacity + z-index only) — avoids `maxHeight`/`overflow: hidden` clipping the native picker (black box).
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
  taskDurationMinutes: number;
  onTaskDurationMinutesChange: (next: number) => void;
  durationTintColor: string;
  durationLabelColor: string;
  pointerEvents: 'box-none' | 'none';
  /** AWT + duration — title field won’t focus / open keyboard; checkbox + rest of row unchanged */
  suppressTaskAgendaTitleKeyboard: boolean;
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
  taskDurationMinutes,
  onTaskDurationMinutesChange,
  durationTintColor,
  durationLabelColor,
  pointerEvents: pointerEventsMode,
  suppressTaskAgendaTitleKeyboard,
}: TaskWotaTimeCombinedLayerProps) {
  const themeColors = useThemeColors();
  // same treatment as preset numerals on the duration rail (`text.secondary` + 0.85 opacity)
  const durationRailLabelColor = themeColors.withOpacity(themeColors.text.secondary(), 0.85);

  const taskAgendaUi = pageSlideUi[ONBOARDING_QUESTIONNAIRE_TASK_WOTA_STEP_INDEX]?.taskAgendaBody;
  const timeRamp: OnboardingSlidesTimeWheelBrandRamp =
    pageSlideUi[ONBOARDING_QUESTIONNAIRE_TASK_TIME_STEP_INDEX]?.timeWheelBrandRamp ?? 'marple';

  const rootStyle = useAnimatedStyle(() => {
    const p = blendProgressSv.value;
    // off before wota; stays visible through WOTA + AWT + duration so one strip carries task row + replace slot; fades toward the “in flow” slide only after duration
    if (p < ONBOARDING_QUESTIONNAIRE_TASK_WOTA_STEP_INDEX) {
      return { opacity: 0 };
    }
    if (p < ONBOARDING_QUESTIONNAIRE_TASK_DURATION_STEP_INDEX + 1) {
      return { opacity: 1 };
    }
    return {
      opacity: interpolate(
        p,
        [
          ONBOARDING_QUESTIONNAIRE_TASK_DURATION_STEP_INDEX,
          ONBOARDING_QUESTIONNAIRE_TASK_DURATION_STEP_INDEX + 1,
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
    const p = blendProgressSv.value;
    const wotaT = wotaToAwtTransitionUnit(p);
    const wheelBase = interpolate(wotaT, [0.12, 0.68], [0, 1], Extrapolation.CLAMP);
    const durT = awtToDurationTransitionUnit(p);
    // overlap the fades so the wheel eases out while the glass slider eases in (same slot)
    const durFadeOut = interpolate(durT, [0, 0.5], [1, 0], Extrapolation.CLAMP);
    return {
      opacity: wheelBase * durFadeOut,
      zIndex: durT < 0.45 ? 2 : 0,
    };
  });

  const durationSliderStyle = useAnimatedStyle(() => {
    const durT = awtToDurationTransitionUnit(blendProgressSv.value);
    return {
      opacity: interpolate(durT, [0.25, 0.85], [0, 1], Extrapolation.CLAMP),
      zIndex: durT > 0.45 ? 2 : 0,
    };
  });

  return (
    <Reanimated.View
      style={[styles.layer, styles.taskWotaTimeCombinedRoot, rootStyle]}
      pointerEvents={pointerEventsMode}
      accessibilityLabel="Task agenda, time, and duration"
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
                suppressTitleKeyboard={suppressTaskAgendaTitleKeyboard}
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
              <Reanimated.View style={[styles.taskWotaAwtReplaceLayer, styles.taskWotaDurationLayer, durationSliderStyle]}>
                <View style={styles.taskWotaDurationSliderBlock}>
                  <OnboardingQuestionnaireDurationGlassSlider
                    valueMinutes={taskDurationMinutes}
                    onChange={onTaskDurationMinutesChange}
                    tintColor={durationTintColor}
                    labelColor={durationLabelColor}
                    accessibilityLabel="How long to spend on this task"
                  />
                  {/* custom duration — solid blend surface like task row; hook `onPress` when the flow adds a picker or sheet */}
                  <View style={styles.taskWotaDurationCustomPillRow}>
                    <QuickAddLabelOnlyPill
                      label="Custom duration?"
                      variant="primarySecondaryBlend"
                      blendLabelColor={durationRailLabelColor}
                      onPress={() => undefined}
                    />
                  </View>
                </View>
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
  taskDurationMinutes,
  onTaskDurationMinutesChange,
  habitGoalTitle,
  onHabitGoalTitleChange,
  habitFrequencyId,
  onHabitFrequencyIdChange,
}: OnboardingSlideSampleContentProps) {
  const { height: windowHeight } = useWindowDimensions();
  const count = pageCount;
  const last = Math.max(count - 1, 0);
  // nearest settled slide — only that layer stays interactive so faded wheels don’t steal taps
  const touchIndex = Math.min(last, Math.max(0, Math.round(blendProgress)));

  // wota + awt + duration share one overlay — disable hit-testing on the empty placeholder layers while that strip is active
  const taskWotaTimeBandActive =
    nextStepChoice === 'task' &&
    blendProgress >= ONBOARDING_QUESTIONNAIRE_TASK_WOTA_STEP_INDEX &&
    blendProgress < ONBOARDING_QUESTIONNAIRE_TASK_DURATION_STEP_INDEX + 1;

  // title field: no keyboard on AWT + duration so time wheel / duration controls stay primary (checkbox still toggles)
  const suppressTaskAgendaTitleKeyboard =
    nextStepChoice === 'task' &&
    blendProgress >= ONBOARDING_QUESTIONNAIRE_TASK_TIME_STEP_INDEX &&
    blendProgress < ONBOARDING_QUESTIONNAIRE_TASK_DURATION_STEP_INDEX + 1;

  // invisible wake slot sets stack height, but crossfade layers are `absoluteFill` — so they inherit that height only. past the duration step we bump the probe. `getTaskCardHeight` alone is often shorter than the real title row, so we also take `onScrollBodyHeightChange` from `OnboardingPlannerTimeline` (see `finishTimelineMeasuredScrollBodyHeight`).
  const [finishTimelineMeasuredScrollBodyHeight, setFinishTimelineMeasuredScrollBodyHeight] = useState(0);

  const reportFinishTimelineScrollBodyHeight = useCallback((px: number) => {
    setFinishTimelineMeasuredScrollBodyHeight((prev) => (prev === px ? prev : px));
  }, []);

  useEffect(() => {
    if (nextStepChoice !== 'task' || blendProgress <= ONBOARDING_QUESTIONNAIRE_TASK_DURATION_STEP_INDEX) {
      setFinishTimelineMeasuredScrollBodyHeight(0);
    }
  }, [nextStepChoice, blendProgress]);

  const finishTimelineProbeEstimate = useMemo(() => {
    if (nextStepChoice !== 'task' || blendProgress <= ONBOARDING_QUESTIONNAIRE_TASK_DURATION_STEP_INDEX) {
      return 0;
    }
    return getOnboardingPlannerTimelineMinScrollBodyHeightPx(
      wakeTime,
      sleepTime,
      taskEventTime,
      taskDurationMinutes,
      getTaskCardHeight(taskDurationMinutes),
    );
  }, [
    nextStepChoice,
    blendProgress,
    wakeTime,
    sleepTime,
    taskEventTime,
    taskDurationMinutes,
  ]);

  const finishTimelineProbeMinHeight =
    finishTimelineProbeEstimate > 0
      ? Math.max(finishTimelineProbeEstimate, finishTimelineMeasuredScrollBodyHeight)
      : 0;

  const layerIsTouchTarget = (layerIndex: number) =>
    touchIndex === layerIndex &&
    !(
      taskWotaTimeBandActive &&
      (layerIndex === ONBOARDING_QUESTIONNAIRE_TASK_WOTA_STEP_INDEX ||
        layerIndex === ONBOARDING_QUESTIONNAIRE_TASK_TIME_STEP_INDEX ||
        layerIndex === ONBOARDING_QUESTIONNAIRE_TASK_DURATION_STEP_INDEX)
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
    const continueIconPaints = pageSlideUi.map((row) =>
      resolveOnboardingSlidesSlideUiButton(themeColors, row.continueButtonIcon),
    );
    return {
      taskTitleInputColor: blendOnboardingSlidesColorAtProgress(blendProgress, taskTitlePaints),
      sectionTitleColor: blendOnboardingSlidesColorAtProgress(blendProgress, titlePaints),
      pencilIconColor: blendOnboardingSlidesColorAtProgress(blendProgress, captionPaints),
      selectedSlideBrandColor: blendOnboardingSlidesColorAtProgress(blendProgress, continueFillPaints),
      selectedSlideBrandIconColor: blendOnboardingSlidesColorAtProgress(blendProgress, continueIconPaints),
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
    <View
      style={[
        styles.stack,
        nextStepChoice === 'task' && { minHeight: Math.round(Math.max(380, windowHeight * 0.42)) },
      ]}
    >
      {/* wake step holds the tallest body (time wheel) — reserves flex height like headline probe */}
      <View
        style={[
          styles.heightProbe,
          finishTimelineProbeMinHeight > 0 ? { minHeight: finishTimelineProbeMinHeight } : null,
        ]}
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
          taskEventTime={taskEventTime}
          taskDurationMinutes={taskDurationMinutes}
          habitGoalTitle={habitGoalTitle}
          onHabitGoalTitleChange={onHabitGoalTitleChange}
          habitFrequencyId={habitFrequencyId}
          onHabitFrequencyIdChange={onHabitFrequencyIdChange}
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
            taskEventTime={taskEventTime}
            taskDurationMinutes={taskDurationMinutes}
            habitGoalTitle={habitGoalTitle}
            onHabitGoalTitleChange={onHabitGoalTitleChange}
            habitFrequencyId={habitFrequencyId}
            onHabitFrequencyIdChange={onHabitFrequencyIdChange}
            onFinishTimelineScrollBodyHeightChange={reportFinishTimelineScrollBodyHeight}
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
          taskDurationMinutes={taskDurationMinutes}
          onTaskDurationMinutesChange={onTaskDurationMinutesChange}
          durationTintColor={taskAgendaSuggestionBrandChrome.selectedSlideBrandColor}
          durationLabelColor={taskAgendaSuggestionBrandChrome.selectedSlideBrandIconColor}
          suppressTaskAgendaTitleKeyboard={suppressTaskAgendaTitleKeyboard}
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
  /**
   * duration row — same pad + `translateY` as the wheel layer, same spinner-band min height (`pagerLayout` matches `OnboardingQuestionnaireTimeWheel` clip).
   * `justifyContent: center` vertically centers the slider + custom pill stack with the native spinner midline.
   */
  taskWotaDurationLayer: {
    paddingTop: ONBOARDING_TASK_AGENDA_TIME_WHEEL_SPINNER_TOP_INSET_PX,
    paddingBottom: ONBOARDING_TASK_AGENDA_TIME_WHEEL_SECTION_BOTTOM_PADDING,
    transform: [{ translateY: -ONBOARDING_TASK_AGENDA_TIME_WHEEL_NUDGE_UP_PX }],
    minHeight: ONBOARDING_TASK_AGENDA_TIME_WHEEL_SPINNER_BAND_MIN_HEIGHT_PX,
    justifyContent: 'center',
  },
  /** left-align stack; pill uses `marginStart` to match `OnboardingQuestionnaireDurationGlassSlider` inner horizontal pad so rail + pill leading edges line up */
  taskWotaDurationSliderBlock: {
    width: '100%',
    alignItems: 'flex-start',
    gap: ONBOARDING_DURATION_SLIDER_TO_CUSTOM_PILL_GAP_PX,
  },
  /** same inset as duration slider `innerPad` (`Paddings.touchTargetSmall`) — aligns pill with the track, not the full-bleed slider root */
  taskWotaDurationCustomPillRow: {
    alignSelf: 'flex-start',
    marginStart: Paddings.touchTargetSmall,
  },
});
