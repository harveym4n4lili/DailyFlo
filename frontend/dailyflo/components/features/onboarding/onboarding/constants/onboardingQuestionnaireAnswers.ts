/**
 * persisted snapshot when the user finishes the questionnaire — JSON in AsyncStorage (`ONBOARDING_QUESTIONNAIRE_ANSWERS_STORAGE_KEY`).
 * consumers (task create, habit create, analytics) can read this after onboarding; `v` leaves room to migrate shape later.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

/** matches keys we render on the “how often?” habit step */
export const ONBOARDING_HABIT_FREQUENCY_OPTIONS: readonly { id: string; label: string }[] = [
  { id: 'daily', label: 'Every day' },
  { id: 'weekly', label: 'A few times a week' },
  { id: 'weekends', label: 'Weekends' },
] as const;

export type OnboardingQuestionnaireStoredAnswersV1 = {
  v: 1;
  completedAtIso: string;
  branch: 'habit' | 'task';
  wakeTimeIso: string;
  sleepTimeIso: string;
  /** only filled when `branch === 'task'` */
  task: {
    title: string;
    completed: boolean;
    eventTimeIso: string;
    durationMinutes: number;
  } | null;
  /** only filled when `branch === 'habit'` */
  habit: {
    goalTitle: string;
    /** id from `ONBOARDING_HABIT_FREQUENCY_OPTIONS` */
    frequencyId: string;
  } | null;
};

export const ONBOARDING_QUESTIONNAIRE_ANSWERS_STORAGE_KEY = '@DailyFlo:onboardingQuestionnaireAnswersV1';

/** builds the object we `JSON.stringify` next to the onboarding-complete flag */
export function buildOnboardingQuestionnaireStoredAnswers(input: {
  branch: 'habit' | 'task';
  wakeTime: Date;
  sleepTime: Date;
  task: {
    title: string;
    completed: boolean;
    eventTime: Date;
    durationMinutes: number;
  };
  habit: {
    goalTitle: string;
    frequencyId: string;
  };
}): OnboardingQuestionnaireStoredAnswersV1 {
  const { branch, wakeTime, sleepTime, task, habit } = input;
  return {
    v: 1,
    completedAtIso: new Date().toISOString(),
    branch,
    wakeTimeIso: wakeTime.toISOString(),
    sleepTimeIso: sleepTime.toISOString(),
    task:
      branch === 'task'
        ? {
            title: task.title.trim(),
            completed: task.completed,
            eventTimeIso: task.eventTime.toISOString(),
            durationMinutes: task.durationMinutes,
          }
        : null,
    habit:
      branch === 'habit'
        ? {
            goalTitle: habit.goalTitle.trim(),
            frequencyId: habit.frequencyId,
          }
        : null,
  };
}

/** async read for screens/services after finish — null if missing or invalid json */
export async function readOnboardingQuestionnaireStoredAnswers(): Promise<OnboardingQuestionnaireStoredAnswersV1 | null> {
  const raw = await AsyncStorage.getItem(ONBOARDING_QUESTIONNAIRE_ANSWERS_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as OnboardingQuestionnaireStoredAnswersV1;
  } catch {
    return null;
  }
}
