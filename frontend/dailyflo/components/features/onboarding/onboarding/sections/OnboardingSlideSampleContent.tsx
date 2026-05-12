/**
 * questionnaire body — wake/sleep steps show centered native time wheels; others stay empty for future UI.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';

import { getOnboardingQuestionnaireTimeWheelBrandRampForSlide } from '../constants/slideUiTokens';
import {
  ONBOARDING_QUESTIONNAIRE_SLEEP_STEP_INDEX,
  ONBOARDING_QUESTIONNAIRE_WAKE_STEP_INDEX,
} from '../constants/textValues';
import { OnboardingQuestionnaireTimeWheel } from '../ui/OnboardingQuestionnaireTimeWheel';

export type OnboardingSlideSampleContentProps = {
  pageIndex: number;
  wakeTime: Date;
  sleepTime: Date;
  onWakeTimeChange: (next: Date) => void;
  onSleepTimeChange: (next: Date) => void;
};

export function OnboardingSlideSampleContent({
  pageIndex,
  wakeTime,
  sleepTime,
  onWakeTimeChange,
  onSleepTimeChange,
}: OnboardingSlideSampleContentProps) {
  if (pageIndex === ONBOARDING_QUESTIONNAIRE_WAKE_STEP_INDEX) {
    // brand ramp read from the same slide row as headline colors (`slideUiTokens` → `timeWheelBrandRamp`)
    const brandRamp = getOnboardingQuestionnaireTimeWheelBrandRampForSlide(pageIndex);
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

  if (pageIndex === ONBOARDING_QUESTIONNAIRE_SLEEP_STEP_INDEX) {
    const brandRamp = getOnboardingQuestionnaireTimeWheelBrandRampForSlide(pageIndex);
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

  return (
    <View style={styles.bodySlot} accessibilityLabel="Questionnaire body content">
      {/* future steps: illustrations / controls */}
    </View>
  );
}

const styles = StyleSheet.create({
  bodySlot: {
    flex: 1,
    width: '100%',
  },
});
