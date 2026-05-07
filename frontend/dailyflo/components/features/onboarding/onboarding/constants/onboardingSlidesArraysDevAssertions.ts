/**
 * dev guards — token rows + captions stay aligned with title-derived page count.
 */

import { ONBOARDING_SLIDES_PAGE_CAPTIONS, ONBOARDING_SLIDES_PAGE_COUNT } from './textValues';
import { ONBOARDING_SLIDES_PAGE_SLIDE_UI } from './slideUiTokens';

if (__DEV__ && ONBOARDING_SLIDES_PAGE_SLIDE_UI.length !== ONBOARDING_SLIDES_PAGE_COUNT) {
  console.warn(
    '[onboarding] ONBOARDING_SLIDES_PAGE_SLIDE_UI length must match ONBOARDING_SLIDES_PAGE_TITLES — fix onboarding/constants/slideUiTokens.ts or textValues.ts',
  );
}

if (__DEV__ && ONBOARDING_SLIDES_PAGE_CAPTIONS.length !== ONBOARDING_SLIDES_PAGE_COUNT) {
  console.warn(
    '[onboarding] ONBOARDING_SLIDES_PAGE_CAPTIONS length must match ONBOARDING_SLIDES_PAGE_TITLES — fix onboarding/constants/textValues.ts',
  );
}

if (__DEV__ && ONBOARDING_SLIDES_PAGE_COUNT < 1) {
  console.warn('[onboarding] ONBOARDING_SLIDES_PAGE_COUNT must be >= 1');
}
