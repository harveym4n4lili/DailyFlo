/**
 * auth landing — literal copy only (`AuthLandingPage`); colors → `slideUiTokens`, faces → `typography.ts`.
 * horizontal: only `OnboardingAuthShell` pads the route; do not add a second gutter on `AuthLandingPage`.
 */

/** leading satoshi hit */
export const AUTH_LANDING_SLOGAN_LEAD = 'Flow';

/** first span of the middle line — shares the lead wrap with **Flow** */
export const AUTH_LANDING_SLOGAN_MIDDLE_LEAD = ' through what ';

/** second span of the middle line — same row as **to you.** + wordmark */
export const AUTH_LANDING_SLOGAN_MIDDLE_BEFORE_TAIL = 'matters, ';

/** @deprecated for layout — use `MIDDLE_LEAD` + `MIDDLE_BEFORE_TAIL`; kept for search/copy tooling */
export const AUTH_LANDING_SLOGAN_MIDDLE = AUTH_LANDING_SLOGAN_MIDDLE_LEAD + AUTH_LANDING_SLOGAN_MIDDLE_BEFORE_TAIL;

/** trailing satoshi hit */
export const AUTH_LANDING_SLOGAN_TAIL = 'to you.';

/** primary auth CTAs — labels only until handlers wire to `services/auth` */
export const AUTH_LANDING_CONTINUE_WITH_EMAIL_LABEL = 'Continue with email';
export const AUTH_LANDING_CONTINUE_WITH_APPLE_LABEL = 'Continue with Apple';
export const AUTH_LANDING_CONTINUE_WITH_GOOGLE_LABEL = 'Continue with Google';

/** dev-only footer link — skips OAuth (`__DEV__`); shown under social rows */
export const AUTH_LANDING_DEV_CONTINUE_WITHOUT_SIGN_IN_LABEL =
  'Continue without sign-in for dev mode';
