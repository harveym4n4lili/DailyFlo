/**
 * questionnaire funnel — headline title↔caption gap + motion timing.
 *
 * headline block height is **not** reserved here: `OnboardingQuestionnaireHeadlineCrossfade` measures copy with an invisible probe slide so title + caption stack naturally.
 */

import { Paddings } from '@/constants/Paddings';

import { AUTH_GAP_BELOW_HEADER } from '../../auth/constants/pagerLayout';

/**
 * padding under native header before questionnaire titles — shared px with auth landing `AUTH_GAP_BELOW_HEADER`.
 */
export const ONBOARDING_GAP_BELOW_HEADER = AUTH_GAP_BELOW_HEADER;

/** vertical gap between crossfade title and caption — caption still lays out under title via normal flow inside each layer */
export const ONBOARDING_SLIDES_TITLE_SUBTEXT_GAP = Paddings.touchTargetSmall;

/** ms — `OnboardingSlidesProgressBar` + questionnaire step-to-step rgb blends (see `useQuestionnaireBlendProgress`) */
export const ONBOARDING_SLIDES_CONTROL_TRANSITION_MS = 320;

/** corner radius for onboarding task-title preview — one step under 24px grouped cards; uses `Paddings.formDataPillRadius` (20). */
export const ONBOARDING_TASK_TITLE_SURFACE_RADIUS = Paddings.formDataPillRadius;

/** vertical gap between the suggestions intro line and the first chip row (`OnboardingTaskAgendaSuggestionsSection`) */
export const ONBOARDING_TASK_AGENDA_SUGGESTIONS_TITLE_CHIP_GAP = Paddings.touchTargetSmall;

/** vertical gap between the two stacked suggestion chip rows */
export const ONBOARDING_TASK_AGENDA_SUGGESTIONS_ROW_GAP = Paddings.touchTargetSmall;

/**
 * layout height of the questionnaire continue footer (`OnboardingQuestionnaireFlow`).
 * the scroll body ends above this band, so when the keyboard is up only roughly `(keyboardHeight - this)` overlaps the scroll area — not the full keyboard (that over-lifted the task row).
 */
export function getOnboardingQuestionnaireContinueFooterLayoutHeight(
  bottomInset: number,
  options?: { /** agenda step uses `paddingTop: 0` on the green footer */ flushFooterTop?: boolean },
): number {
  const topPad = options?.flushFooterTop ? 0 : Paddings.touchTarget;
  const buttonOuterHeight =
    Paddings.liquidGlassBleed * 2 +
    (Paddings.onboardingContinueButtonPaddingVertical * 2 +
      Paddings.onboardingContinueButtonHitSlop * 2);
  return topPad + buttonOuterHeight + Math.max(bottomInset, Paddings.screen);
}

/**
 * Maps `useAnimatedKeyboard().height` from 0 → this value → tail offset goes from 0 → final offset constants, so tweaks **ease with the keyboard** (agenda body + green continue footer share this curve).
 * If a blended offset never reaches full strength at full keyboard, lower this toward the device’s typical full `keyboard.height` (~300–340 portrait).
 */
export const ONBOARDING_TASK_AGENDA_KEYBOARD_FINAL_Y_BLEND_REFERENCE_HEIGHT_PX = 336;

/**
 * End value of the keyboard-blended tweak on the **agenda** stack (`translateY` in `OnboardingSlideSampleContent`).
 * **Increase** → block ends **lower** when the keyboard is up. **Decrease** or negative → **higher**. At `keyboard.height` 0 the blend is **0**.
 */
export const ONBOARDING_TASK_AGENDA_KEYBOARD_FINAL_Y_OFFSET_PX = 64;

/**
 * End value of the keyboard-blended tweak on the **green continue footer** (`OnboardingQuestionnaireFlow`); same `interpolate` pattern and blend reference as the agenda row.
 * **Increase** → footer rides **lower** when the keyboard is up (closer to keys). **Decrease** or negative → **higher**.
 */
export const ONBOARDING_CONTINUE_FOOTER_KEYBOARD_FINAL_Y_OFFSET_PX = Paddings.screen;
