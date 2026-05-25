/**
 * questionnaire funnel — optional header skip action tokens + progress chrome sizing (`OnboardingSlidesHeaderChrome.skip`).
 */

import { Paddings } from '@/constants/Paddings';

export const ONBOARDING_SLIDES_SKIP_BUTTON_HIT_SLOP = {
  top: Paddings.listItemVertical,
  bottom: Paddings.listItemVertical,
  left: Paddings.listItemVertical,
  right: Paddings.touchTarget,
} as const;

export const ONBOARDING_SLIDES_SKIP_BUTTON_ACCESSIBILITY_LABEL = 'Skip onboarding';

export const ONBOARDING_SLIDES_SKIP_BUTTON_LABEL = 'Skip';

/**
 * mirrors intro overlay skip geometry — kept for parity / alternate placements if `skip` is passed again.
 */
export const ONBOARDING_SLIDES_SKIP_BUTTON_ABSOLUTE_LAYOUT = {
  offsetRight: Paddings.screenSmall,
  zIndex: 3,
  topInsetPlus: Paddings.groupedListHeaderContentGap,
} as const;

/** dp — OnboardingSlidesProgressBar uses half for pill radius */
export const ONBOARDING_SLIDES_PROGRESS_BAR_HEIGHT = 10;
