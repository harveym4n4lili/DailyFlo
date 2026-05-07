/**
 * questionnaire funnel — headline block sizing (parity with intro) + motion timing.
 */

import { Paddings } from '@/constants/Paddings';

export const ONBOARDING_SLIDES_TITLE_AREA_HEIGHT = 120;

export const ONBOARDING_SLIDES_TITLE_SUBTEXT_GAP = Paddings.touchTarget;

export const ONBOARDING_SLIDES_SUBTEXT_AREA_HEIGHT = 88;

export const ONBOARDING_SLIDES_FIXED_HEADLINE_OVERLAY_HEIGHT =
  ONBOARDING_SLIDES_TITLE_AREA_HEIGHT +
  ONBOARDING_SLIDES_TITLE_SUBTEXT_GAP +
  ONBOARDING_SLIDES_SUBTEXT_AREA_HEIGHT;

/** ms — easing set in OnboardingSlidesProgressBar */
export const ONBOARDING_SLIDES_CONTROL_TRANSITION_MS = 320;
