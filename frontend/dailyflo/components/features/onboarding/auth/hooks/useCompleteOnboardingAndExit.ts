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
import { useAppDispatch, useAppSelector } from '@/store';
import { createTask, updateTask } from '@/store/slices/tasks/tasksSlice';
import {
  patchUserOnboardingCompleted,
  patchUserSchedulePreferences,
} from '@/store/slices/auth/authSlice';
import {
  ONBOARDING_COMPLETE_STORAGE_KEY,
  setDeviceOnboardingComplete,
  setUserOnboardingComplete,
} from '@/utils/onboarding/onboardingUserStatus';
import { getNotificationPromptAlreadyShown } from '@/utils/notifications/notificationPromptStorage';

import type { OnboardingQuestionnaireStoredAnswersV1 } from '@/components/features/onboarding/onboarding/constants/onboardingQuestionnaireAnswers';
import { ONBOARDING_QUESTIONNAIRE_ANSWERS_STORAGE_KEY } from '@/components/features/onboarding/onboarding/constants/onboardingQuestionnaireAnswers';
import { buildCreateTaskInputFromOnboardingAnswers } from '@/components/features/onboarding/onboarding/utils/buildCreateTaskInputFromOnboardingAnswers';
import {
  DEFAULT_SLEEP_HHMM,
  DEFAULT_WAKE_HHMM,
  isoInstantToLocalHHMM,
  snapWakeSleepHHMM,
} from '@/utils/preferenceScheduleTimes';

/** re-export so existing imports from this hook keep working */
export { ONBOARDING_COMPLETE_STORAGE_KEY };

/** questionnaire finish → optional notifications step → Today tab */
const NOTIFICATIONS_HREF = '/(onboarding)/notifications' as Href;

export function useCompleteOnboardingAndExit() {
  const router = useGuardedRouter();
  const dispatch = useAppDispatch();
  const userId = useAppSelector((state) => state.auth.user?.id);
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
        await setDeviceOnboardingComplete();
        if (userId) {
          await setUserOnboardingComplete(userId);
        }
        try {
          await dispatch(patchUserOnboardingCompleted()).unwrap();
        } catch (flagErr) {
          console.warn('[onboarding] server onboarding_completed sync skipped', flagErr);
        }
        // first-time installs see the native notification prompt once; returning installs skip straight to Today
        const alreadyPrompted = await getNotificationPromptAlreadyShown();
        if (alreadyPrompted) {
          router.dismissTo('/(tabs)/today' as Href);
        } else {
          router.push(NOTIFICATIONS_HREF);
        }
      } finally {
        setBusy(false);
      }
    },
    [busy, router, dispatch, userId],
  );

  return { completeAndExit, busy };
}
