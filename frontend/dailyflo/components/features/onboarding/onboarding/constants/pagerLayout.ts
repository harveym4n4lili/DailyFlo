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

/** hairline ring on suggestion chips only — same weight as quick-add pills (`QuickAddLabelOnlyPill`); task title row has no stroke */
export const ONBOARDING_TASK_AGENDA_SURFACE_BORDER_WIDTH = 1.25;

/** ms — suggestion chip border + sparkles crossfade when a chip matches the live title (`OnboardingTaskAgendaSuggestionRow`) */
export const ONBOARDING_TASK_AGENDA_SUGGESTION_SELECT_ANIM_MS = 260;

/**
 * horizontal inset for the agenda step inner column (`agendaScrollInnerScreenPad` in `OnboardingSampleSlidePage`).
 * must match `OnboardingSlidesShell`’s default `paddingHorizontal` (`Paddings.screen + Paddings.touchTarget`) so headline + task row align with other questionnaire steps when the shell sets `omitHorizontalPadding`.
 * the horizontal suggestion rows’ `ScrollView`(s) use negative margin of this amount to reach screen edges while `contentContainerStyle` pads by this amount so the first chip lines up with the task row and headline.
 */
export const ONBOARDING_TASK_AGENDA_INNER_HORIZONTAL_PAD = Paddings.screen + Paddings.touchTargetSmall + 4;

/** vertical gap between the suggestions section title (“Here are some suggestions:”) and the first chip row */
export const ONBOARDING_TASK_AGENDA_SUGGESTIONS_TITLE_CHIP_GAP = Paddings.screen + Paddings.touchTarget;

/** vertical gap between the two sideways chip rows — slightly tighter than title→row (`screen + touchTargetSmall` vs `screen + touchTarget`) */
export const ONBOARDING_TASK_AGENDA_SUGGESTIONS_INTER_ROW_GAP = Paddings.screen + Paddings.touchTargetSmall;

/** horizontal gap between suggestion chips inside each sideways row */
export const ONBOARDING_TASK_AGENDA_SUGGESTIONS_ROW_GAP = Paddings.formDataPillRowGap;

/** vertical gap between the task title row surface and the suggestions block — extra room so the two sections don’t feel stacked */
export const ONBOARDING_TASK_AGENDA_TASK_TO_SUGGESTIONS_GAP =
  Paddings.screen * 2 + Paddings.touchTarget + Paddings.touchTargetSmall;

/** vertical gap reserved in **layout math** (replace-slot `minHeight`) between chip band and wheel band — keeps column height stable with `flex-end` shell */
export const ONBOARDING_TASK_AGENDA_SUGGESTIONS_TO_TIME_WHEEL_GAP =
  Paddings.screen * 2 + Paddings.touchTargetSmall;

/**
 * padding above the native spinner in the wheel layer — kept small; extra lift uses `ONBOARDING_TASK_AGENDA_TIME_WHEEL_NUDGE_UP_PX` so replace-slot `minHeight` (task row via `flex-end`) stays unchanged.
 */
export const ONBOARDING_TASK_AGENDA_TIME_WHEEL_SPINNER_TOP_INSET_PX = Paddings.touchTargetSmall;

/**
 * raises the time wheel inside the replace slot (`translateY: -n`) — does not change slot `minHeight`, so the task row baseline stays the same.
 */
export const ONBOARDING_TASK_AGENDA_TIME_WHEEL_NUDGE_UP_PX = Paddings.screen * 5 + Paddings.touchTargetSmall;

/**
 * light padding under the time wheel inside the wota/awt replace slot — keep modest so the picker doesn’t read pinned to the footer (`paddingBottom` on the wheel layer).
 */
export const ONBOARDING_TASK_AGENDA_TIME_WHEEL_SECTION_BOTTOM_PADDING = Paddings.screen;

/**
 * min height for the wota↔awt replace slot (absolute chip + wheel layers).
 * `taskAgendaBodyShell` uses `justifyContent: 'flex-end'`, so an oversized `minHeight` inflates the whole column and pushes the **task row + suggestions upward**. keep this at the tighter of: ~natural suggestion block height, vs wheel + wheel-layer padding.
 */
export const ONBOARDING_TASK_WOTA_AWT_REPLACE_SLOT_MIN_HEIGHT_PX = Math.max(
  Paddings.screen +
    Paddings.touchTargetSmall +
    ONBOARDING_TASK_AGENDA_SUGGESTIONS_TITLE_CHIP_GAP +
    ONBOARDING_TASK_AGENDA_SUGGESTIONS_INTER_ROW_GAP * 5 +
    ONBOARDING_TASK_AGENDA_SUGGESTIONS_INTER_ROW_GAP,
  ONBOARDING_TASK_AGENDA_SUGGESTIONS_TO_TIME_WHEEL_GAP +
    ONBOARDING_TASK_AGENDA_TIME_WHEEL_SECTION_BOTTOM_PADDING +
    204,
);

/**
 * padding under the last sideways chip row before the scroll viewport / continue footer — same px as `ONBOARDING_TASK_AGENDA_SUGGESTIONS_INTER_ROW_GAP`
 * so the gutter row2→continue matches the gutter between the two horizontal `ScrollView` rows.
 */
export const ONBOARDING_TASK_AGENDA_SUGGESTIONS_BASE_BOTTOM_GAP = ONBOARDING_TASK_AGENDA_SUGGESTIONS_INTER_ROW_GAP;

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
export const ONBOARDING_TASK_AGENDA_KEYBOARD_FINAL_Y_OFFSET_PX = 180;

/**
 * End value of the keyboard-blended tweak on the **green continue footer** (`OnboardingQuestionnaireFlow`); same `interpolate` pattern and blend reference as the agenda row.
 * **Increase** → footer rides **lower** when the keyboard is up (closer to keys). **Decrease** or negative → **higher**.
 */
export const ONBOARDING_CONTINUE_FOOTER_KEYBOARD_FINAL_Y_OFFSET_PX = Paddings.screen;

/**
 * after WOTA → AWT: extra `translateY` (negative = up) on the task title row while suggestions fade out.
 * tune for headline / time wheel clearance — pairs with the WOTA→AWT `blendProgress` sub-step inside `OnboardingSlideSampleContent`.
 */
export const ONBOARDING_TASK_WOTA_TO_TIME_ROW_LIFT_PX = 100;
