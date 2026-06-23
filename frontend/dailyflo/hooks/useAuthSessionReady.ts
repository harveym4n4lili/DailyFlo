import { useAppSelector } from '@/store';

/**
 * true after cold-start `checkAuthStatus` finishes and the user has a restored session.
 * gate protected fetches (habits, tasks, …) so they don't race token refresh on reopen —
 * works the same for google, apple, and email (all tokens live in SecureStore).
 */
export function useAuthSessionReady(): boolean {
  const authLoading = useAppSelector((state) => state.auth.isLoading);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  return !authLoading && isAuthenticated;
}
