/**
 * tracks the one-time cold-start bootstrap in `app/_layout.tsx`.
 * `AuthSessionGate` skips duplicate `checkAuthStatus` until this finishes so
 * google / apple / email sessions don't double-refresh and blacklist the refresh token.
 */

let bootstrapComplete = false;

export function markAuthBootstrapComplete(): void {
  bootstrapComplete = true;
}

export function isAuthBootstrapComplete(): boolean {
  return bootstrapComplete;
}

export function resetAuthBootstrapStateForTests(): void {
  bootstrapComplete = false;
}
