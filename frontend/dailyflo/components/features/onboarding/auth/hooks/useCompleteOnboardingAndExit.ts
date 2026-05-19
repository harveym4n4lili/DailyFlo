/**
 * persists onboarding-complete flag then navigates home — root `_layout.tsx` trusts this key.
 * when questionnaire `answers` are passed, we also POST the user’s task/habit via `createTask` so
 * today’s list shows it immediately (redux `createTask.fulfilled` pushes into `tasks` — no extra fetch).
 * questionnaire wake/sleep is PATCH’d into django profile `preferences` so planner bounds follow the signed-in account.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Href } from 'expo-router';
import { useCallback, useState } from 'react';

import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { useAppDispatch } from '@/store';
import { createTask, updateTask } from '@/store/slices/tasks/tasksSlice';
import { patchUserSchedulePreferences } from '@/store/slices/auth/authSlice';

import type { OnboardingQuestionnaireStoredAnswersV1 } from '@/components/features/onboarding/onboarding/constants/onboardingQuestionnaireAnswers';
import { ONBOARDING_QUESTIONNAIRE_ANSWERS_STORAGE_KEY } from '@/components/features/onboarding/onboarding/constants/onboardingQuestionnaireAnswers';
import { buildCreateTaskInputFromOnboardingAnswers } from '@/components/features/onboarding/onboarding/utils/buildCreateTaskInputFromOnboardingAnswers';
import {
  DEFAULT_SLEEP_HHMM,
  DEFAULT_WAKE_HHMM,
  isoInstantToLocalHHMM,
  snapWakeSleepHHMM,
} from '@/utils/preferenceScheduleTimes';

export const ONBOARDING_COMPLETE_STORAGE_KEY = '@DailyFlo:onboardingComplete';

/** same tab route root `_layout` uses — dismiss onboarding modal here, don’t `back()` (that only slides→auth). */
const TODAY_HREF = '/(tabs)/today' as Href;

export function useCompleteOnboardingAndExit() {
  const router = useGuardedRouter();
  const dispatch = useAppDispatch();
  const [busy, setBusy] = useState(false);

  // optional `answers` — questionnaire snapshot saved as json; also drives `createTask` payload for today
  const completeAndExit = useCallback(
    async (answers?: OnboardingQuestionnaireStoredAnswersV1 | null) => {
      if (busy) return;
      setBusy(true);
      try {
        if (answers) {
          const taskInput = buildCreateTaskInputFromOnboardingAnswers(answers);
          if (taskInput) {
            const created = await dispatch(createTask(taskInput)).unwrap();
            if (answers.branch === 'task' && answers.task?.completed) {
              await dispatch(
                updateTask({ id: created.id, updates: { id: created.id, isCompleted: true } }),
              ).unwrap();
            }
          }
          await AsyncStorage.setItem(ONBOARDING_QUESTIONNAIRE_ANSWERS_STORAGE_KEY, JSON.stringify(answers));
          try {
            // onboarding wheels use 15m steps — normalize + push to `/accounts/users/profile/update/` merge path
            const wakeTime = snapWakeSleepHHMM(isoInstantToLocalHHMM(answers.wakeTimeIso), DEFAULT_WAKE_HHMM);
            const sleepTime = snapWakeSleepHHMM(isoInstantToLocalHHMM(answers.sleepTimeIso), DEFAULT_SLEEP_HHMM);
            await dispatch(patchUserSchedulePreferences({ wakeTime, sleepTime })).unwrap();
          } catch (scheduleErr) {
            console.warn('[onboarding] wake/sleep profile sync skipped', scheduleErr);
          }
        }
        await AsyncStorage.setItem(ONBOARDING_COMPLETE_STORAGE_KEY, 'true');
        // `router.back()` only pops questionnaire (`slides`) → still on `auth` inside the onboarding stack.
        // dismiss to today closes the full-screen onboarding modal and focuses the tab (expo-router).
        router.dismissTo(TODAY_HREF);
      } finally {
        setBusy(false);
      }
    },
    [busy, router, dispatch],
  );

  return { completeAndExit, busy };
}
