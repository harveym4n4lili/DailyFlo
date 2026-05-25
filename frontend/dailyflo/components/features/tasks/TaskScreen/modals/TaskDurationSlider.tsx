/**
 * Task duration glass slider — wraps onboarding duration slider with marple task-form chrome.
 * Parent screen owns clearing duration (undefined); slider shows 30m on the rail until a stop is picked.
 */

import React, { useMemo } from 'react';

import { AUTH_LANDING_SLIDE_UI } from '@/components/features/onboarding/auth/constants/slideUiTokens';
import { resolveIntroContinueButtonPaint } from '@/components/features/onboarding/auth/scrollTransition';
import { OnboardingQuestionnaireDurationGlassSlider } from '@/components/features/onboarding/onboarding/ui/OnboardingQuestionnaireDurationGlassSlider';
import { useThemeColors } from '@/hooks/useColorPalette';

/** draft.duration can be undefined — use a neutral default on the rail before the user commits a stop */
const DURATION_SLIDER_FALLBACK_MINUTES = 30;

export type TaskDurationSliderProps = {
  valueMinutes: number | undefined;
  /** parent writes minutes into CreateTaskDraftContext */
  onChangeMinutes: (minutes: number) => void;
  accessibilityLabel?: string;
};

export function TaskDurationSlider({
  valueMinutes,
  onChangeMinutes,
  accessibilityLabel = 'Task duration',
}: TaskDurationSliderProps) {
  const themeColors = useThemeColors();

  // marple thumb fill + label tint — same tokens as add alert / onboarding continue
  const tintColor = useMemo(
    () => resolveIntroContinueButtonPaint(themeColors, AUTH_LANDING_SLIDE_UI.continueButtonBackground),
    [themeColors],
  );
  const labelColor = useMemo(
    () =>
      resolveIntroContinueButtonPaint(
        themeColors,
        AUTH_LANDING_SLIDE_UI.continueButtonIcon ?? 'primarySecondaryBlend',
      ),
    [themeColors],
  );

  return (
    <OnboardingQuestionnaireDurationGlassSlider
      valueMinutes={valueMinutes ?? DURATION_SLIDER_FALLBACK_MINUTES}
      onChange={onChangeMinutes}
      tintColor={tintColor}
      labelColor={labelColor}
      accessibilityLabel={accessibilityLabel}
    />
  );
}
