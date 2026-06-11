/**
 * turns the json snapshot from `buildOnboardingQuestionnaireStoredAnswers` into `CreateTaskInput`
 * so redux `createTask` can POST to django — same shape as manual task create / quick add.
 *
 * today list only shows tasks whose calendar due day falls in the today window (`recurrenceUtils`):
 * - one-off: need `dueDate` on **today** (local) plus optional `time` / `duration`.
 * - recurring: anchor `dueDate` on today + `routineType` so `taskOccursOnDate` is true for today.
 */

import type { CreateTaskInput } from '@/types';

import type { OnboardingQuestionnaireStoredAnswersV1 } from '../constants/onboardingQuestionnaireAnswers';

/** hh:mm in local time from a date (values come from questionnaire time wheels). */
function formatTimeHHMM(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/**
 * calendar “today” in the user’s timezone, but with hour/minute copied from `timeSource`
 * (so dueDate lines up with the today list + task time pill).
 */
function localTodayWithTimeFrom(timeSource: Date): string {
  const out = new Date();
  out.setHours(timeSource.getHours(), timeSource.getMinutes(), 0, 0);
  return out.toISOString();
}

/**
 * @returns payload for `dispatch(createTask(...))`, or null if answers are incomplete (shouldn’t happen on finish).
 * habit branch uses buildCreateHabitInputFromOnboardingAnswers + createHabit instead.
 */
export function buildCreateTaskInputFromOnboardingAnswers(
  answers: OnboardingQuestionnaireStoredAnswersV1,
): CreateTaskInput | null {
  if (answers.branch === 'habit') {
    return null;
  }

  if (answers.branch === 'task' && answers.task) {
    const event = new Date(answers.task.eventTimeIso);
    return {
      title: answers.task.title || 'My task',
      time: formatTimeHHMM(event),
      duration: answers.task.durationMinutes ?? 0,
      dueDate: localTodayWithTimeFrom(event),
      routineType: 'once',
      priorityLevel: 3,
      color: 'blue',
    };
  }

  return null;
}
