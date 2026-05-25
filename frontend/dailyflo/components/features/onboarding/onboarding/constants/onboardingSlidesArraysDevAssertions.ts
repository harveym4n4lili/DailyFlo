/**
 * dev guards — core + branch arrays stay internally consistent.
 */

import {
  ONBOARDING_QUESTIONNAIRE_CORE_PAGE_SLIDE_UI,
  ONBOARDING_QUESTIONNAIRE_HABIT_BRANCH_SLIDE_UI,
  ONBOARDING_QUESTIONNAIRE_TASK_BRANCH_SLIDE_UI,
} from './slideUiTokens';
import {
  ONBOARDING_QUESTIONNAIRE_CORE_PAGE_CAPTIONS,
  ONBOARDING_QUESTIONNAIRE_CORE_PAGE_COUNT,
  ONBOARDING_QUESTIONNAIRE_CORE_PAGE_TITLES,
  ONBOARDING_QUESTIONNAIRE_HABIT_FOLLOWUP_CAPTIONS,
  ONBOARDING_QUESTIONNAIRE_HABIT_FOLLOWUP_TITLES,
  ONBOARDING_QUESTIONNAIRE_TASK_FOLLOWUP_CAPTIONS,
  ONBOARDING_QUESTIONNAIRE_TASK_FOLLOWUP_TITLES,
} from './textValues';

if (__DEV__ && ONBOARDING_QUESTIONNAIRE_CORE_PAGE_SLIDE_UI.length !== ONBOARDING_QUESTIONNAIRE_CORE_PAGE_COUNT) {
  console.warn(
    '[onboarding] ONBOARDING_QUESTIONNAIRE_CORE_PAGE_SLIDE_UI length must match ONBOARDING_QUESTIONNAIRE_CORE_PAGE_COUNT',
  );
}

if (__DEV__ && ONBOARDING_QUESTIONNAIRE_CORE_PAGE_TITLES.length !== ONBOARDING_QUESTIONNAIRE_CORE_PAGE_COUNT) {
  console.warn('[onboarding] core titles length must match ONBOARDING_QUESTIONNAIRE_CORE_PAGE_COUNT');
}

if (__DEV__ && ONBOARDING_QUESTIONNAIRE_CORE_PAGE_CAPTIONS.length !== ONBOARDING_QUESTIONNAIRE_CORE_PAGE_COUNT) {
  console.warn('[onboarding] core captions length must match ONBOARDING_QUESTIONNAIRE_CORE_PAGE_COUNT');
}

if (
  __DEV__ &&
  ONBOARDING_QUESTIONNAIRE_TASK_BRANCH_SLIDE_UI.length !== ONBOARDING_QUESTIONNAIRE_TASK_FOLLOWUP_TITLES.length
) {
  console.warn('[onboarding] task branch slideUi vs titles length mismatch');
}

if (
  __DEV__ &&
  ONBOARDING_QUESTIONNAIRE_TASK_FOLLOWUP_CAPTIONS.length !== ONBOARDING_QUESTIONNAIRE_TASK_FOLLOWUP_TITLES.length
) {
  console.warn('[onboarding] task branch captions vs titles length mismatch');
}

if (
  __DEV__ &&
  ONBOARDING_QUESTIONNAIRE_HABIT_BRANCH_SLIDE_UI.length !== ONBOARDING_QUESTIONNAIRE_HABIT_FOLLOWUP_TITLES.length
) {
  console.warn('[onboarding] habit branch slideUi vs titles length mismatch');
}

if (
  __DEV__ &&
  ONBOARDING_QUESTIONNAIRE_HABIT_FOLLOWUP_CAPTIONS.length !== ONBOARDING_QUESTIONNAIRE_HABIT_FOLLOWUP_TITLES.length
) {
  console.warn('[onboarding] habit branch captions vs titles length mismatch');
}

if (__DEV__ && ONBOARDING_QUESTIONNAIRE_CORE_PAGE_COUNT < 1) {
  console.warn('[onboarding] ONBOARDING_QUESTIONNAIRE_CORE_PAGE_COUNT must be >= 1');
}

if (__DEV__) {
  for (const idx of [1, 2] as const) {
    if (!ONBOARDING_QUESTIONNAIRE_CORE_PAGE_SLIDE_UI[idx]?.timeWheelBrandRamp) {
      console.warn(
        `[onboarding] slide index ${idx} should set timeWheelBrandRamp in slideUiTokens.ts (wake/sleep time wheels).`,
      );
    }
  }
  const awtRamp = ONBOARDING_QUESTIONNAIRE_TASK_BRANCH_SLIDE_UI[1]?.timeWheelBrandRamp;
  if (!awtRamp) {
    console.warn(
      '[onboarding] task branch slide 1 (AWT) should set timeWheelBrandRamp in slideUiTokens.ts for the native time wheel tint.',
    );
  }
}

// first task-branch step is the task agenda — `taskAgendaBody` should list colors, suggestions heading string, and pill labels
if (__DEV__) {
  const agendaUi = ONBOARDING_QUESTIONNAIRE_TASK_BRANCH_SLIDE_UI[0]?.taskAgendaBody;
  if (!agendaUi?.taskTitleInput || !agendaUi.pencilIcon || !agendaUi.suggestionsSectionTitle) {
    console.warn(
      '[onboarding] ONBOARDING_QUESTIONNAIRE_TASK_BRANCH_SLIDE_UI[0] should define taskTitleInput, pencilIcon, suggestionsSectionTitle on taskAgendaBody (see types.ts).',
    );
  }
  if (
    !agendaUi?.suggestionsSectionHeading ||
    !agendaUi.suggestionPillLabels ||
    agendaUi.suggestionPillLabels.length === 0
  ) {
    console.warn(
      '[onboarding] ONBOARDING_QUESTIONNAIRE_TASK_BRANCH_SLIDE_UI[0] taskAgendaBody should define suggestionsSectionHeading and non-empty suggestionPillLabels.',
    );
  }
}
