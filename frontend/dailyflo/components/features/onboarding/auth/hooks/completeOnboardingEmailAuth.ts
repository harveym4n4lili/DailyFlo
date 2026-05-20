/**
 * after loginUser or registerUser succeeds, send the user to the questionnaire slides (same destination as google/apple onboarding).
 */

import type { Href } from 'expo-router';

import type { useGuardedRouter } from '@/hooks/useGuardedRouter';

const SLIDES_HREF = '/(onboarding)/slides' as Href;

type GuardedRouter = ReturnType<typeof useGuardedRouter>;

/** push questionnaire — called from onboarding email sheets after redux thunk stores DailyFlo JWTs */
export function completeOnboardingEmailAuth(router: GuardedRouter): void {
  router.push(SLIDES_HREF);
}
