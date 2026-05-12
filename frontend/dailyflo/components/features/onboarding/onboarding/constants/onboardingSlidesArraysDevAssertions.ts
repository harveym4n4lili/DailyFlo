/**
 * dev guards — token rows + captions stay aligned with title-derived page count.
 */

import { ONBOARDING_SLIDES_PAGE_SLIDE_UI } from './slideUiTokens';
import {
  ONBOARDING_QUESTIONNAIRE_SLEEP_STEP_INDEX,
  ONBOARDING_QUESTIONNAIRE_WAKE_STEP_INDEX,
  ONBOARDING_SLIDES_PAGE_CAPTIONS,
  ONBOARDING_SLIDES_PAGE_COUNT,
} from './textValues';

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

if (__DEV__) {
  for (const idx of [ONBOARDING_QUESTIONNAIRE_WAKE_STEP_INDEX, ONBOARDING_QUESTIONNAIRE_SLEEP_STEP_INDEX]) {
    if (!ONBOARDING_SLIDES_PAGE_SLIDE_UI[idx]?.timeWheelBrandRamp) {
      console.warn(
        `[onboarding] slide index ${idx} should set timeWheelBrandRamp in slideUiTokens.ts (wake/sleep time wheels).`,
      );
    }
  }
}
