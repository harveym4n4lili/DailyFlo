/**
 * questionnaire funnel — headline title↔caption gap + motion timing.
 *
 * headline block height is **not** reserved here: `OnboardingQuestionnaireHeadlineCrossfade` measures copy with an invisible probe slide so title + caption stack naturally.
 */

import { Paddings } from '@/constants/Paddings';

import { INTRO_GAP_BELOW_HEADER } from '../../introductory/constants/pagerLayout';

/**
 * padding under native header before questionnaire titles — same value as intro `INTRO_GAP_BELOW_HEADER`
 * (defined once in introductory `pagerLayout.ts` so both funnels stay aligned).
 */
export const ONBOARDING_GAP_BELOW_HEADER = INTRO_GAP_BELOW_HEADER;

/** vertical gap between crossfade title and caption — caption still lays out under title via normal flow inside each layer */
export const ONBOARDING_SLIDES_TITLE_SUBTEXT_GAP = Paddings.touchTargetSmall;

/** ms — `OnboardingSlidesProgressBar` + questionnaire step-to-step rgb blends (see `useQuestionnaireBlendProgress`) */
export const ONBOARDING_SLIDES_CONTROL_TRANSITION_MS = 320;
