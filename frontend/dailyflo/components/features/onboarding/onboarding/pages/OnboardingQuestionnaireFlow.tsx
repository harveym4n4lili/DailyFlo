/**
 * post-intro questionnaire body — one step at a time (no horizontal swipe).
 * step changes animate `blendProgress` 0…n−1 like intro scroll so header bar + body colors rgb-lerp (`blendIntroContinueButtonColors`, etc.).
 * after “pick next step”, extra slides depend on habit vs task (`getOnboardingQuestionnaireSlideModel`).
 */

import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OnboardingContinueButton } from '@/components/ui/Button';
import { blendIntroContinueButtonColors } from '../../auth/scrollTransition';
import { Paddings } from '@/constants/Paddings';
import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { useThemeColors } from '@/hooks/useColorPalette';

import { useCompleteOnboardingAndExit } from '../../auth/hooks/useCompleteOnboardingAndExit';
import {
  ONBOARDING_QUESTIONNAIRE_CORE_PAGE_COUNT,
  ONBOARDING_SLIDES_CONTINUE_BUTTON_TEXT_STYLE,
  ONBOARDING_SLIDES_CONTINUE_LABEL,
  ONBOARDING_SLIDES_FINISH_SETUP_LABEL,
  ONBOARDING_SLIDES_SKIP_TEXT_STYLE,
  ONBOARDING_SLIDES_SKIP_TEXT_COLOR,
  ONBOARDING_SLIDES_SKIP_BUTTON_ACCESSIBILITY_LABEL,
  ONBOARDING_SLIDES_SKIP_BUTTON_HIT_SLOP,
  ONBOARDING_SLIDES_SKIP_BUTTON_LABEL,
  type OnboardingQuestionnaireNextStepChoice,
  getOnboardingQuestionnaireSlideModel,
} from '../constants';
import { useOnboardingSlidesHeader, useQuestionnaireBlendProgress } from '../hooks';
import {
  blendOnboardingSlidesColorAtProgress,
  resolveOnboardingSlidesBackgroundColor,
  resolveOnboardingSlidesContinueButtonPaint,
  resolveOnboardingSlidesProgressTrackColor,
  resolveOnboardingSlidesTextColor,
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

  const slideModel = useMemo(() => getOnboardingQuestionnaireSlideModel(nextStepChoice), [nextStepChoice]);

  const lastStep = Math.max(0, slideModel.pageCount - 1);

  const handleNextStepChoiceChange = useCallback((choice: OnboardingQuestionnaireNextStepChoice) => {
    setNextStepChoice(choice);
    setPageIndex((i) => clampPageIndex(i, choice));
  }, []);

  const { blendProgress, blendProgressAnim } = useQuestionnaireBlendProgress(pageIndex);

  const skipTextStyle = useMemo(
    () => [
      ONBOARDING_SLIDES_SKIP_TEXT_STYLE,
      { color: resolveOnboardingSlidesTextColor(themeColors, ONBOARDING_SLIDES_SKIP_TEXT_COLOR) },
    ],
    [themeColors],
  );

  const trackColorsByPage = useMemo(
    () =>
      slideModel.pageSlideUi.map((row) =>
        resolveOnboardingSlidesProgressTrackColor(themeColors, row.progressBarTrack),
      ),
    [themeColors, slideModel.pageSlideUi],
  );
  const progressFillColorsByPage = useMemo(
    () =>
      slideModel.pageSlideUi.map((row) =>
        resolveOnboardingSlidesContinueButtonPaint(themeColors, row.progressBarFill),
      ),
    [themeColors, slideModel.pageSlideUi],
  );
  const backgroundColorsByPage = useMemo(
    () =>
      slideModel.pageSlideUi.map((row) =>
        resolveOnboardingSlidesBackgroundColor(themeColors, row.background),
      ),
    [themeColors, slideModel.pageSlideUi],
  );

  const continuePaintByPage = useMemo(
    () => ({
      fills: slideModel.pageSlideUi.map((row) =>
        resolveOnboardingSlidesContinueButtonPaint(themeColors, row.continueButtonBackground),
      ),
      icons: slideModel.pageSlideUi.map((row) =>
        resolveOnboardingSlidesContinueButtonPaint(themeColors, row.continueButtonIcon),
      ),
    }),
    [themeColors, slideModel.pageSlideUi],
  );

  const backIconColorsByPage = useMemo(
    () =>
      slideModel.pageSlideUi.map((row) =>
        resolveOnboardingSlidesTextColor(themeColors, row.headerBackIconColor ?? 'secondary'),
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
    if (pageIndex > 0) {
      setPageIndex((i) => i - 1);
      return;
    }
    router.back();
  }, [pageIndex, router]);

  const slidesHeaderSkip = useMemo(
    () => ({
      label: ONBOARDING_SLIDES_SKIP_BUTTON_LABEL,
      accessibilityLabel: ONBOARDING_SLIDES_SKIP_BUTTON_ACCESSIBILITY_LABEL,
      hitSlop: ONBOARDING_SLIDES_SKIP_BUTTON_HIT_SLOP,
      textStyle: skipTextStyle,
      onPress: completeAndExit,
      disabled: busy,
    }),
    [busy, completeAndExit, skipTextStyle],
  );

  useOnboardingSlidesHeader({
    pageProgress: blendProgress,
    totalPages: slideModel.pageCount,
    trackColor: barTrack,
    fillColor: barFill,
    backChevronColor,
    onBackPress: goBack,
    backAccessibilityLabel: pageIndex > 0 ? 'Previous questionnaire step' : 'Back to introduction',
    skip: slidesHeaderSkip,
  });

  const onContinue = useCallback(() => {
    if (pageIndex < lastStep) {
      setPageIndex((i) => i + 1);
      return;
    }
    completeAndExit();
  }, [pageIndex, lastStep, completeAndExit]);

  // visual-only: tint chrome regions on “what’s on the agenda?” so layout boundaries are obvious — remove before shipping
  const taskAgendaLayoutDebug =
    nextStepChoice === 'task' && pageIndex === ONBOARDING_QUESTIONNAIRE_CORE_PAGE_COUNT;

  return (
    <View style={[styles.root, { backgroundColor: stepBackground }]}>
      <View style={styles.step}>
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
        />
      </View>
      <View
        style={[
          styles.continueFooter,
          taskAgendaLayoutDebug && styles.continueFooterAgendaDebug,
          taskAgendaLayoutDebug && styles.continueFooterAgendaFlushTop,
          { paddingBottom: Math.max(insets.bottom, Paddings.screen) },
        ]}
        pointerEvents="box-none"
      >
        <OnboardingContinueButton
          onPress={onContinue}
          loading={busy}
          disabled={busy}
          label={pageIndex < lastStep ? ONBOARDING_SLIDES_CONTINUE_LABEL : ONBOARDING_SLIDES_FINISH_SETUP_LABEL}
          labelStyle={continueLabelStyle}
          tintColor={continueFill}
          labelColor={continueLabelColor}
          accessibilityLabel={
            pageIndex < lastStep ? 'Continue to next question' : 'Finish setup and go to the app'
          }
        />
      </View>
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
    paddingHorizontal: Paddings.screen,
    paddingTop: Paddings.touchTarget,
    zIndex: 10,
    elevation: 10,
  },
  continueFooterAgendaDebug: {
    backgroundColor: 'green',
  },
  // agenda debug: shell drops bottom pad — remove top pad here so yellow body meets green footer
  continueFooterAgendaFlushTop: {
    paddingTop: 0,
  },
});
