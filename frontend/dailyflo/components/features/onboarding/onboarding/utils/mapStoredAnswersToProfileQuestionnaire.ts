/**
 * maps the local AsyncStorage questionnaire snapshot into `UserPreferences.onboardingQuestionnaire`
 * so `patchUserOnboardingQuestionnaire` can merge it onto django `preferences.onboarding_questionnaire`.
 */

import type { UserPreferences } from '@/types';

import type { OnboardingQuestionnaireStoredAnswersV1 } from '../constants/onboardingQuestionnaireAnswers';

export function mapStoredAnswersToProfileQuestionnaire(
  answers: OnboardingQuestionnaireStoredAnswersV1,
): NonNullable<UserPreferences['onboardingQuestionnaire']> {
  return {
    v: 1,
    branch: answers.branch,
    completedAt: answers.completedAtIso,
    task:
      answers.branch === 'task' && answers.task
        ? {
            title: answers.task.title,
            completed: answers.task.completed,
            eventTime: answers.task.eventTimeIso,
            durationMinutes: answers.task.durationMinutes,
          }
        : null,
    habit:
      answers.branch === 'habit' && answers.habit
        ? {
            goalTitle: answers.habit.goalTitle,
            frequencyId: answers.habit.frequencyId,
          }
        : null,
  };
}
