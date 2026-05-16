/**
 * persists onboarding-complete flag then navigates home — root `_layout.tsx` trusts this key.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useState } from 'react';

import { useGuardedRouter } from '@/hooks/useGuardedRouter';

import type { OnboardingQuestionnaireStoredAnswersV1 } from '@/components/features/onboarding/onboarding/constants/onboardingQuestionnaireAnswers';
import { ONBOARDING_QUESTIONNAIRE_ANSWERS_STORAGE_KEY } from '@/components/features/onboarding/onboarding/constants/onboardingQuestionnaireAnswers';

export const ONBOARDING_COMPLETE_STORAGE_KEY = '@DailyFlo:onboardingComplete';

export function useCompleteOnboardingAndExit() {
  const router = useGuardedRouter();
  const [busy, setBusy] = useState(false);

  // optional `answers` — questionnaire snapshot saved as JSON so home / task services can create entities later
  const completeAndExit = useCallback(
    async (answers?: OnboardingQuestionnaireStoredAnswersV1 | null) => {
      if (busy) return;
      setBusy(true);
      try {
        if (answers) {
          await AsyncStorage.setItem(ONBOARDING_QUESTIONNAIRE_ANSWERS_STORAGE_KEY, JSON.stringify(answers));
        }
        await AsyncStorage.setItem(ONBOARDING_COMPLETE_STORAGE_KEY, 'true');
        // intro was pushed as a root modal over today — pop it so the tab stays underneath.
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/(tabs)/today');
        }
      } finally {
        setBusy(false);
      }
    },
    [busy, router],
  );

  return { completeAndExit, busy };
}
