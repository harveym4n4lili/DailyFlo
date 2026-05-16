/**
 * questionnaire — token rows for chrome (core steps + habit/task branch steps).
 *
 * **scoped colors** — prefer `{ scope: 'background' | 'text' | 'button' | 'border', token: '…' }` so theme words like `primary` / `secondary` are explicit
 * (e.g. `{ scope: 'text', token: 'primary' }` = `useThemeColors().text.primary()`, not `background.primary`).
 * any slide color field accepts any scope; resolvers live in `resolveOnboardingSlidesSlideUiField`.
 * brand ramps (`plant:500`, …) resolve the same hex from any scope — scope still documents intent.
 *
 * - header progress **track**: `{ scope: 'track', token: 'primarySecondaryBlend' }` (explicit blend) or any `{ scope: 'background'|'text'|'button'|'border', token }`.
 * - `plant:500`, `moss:600`, `marple:800`, … = ColorPalette ramps (same as intro).
 *
 * time wheel: `timeWheelBrandRamp` tints the spinner for wake/sleep steps.
 * fixed core: marple → moss → sage → marple (intro, wake, sleep, picker).
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
    background: { scope: 'background', token: 'primary' },
    titleColor: { scope: 'text', token: 'primary' },
    titleHighlightColor: { scope: 'text', token: 'primary' },
    captionColor: { scope: 'text', token: 'primary' },
    dotIndicatorColor: { scope: 'text', token: 'marple:600' },
    continueButtonBackground: { scope: 'button', token: 'marple:500' },
    continueButtonIcon: { scope: 'background', token: 'primarySecondaryBlend' },
    progressBarTrack: { scope: 'track', token: 'primarySecondaryBlend' },
    progressBarFill: { scope: 'button', token: 'marple:500' },
    headerBackIconColor: { scope: 'text', token: 'secondary' },
  },
  {
    background: { scope: 'background', token: 'primary' },
    titleColor: { scope: 'text', token: 'primary' },
    titleHighlightColor: { scope: 'text', token: 'primary' },
    captionColor: { scope: 'text', token: 'primary' },
    dotIndicatorColor: { scope: 'text', token: 'moss:600' },
    continueButtonBackground: { scope: 'button', token: 'moss:500' },
    continueButtonIcon: { scope: 'button', token: 'moss:800' },
    progressBarTrack: { scope: 'track', token: 'primarySecondaryBlend' },
    progressBarFill: { scope: 'button', token: 'moss:500' },
    headerBackIconColor: { scope: 'text', token: 'secondary' },
    timeWheelBrandRamp: 'moss',
  },
  {
    background: { scope: 'background', token: 'primary' },
    titleColor: { scope: 'text', token: 'primary' },
    titleHighlightColor: { scope: 'text', token: 'primary' },
    captionColor: { scope: 'text', token: 'primary' },
    dotIndicatorColor: { scope: 'text', token: 'sage:600' },
    continueButtonBackground: { scope: 'button', token: 'sage:500' },
    continueButtonIcon: { scope: 'text', token: 'sage:700' },
    progressBarTrack: { scope: 'track', token: 'primarySecondaryBlend' },
    progressBarFill: { scope: 'button', token: 'sage:500' },
    headerBackIconColor: { scope: 'text', token: 'secondary' },
    timeWheelBrandRamp: 'sage',
  },
  {
    background: { scope: 'background', token: 'primary' },
    titleColor: { scope: 'text', token: 'primary' },
    titleHighlightColor: { scope: 'text', token: 'primary' },
    captionColor: { scope: 'text', token: 'primary' },
    dotIndicatorColor: { scope: 'text', token: 'marple:600' },
    continueButtonBackground: { scope: 'button', token: 'marple:500' },
    continueButtonIcon: { scope: 'background', token: 'primarySecondaryBlend' },
    progressBarTrack: { scope: 'track', token: 'primarySecondaryBlend' },
    progressBarFill: { scope: 'button', token: 'marple:500' },
    headerBackIconColor: { scope: 'text', token: 'secondary' },
  },
];

/** task branch — all steps after the habit/task picker use the plant ramp (task agenda + follow-ups). */
export const ONBOARDING_QUESTIONNAIRE_TASK_BRANCH_SLIDE_UI: readonly OnboardingSlidesSlideUiConfig[] = [
  {
    background: { scope: 'background', token: 'primary' },
    titleColor: { scope: 'text', token: 'primary' },
    titleHighlightColor: { scope: 'text', token: 'primary' },
    captionColor: { scope: 'text', token: 'primary' },
    dotIndicatorColor: { scope: 'text', token: 'marple:600' },
    continueButtonBackground: { scope: 'button', token: 'marple:500' },
    continueButtonIcon: { scope: 'background', token: 'primarySecondaryBlend' },
    progressBarTrack: { scope: 'track', token: 'primarySecondaryBlend' },
    progressBarFill: { scope: 'button', token: 'marple:500' },
    headerBackIconColor: { scope: 'text', token: 'secondary' },
    taskAgendaBody: {
      taskTitleInput: { scope: 'text', token: 'primary' },
      pencilIcon: { scope: 'text', token: 'primary' },
      suggestionsSectionTitle: { scope: 'text', token: 'primary' },
      suggestionsSectionHeading: ONBOARDING_TASK_AGENDA_SUGGESTIONS_SECTION_TITLE,
      suggestionPillLabels: ONBOARDING_TASK_AGENDA_SUGGESTION_PILLS,
    },
  },
  {
    background: { scope: 'background', token: 'primary' },
    titleColor: { scope: 'text', token: 'primary' },
    titleHighlightColor: { scope: 'text', token: 'primary' },
    captionColor: { scope: 'text', token: 'primary' },
    dotIndicatorColor: { scope: 'text', token: 'marple:600' },
    continueButtonBackground: { scope: 'button', token: 'marple:500' },
    continueButtonIcon: { scope: 'background', token: 'primarySecondaryBlend' },
    progressBarTrack: { scope: 'track', token: 'primarySecondaryBlend' },
    progressBarFill: { scope: 'button', token: 'marple:500' },
    headerBackIconColor: { scope: 'text', token: 'secondary' },
    timeWheelBrandRamp: 'marple',
  },
  {
    background: { scope: 'background', token: 'primary' },
    titleColor: { scope: 'text', token: 'primary' },
    titleHighlightColor: { scope: 'text', token: 'primary' },
    captionColor: { scope: 'text', token: 'primary' },
    dotIndicatorColor: { scope: 'text', token: 'marple:600' },
    continueButtonBackground: { scope: 'button', token: 'marple:500' },
    continueButtonIcon: { scope: 'background', token: 'primarySecondaryBlend' },
    progressBarTrack: { scope: 'track', token: 'primarySecondaryBlend' },
    progressBarFill: { scope: 'button', token: 'marple:500' },
    headerBackIconColor: { scope: 'text', token: 'secondary' },
  },
  {
    background: { scope: 'background', token: 'primary' },
    titleColor: { scope: 'text', token: 'primary' },
    titleHighlightColor: { scope: 'text', token: 'primary' },
    captionColor: { scope: 'text', token: 'primary' },
    dotIndicatorColor: { scope: 'text', token: 'marple:600' },
    continueButtonBackground: { scope: 'button', token: 'marple:500' },
    continueButtonIcon: { scope: 'background', token: 'primarySecondaryBlend' },
    progressBarTrack: { scope: 'track', token: 'primarySecondaryBlend' },
    progressBarFill: { scope: 'button', token: 'marple:500' },
    headerBackIconColor: { scope: 'text', token: 'secondary' },
  },
];

/** habit branch — all steps after the picker use the plant ramp */
export const ONBOARDING_QUESTIONNAIRE_HABIT_BRANCH_SLIDE_UI: readonly OnboardingSlidesSlideUiConfig[] = [
  {
    background: { scope: 'background', token: 'primary' },
    titleColor: { scope: 'text', token: 'primary' },
    titleHighlightColor: { scope: 'text', token: 'primary' },
    captionColor: { scope: 'text', token: 'primary' },
    dotIndicatorColor: { scope: 'text', token: 'marple:600' },
    continueButtonBackground: { scope: 'button', token: 'marple:500' },
    continueButtonIcon: { scope: 'background', token: 'primarySecondaryBlend' },
    progressBarTrack: { scope: 'track', token: 'primarySecondaryBlend' },
    progressBarFill: { scope: 'button', token: 'marple:500' },
    headerBackIconColor: { scope: 'text', token: 'secondary' },
  },
  {
    background: { scope: 'background', token: 'primary' },
    titleColor: { scope: 'text', token: 'primary' },
    titleHighlightColor: { scope: 'text', token: 'primary' },
    captionColor: { scope: 'text', token: 'primary' },
    dotIndicatorColor: { scope: 'text', token: 'marple:600' },
    continueButtonBackground: { scope: 'button', token: 'marple:500' },
    continueButtonIcon: { scope: 'background', token: 'primarySecondaryBlend' },
    progressBarTrack: { scope: 'track', token: 'primarySecondaryBlend' },
    progressBarFill: { scope: 'button', token: 'marple:500' },
    headerBackIconColor: { scope: 'text', token: 'secondary' },
  },
  {
    background: { scope: 'background', token: 'primary' },
    titleColor: { scope: 'text', token: 'primary' },
    titleHighlightColor: { scope: 'text', token: 'primary' },
    captionColor: { scope: 'text', token: 'primary' },
    dotIndicatorColor: { scope: 'text', token: 'marple:600' },
    continueButtonBackground: { scope: 'button', token: 'marple:500' },
    continueButtonIcon: { scope: 'background', token: 'primarySecondaryBlend' },
    progressBarTrack: { scope: 'track', token: 'primarySecondaryBlend' },
    progressBarFill: { scope: 'button', token: 'marple:500' },
    headerBackIconColor: { scope: 'text', token: 'secondary' },
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
