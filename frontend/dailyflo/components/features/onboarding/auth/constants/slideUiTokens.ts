/**
 * auth landing — all colors for the single auth screen (background, CTA, slogan + wordmark tints).
 * copy: `textValues.ts` — typography: `typography.ts`
 */

import type { AuthSlideUiConfig } from './types';

/** canonical row — re-used as the only entry in `AUTH_PAGE_SLIDE_UI` */
export const AUTH_LANDING_SLIDE_UI: AuthSlideUiConfig = {
  background: 'primary',
  continueButtonBackground: 'marple:500',
  sloganEmphasisColor: 'marple:500',
  sloganMiddleColor: 'primary',
  wordmarkMarkColor: 'marple:500',
};

export const AUTH_PAGE_SLIDE_UI: readonly AuthSlideUiConfig[] = [AUTH_LANDING_SLIDE_UI];
