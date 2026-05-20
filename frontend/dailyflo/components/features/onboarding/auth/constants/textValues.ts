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

/** primary auth CTAs on the landing screen */
export const AUTH_LANDING_CONTINUE_WITH_EMAIL_LABEL = 'Continue with email';
export const AUTH_LANDING_CONTINUE_WITH_APPLE_LABEL = 'Continue with Apple';
export const AUTH_LANDING_CONTINUE_WITH_GOOGLE_LABEL = 'Continue with Google';

/** email method menu (recurrence-pill style) — navigates to onboarding auth sheets */
export const AUTH_EMAIL_LOGIN_OPTION_LABEL = 'Login with email';
export const AUTH_EMAIL_SIGN_UP_OPTION_LABEL = 'Sign up with email';

/** onboarding email form sheets — titles + primary ctas */
export const AUTH_EMAIL_LOGIN_SHEET_TITLE = 'Log in';
export const AUTH_EMAIL_REGISTER_SHEET_TITLE = 'Sign up';
export const AUTH_EMAIL_FORM_EMAIL_PLACEHOLDER = 'Email';
export const AUTH_EMAIL_FORM_PASSWORD_PLACEHOLDER = 'Password';
export const AUTH_EMAIL_FORM_FIRST_NAME_PLACEHOLDER = 'First name';
export const AUTH_EMAIL_FORM_LAST_NAME_PLACEHOLDER = 'Last name';
export const AUTH_EMAIL_LOGIN_SUBMIT_LABEL = 'Log in';
export const AUTH_EMAIL_REGISTER_SUBMIT_LABEL = 'Create account';
export const AUTH_EMAIL_SHEET_CANCEL_LABEL = 'Cancel';

/** dev-only footer link — skips OAuth (`__DEV__`); shown under social rows */
export const AUTH_LANDING_DEV_CONTINUE_WITHOUT_SIGN_IN_LABEL =
  'Continue without sign-in for dev mode';
