/**
 * dev-only guard — keeps slide ui token rows + text slide lists the same length.
 */

import { INTRO_PAGE_SLIDE_UI } from './slideUiTokens';
import { ONBOARDING_INTRO_PAGE_COUNT } from './textValues';

if (__DEV__ && INTRO_PAGE_SLIDE_UI.length !== ONBOARDING_INTRO_PAGE_COUNT) {
  console.warn(
    '[onboarding] INTRO_PAGE_SLIDE_UI length must match INTRO_PAGE_TITLES — fix introductory/constants/slideUiTokens.ts or textValues.ts',
  );
}
