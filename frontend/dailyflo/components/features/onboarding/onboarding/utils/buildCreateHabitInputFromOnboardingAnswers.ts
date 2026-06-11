/**
 * maps onboarding questionnaire habit answers → CreateHabitInput for POST /habits/.
 * replaces the old habit → recurring task path in buildCreateTaskInputFromOnboardingAnswers.
 */

import type { CreateHabitInput, HabitFrequencyType } from '@/types/api/habits';
import type { OnboardingQuestionnaireStoredAnswersV1 } from '../constants/onboardingQuestionnaireAnswers';

/** python weekday mon=0 … sun=6 from a Date */
function pythonWeekdayFromDate(d: Date): number {
  return (d.getDay() + 6) % 7;
}

/** onboarding frequency ids → django habit frequency_type */
function mapFrequency(
  frequencyId: string,
  wakeTimeIso?: string,
): {
  frequencyType: HabitFrequencyType;
  frequencyConfig: CreateHabitInput['frequencyConfig'];
} {
  if (frequencyId === 'weekends') {
    return { frequencyType: 'weekends', frequencyConfig: {} };
  }
  if (frequencyId === 'weekly') {
    const wake = wakeTimeIso ? new Date(wakeTimeIso) : new Date();
    return { frequencyType: 'weekly', frequencyConfig: { dayOfWeek: pythonWeekdayFromDate(wake) } };
  }
  return { frequencyType: 'daily', frequencyConfig: {} };
}

/**
 * @returns payload for `dispatch(createHabit(...))`, or null if answers are incomplete.
 */
export function buildCreateHabitInputFromOnboardingAnswers(
  answers: OnboardingQuestionnaireStoredAnswersV1,
): CreateHabitInput | null {
  if (answers.branch !== 'habit' || !answers.habit) return null;

  const { frequencyType, frequencyConfig } = mapFrequency(
    answers.habit.frequencyId,
    answers.wakeTimeIso,
  );

  return {
    title: answers.habit.goalTitle || 'My habit',
    color: 'green',
    trackingType: 'binary',
    frequencyType,
    frequencyConfig,
  };
}
