/**
 * questionnaire funnel — headline block sizing (parity with intro) + motion timing.
 */

import { Paddings } from '@/constants/Paddings';

/** reserves room for ~2 lines of `heading-1` during crossfade — matches intro `INTRO_TITLE_AREA_HEIGHT` (150 was excess empty space above caption) */
export const ONBOARDING_SLIDES_TITLE_AREA_HEIGHT = 120;

export const ONBOARDING_SLIDES_TITLE_SUBTEXT_GAP = Paddings.touchTargetSmall;

export const ONBOARDING_SLIDES_SUBTEXT_AREA_HEIGHT = 88;

export const ONBOARDING_SLIDES_FIXED_HEADLINE_OVERLAY_HEIGHT =
  ONBOARDING_SLIDES_TITLE_AREA_HEIGHT +
  ONBOARDING_SLIDES_TITLE_SUBTEXT_GAP +
  ONBOARDING_SLIDES_SUBTEXT_AREA_HEIGHT;

/** ms — `OnboardingSlidesProgressBar` + questionnaire step-to-step rgb blends (see `useQuestionnaireBlendProgress`) */
export const ONBOARDING_SLIDES_CONTROL_TRANSITION_MS = 320;
