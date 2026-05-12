/**
 * merges the fixed questionnaire core (intro + wake + sleep + branch picker) with habit vs task follow-up slides.
 * headline chrome, progress, and body crossfade all read the same `pageCount` + parallel arrays so indices stay aligned.
 */

import type { OnboardingSlidesPageTitleConfig, OnboardingSlidesSlideUiConfig } from './types';

import {
  ONBOARDING_QUESTIONNAIRE_CORE_PAGE_CAPTIONS,
  ONBOARDING_QUESTIONNAIRE_CORE_PAGE_COUNT,
  ONBOARDING_QUESTIONNAIRE_CORE_PAGE_TITLES,
  ONBOARDING_QUESTIONNAIRE_HABIT_FOLLOWUP_CAPTIONS,
  ONBOARDING_QUESTIONNAIRE_HABIT_FOLLOWUP_TITLES,
  type OnboardingQuestionnaireNextStepChoice,
  ONBOARDING_QUESTIONNAIRE_TASK_FOLLOWUP_CAPTIONS,
  ONBOARDING_QUESTIONNAIRE_TASK_FOLLOWUP_TITLES,
} from './textValues';
import {
  ONBOARDING_QUESTIONNAIRE_CORE_PAGE_SLIDE_UI,
  ONBOARDING_QUESTIONNAIRE_HABIT_BRANCH_SLIDE_UI,
  ONBOARDING_QUESTIONNAIRE_TASK_BRANCH_SLIDE_UI,
} from './slideUiTokens';

export type OnboardingQuestionnaireSlideModel = {
  pageTitles: readonly OnboardingSlidesPageTitleConfig[];
  pageCaptions: readonly string[];
  pageSlideUi: readonly OnboardingSlidesSlideUiConfig[];
  pageCount: number;
};

/** worst-case step count — used where we show progress before the habit/task branch is known (initial header). */
export const ONBOARDING_QUESTIONNAIRE_MAX_PAGE_COUNT =
  ONBOARDING_QUESTIONNAIRE_CORE_PAGE_COUNT + ONBOARDING_QUESTIONNAIRE_TASK_FOLLOWUP_TITLES.length;

export function getOnboardingQuestionnaireSlideModel(
  choice: OnboardingQuestionnaireNextStepChoice,
): OnboardingQuestionnaireSlideModel {
  if (choice === 'task') {
    const branchTitles = ONBOARDING_QUESTIONNAIRE_TASK_FOLLOWUP_TITLES;
    return {
      pageTitles: [...ONBOARDING_QUESTIONNAIRE_CORE_PAGE_TITLES, ...branchTitles],
      pageCaptions: [...ONBOARDING_QUESTIONNAIRE_CORE_PAGE_CAPTIONS, ...ONBOARDING_QUESTIONNAIRE_TASK_FOLLOWUP_CAPTIONS],
      pageSlideUi: [...ONBOARDING_QUESTIONNAIRE_CORE_PAGE_SLIDE_UI, ...ONBOARDING_QUESTIONNAIRE_TASK_BRANCH_SLIDE_UI],
      pageCount: ONBOARDING_QUESTIONNAIRE_CORE_PAGE_COUNT + branchTitles.length,
    };
  }

  const branchTitles = ONBOARDING_QUESTIONNAIRE_HABIT_FOLLOWUP_TITLES;
  return {
    pageTitles: [...ONBOARDING_QUESTIONNAIRE_CORE_PAGE_TITLES, ...branchTitles],
    pageCaptions: [...ONBOARDING_QUESTIONNAIRE_CORE_PAGE_CAPTIONS, ...ONBOARDING_QUESTIONNAIRE_HABIT_FOLLOWUP_CAPTIONS],
    pageSlideUi: [...ONBOARDING_QUESTIONNAIRE_CORE_PAGE_SLIDE_UI, ...ONBOARDING_QUESTIONNAIRE_HABIT_BRANCH_SLIDE_UI],
    pageCount: ONBOARDING_QUESTIONNAIRE_CORE_PAGE_COUNT + branchTitles.length,
  };
}
