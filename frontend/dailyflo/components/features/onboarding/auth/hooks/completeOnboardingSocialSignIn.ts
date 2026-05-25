/**
 * shared post-native-sign-in step for google and apple on the auth landing screen.
 *
 * both providers only prove identity to django once; django returns the same DailyFlo JWT pair:
 * - access (~15m) + refresh (~30d) stored in SecureStore inside the `socialAuth` thunk
 * - cold start / 401 recovery uses `refreshStoredSessionTokens()` in `checkAuthStatus` — provider-agnostic
 */

import type { Href } from 'expo-router';

import type { useGuardedRouter } from '@/hooks/useGuardedRouter';
import type { SocialAuthInput } from '@/types/common/User';
import type { AppDispatch } from '@/store';
import { socialAuth } from '@/store/slices/auth/authSlice';

const SLIDES_HREF = '/(onboarding)/slides' as Href;

type GuardedRouter = ReturnType<typeof useGuardedRouter>;

/**
 * dispatch social login (google or apple) then enter onboarding slides.
 * token persistence and refresh behaviour are identical for every `provider` value.
 */
export async function completeOnboardingSocialSignIn(
  dispatch: AppDispatch,
  router: GuardedRouter,
  input: SocialAuthInput,
): Promise<void> {
  await dispatch(socialAuth(input)).unwrap();
  router.push(SLIDES_HREF);
}
