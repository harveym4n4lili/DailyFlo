/**
 * post-intro questionnaire body — one step at a time (no horizontal swipe).
 * step changes animate `blendProgress` 0…n−1 like intro scroll so header bar + body colors rgb-lerp (`blendIntroContinueButtonColors`, etc.).
 */

import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OnboardingContinueButton } from '@/components/ui/Button';
import { blendIntroContinueButtonColors } from '../../introductory/scrollTransition/introThemeResolvers';
import { Paddings } from '@/constants/Paddings';
import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { useThemeColors } from '@/hooks/useColorPalette';

import { useCompleteOnboardingAndExit } from '../../introductory/hooks/useCompleteOnboardingAndExit';
import {
  ONBOARDING_SLIDES_CONTINUE_BUTTON_TEXT_STYLE,
  ONBOARDING_SLIDES_CONTINUE_LABEL,
  ONBOARDING_SLIDES_PAGE_COUNT,
  ONBOARDING_SLIDES_PAGE_SLIDE_UI,
  ONBOARDING_SLIDES_SKIP_TEXT_STYLE,
  ONBOARDING_SLIDES_SKIP_TEXT_COLOR,
  ONBOARDING_SLIDES_SKIP_BUTTON_ACCESSIBILITY_LABEL,
  ONBOARDING_SLIDES_SKIP_BUTTON_HIT_SLOP,
  ONBOARDING_SLIDES_SKIP_BUTTON_LABEL,
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

const LAST_STEP = Math.max(ONBOARDING_SLIDES_PAGE_COUNT - 1, 0);

export function OnboardingQuestionnaireFlow() {
  const themeColors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useGuardedRouter();
  const [pageIndex, setPageIndex] = useState(0);
  const { completeAndExit, busy } = useCompleteOnboardingAndExit();

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
      ONBOARDING_SLIDES_PAGE_SLIDE_UI.map((row) =>
        resolveOnboardingSlidesProgressTrackColor(themeColors, row.progressBarTrack),
      ),
    [themeColors],
  );
  const progressFillColorsByPage = useMemo(
    () =>
      ONBOARDING_SLIDES_PAGE_SLIDE_UI.map((row) =>
        resolveOnboardingSlidesContinueButtonPaint(themeColors, row.progressBarFill),
      ),
    [themeColors],
  );
  const backgroundColorsByPage = useMemo(
    () =>
      ONBOARDING_SLIDES_PAGE_SLIDE_UI.map((row) =>
        resolveOnboardingSlidesBackgroundColor(themeColors, row.background),
      ),
    [themeColors],
  );

  const continuePaintByPage = useMemo(
    () => ({
      fills: ONBOARDING_SLIDES_PAGE_SLIDE_UI.map((row) =>
        resolveOnboardingSlidesContinueButtonPaint(themeColors, row.continueButtonBackground),
      ),
      icons: ONBOARDING_SLIDES_PAGE_SLIDE_UI.map((row) =>
        resolveOnboardingSlidesContinueButtonPaint(themeColors, row.continueButtonIcon),
      ),
    }),
    [themeColors],
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
    totalPages: ONBOARDING_SLIDES_PAGE_COUNT,
    trackColor: barTrack,
    fillColor: barFill,
    onBackPress: goBack,
    backAccessibilityLabel: pageIndex > 0 ? 'Previous questionnaire step' : 'Back to introduction',
    skip: slidesHeaderSkip,
  });

  const onContinue = useCallback(() => {
    if (pageIndex < LAST_STEP) {
      setPageIndex((i) => i + 1);
      return;
    }
    completeAndExit();
  }, [pageIndex, completeAndExit]);

  return (
    <View style={[styles.root, { backgroundColor: stepBackground }]}>
      <View style={styles.step} key={pageIndex}>
        <OnboardingSampleSlidePage
          pageIndex={pageIndex}
          blendProgressAnim={blendProgressAnim}
          blendedAccentFill={continueFill}
        />
      </View>
      <View
        style={[
          styles.continueFooter,
          { paddingBottom: Math.max(insets.bottom, Paddings.screen) },
        ]}
        pointerEvents="box-none"
      >
        {/* on ios 15+ the shared button wraps expo GlassView + slide tint; android/web use solid fill */}
        <OnboardingContinueButton
          onPress={onContinue}
          loading={busy}
          disabled={busy}
          label={ONBOARDING_SLIDES_CONTINUE_LABEL}
          labelStyle={continueLabelStyle}
          tintColor={continueFill}
          labelColor={continueLabelColor}
          accessibilityLabel={
            pageIndex < LAST_STEP ? 'Continue to next question' : 'Finish onboarding and go to the app'
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
});
