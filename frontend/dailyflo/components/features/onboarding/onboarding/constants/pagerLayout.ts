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
