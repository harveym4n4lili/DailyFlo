/**
 * dev-only guard — auth landing stays a single slide row.
 */

import { AUTH_PAGE_SLIDE_UI } from './slideUiTokens';

if (__DEV__ && AUTH_PAGE_SLIDE_UI.length !== 1) {
  console.warn(
    '[onboarding] AUTH_PAGE_SLIDE_UI must contain exactly one row — fix auth/constants/slideUiTokens.ts',
  );
}
