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
