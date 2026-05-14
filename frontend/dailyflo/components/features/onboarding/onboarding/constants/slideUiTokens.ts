/**
 * questionnaire — token rows for chrome (core steps + habit/task branch steps).
 *
 * theme words vs brand ramps:
 * - `primary` / `secondary` on backgrounds, borders, text = app theme slots (not plant/moss/sage).
 * - `plant:500`, `moss:600`, `sage:300`, … = explicit ramps from ColorPalette (same strings as intro).
 *
 * time wheel: set `timeWheelBrandRamp` on steps that show `OnboardingQuestionnaireTimeWheel` so spinner tint matches that slide’s plant/moss/sage chrome.
 * habit / task follow-up slides (after the picker) use the **plant** ramp; the fixed core still uses plant / moss / sage / plant for intro → wheels → picker.
 */

import type {
  OnboardingSlidesSlideUiConfig,
  OnboardingSlidesTimeWheelBrandRamp,
} from './types';

/** line above sideways suggestion chips — canonical copy for the task-agenda step (referenced from `taskAgendaBody`) */
export const ONBOARDING_TASK_AGENDA_SUGGESTIONS_SECTION_TITLE = 'Here are some suggestions:';

/** suggestion chip labels for task agenda; two horizontal `ScrollView` rows split this list */
export const ONBOARDING_TASK_AGENDA_SUGGESTION_PILLS: readonly string[] = [
  'Morning standup',
  'Email inbox',
  'Focus block',
  'Walk outside',
  'Plan tomorrow',
  'Team sync',
  'Deep work',
  'Quick errands',
];

/** first steps — indices align with `ONBOARDING_QUESTIONNAIRE_CORE_PAGE_TITLES` */
export const ONBOARDING_QUESTIONNAIRE_CORE_PAGE_SLIDE_UI: readonly OnboardingSlidesSlideUiConfig[] = [
  {
    background: 'primary',
    titleColor: 'plant:800',
    titleHighlightColor: 'plant:800',
    captionColor: 'plant:700',
    dotIndicatorColor: 'plant:600',
    continueButtonBackground: 'plant:500',
    continueButtonIcon: 'plant:800',
    progressBarTrack: 'secondary',
    progressBarFill: 'plant:500',
    headerBackIconColor: 'secondary',
  },
  {
    background: 'primary',
    titleColor: 'moss:800',
    titleHighlightColor: 'moss:800',
    captionColor: 'moss:700',
    dotIndicatorColor: 'moss:600',
    continueButtonBackground: 'moss:500',
    continueButtonIcon: 'moss:800',
    progressBarTrack: 'secondary',
    progressBarFill: 'moss:500',
    headerBackIconColor: 'secondary',
    timeWheelBrandRamp: 'moss',
  },
  {
    background: 'primary',
    titleColor: 'sage:800',
    titleHighlightColor: 'sage:800',
    captionColor: 'sage:700',
    dotIndicatorColor: 'sage:600',
    continueButtonBackground: 'sage:500',
    continueButtonIcon: 'sage:800',
    progressBarTrack: 'secondary',
    progressBarFill: 'sage:500',
    headerBackIconColor: 'secondary',
    timeWheelBrandRamp: 'sage',
  },
  {
    background: 'primary',
    titleColor: 'plant:800',
    titleHighlightColor: 'plant:800',
    captionColor: 'plant:700',
    dotIndicatorColor: 'plant:600',
    continueButtonBackground: 'plant:500',
    continueButtonIcon: 'plant:800',
    progressBarTrack: 'secondary',
    progressBarFill: 'plant:500',
    headerBackIconColor: 'secondary',
  },
];

/** task branch — all steps after the habit/task picker use the plant ramp (task agenda + follow-ups). */
export const ONBOARDING_QUESTIONNAIRE_TASK_BRANCH_SLIDE_UI: readonly OnboardingSlidesSlideUiConfig[] = [
  {
    background: 'primary',
    titleColor: 'plant:800',
    titleHighlightColor: 'plant:800',
    captionColor: 'plant:700',
    dotIndicatorColor: 'plant:600',
    continueButtonBackground: 'plant:500',
    continueButtonIcon: 'plant:800',
    progressBarTrack: 'secondary',
    progressBarFill: 'plant:500',
    headerBackIconColor: 'secondary',
    taskAgendaBody: {
      taskTitleInput: 'plant:800',
      pencilIcon: 'plant:600',
      suggestionsSectionTitle: 'plant:800',
      suggestionsSectionHeading: ONBOARDING_TASK_AGENDA_SUGGESTIONS_SECTION_TITLE,
      suggestionPillLabels: ONBOARDING_TASK_AGENDA_SUGGESTION_PILLS,
    },
  },
  {
    background: 'primary',
    titleColor: 'plant:800',
    titleHighlightColor: 'plant:800',
    captionColor: 'plant:700',
    dotIndicatorColor: 'plant:600',
    continueButtonBackground: 'plant:500',
    continueButtonIcon: 'plant:800',
    progressBarTrack: 'secondary',
    progressBarFill: 'plant:500',
    headerBackIconColor: 'secondary',
  },
  {
    background: 'primary',
    titleColor: 'plant:800',
    titleHighlightColor: 'plant:800',
    captionColor: 'plant:700',
    dotIndicatorColor: 'plant:600',
    continueButtonBackground: 'plant:500',
    continueButtonIcon: 'plant:800',
    progressBarTrack: 'secondary',
    progressBarFill: 'plant:500',
    headerBackIconColor: 'secondary',
  },
  {
    background: 'primary',
    titleColor: 'plant:800',
    titleHighlightColor: 'plant:800',
    captionColor: 'plant:700',
    dotIndicatorColor: 'plant:600',
    continueButtonBackground: 'plant:500',
    continueButtonIcon: 'plant:800',
    progressBarTrack: 'secondary',
    progressBarFill: 'plant:500',
    headerBackIconColor: 'secondary',
  },
];

/** habit branch — all steps after the picker use the plant ramp */
export const ONBOARDING_QUESTIONNAIRE_HABIT_BRANCH_SLIDE_UI: readonly OnboardingSlidesSlideUiConfig[] = [
  {
    background: 'primary',
    titleColor: 'plant:800',
    titleHighlightColor: 'plant:800',
    captionColor: 'plant:700',
    dotIndicatorColor: 'plant:600',
    continueButtonBackground: 'plant:500',
    continueButtonIcon: 'plant:800',
    progressBarTrack: 'secondary',
    progressBarFill: 'plant:500',
    headerBackIconColor: 'secondary',
  },
  {
    background: 'primary',
    titleColor: 'plant:800',
    titleHighlightColor: 'plant:800',
    captionColor: 'plant:700',
    dotIndicatorColor: 'plant:600',
    continueButtonBackground: 'plant:500',
    continueButtonIcon: 'plant:800',
    progressBarTrack: 'secondary',
    progressBarFill: 'plant:500',
    headerBackIconColor: 'secondary',
  },
  {
    background: 'primary',
    titleColor: 'plant:800',
    titleHighlightColor: 'plant:800',
    captionColor: 'plant:700',
    dotIndicatorColor: 'plant:600',
    continueButtonBackground: 'plant:500',
    continueButtonIcon: 'plant:800',
    progressBarTrack: 'secondary',
    progressBarFill: 'plant:500',
    headerBackIconColor: 'secondary',
  },
];

/** resolves `timeWheelBrandRamp` for wake/sleep slides — reads core row only (those indices stay in the fixed block) */
export function getOnboardingQuestionnaireTimeWheelBrandRampForSlide(
  pageIndex: number,
): OnboardingSlidesTimeWheelBrandRamp {
  const ramp = ONBOARDING_QUESTIONNAIRE_CORE_PAGE_SLIDE_UI[pageIndex]?.timeWheelBrandRamp;
  if (ramp == null) {
    throw new Error(
      `[DailyFlo onboarding] slide index ${pageIndex} has no timeWheelBrandRamp — set it in slideUiTokens next to that row.`,
    );
  }
  return ramp;
}
