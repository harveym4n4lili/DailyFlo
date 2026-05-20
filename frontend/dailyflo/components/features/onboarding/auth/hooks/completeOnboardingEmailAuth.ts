/**
 * after loginUser or registerUser succeeds, peel the login/register sheet then push questionnaire slides
 * — same slides destination as oauth paths, but stacked modals won't dismiss unless we `back()` first.
 */

import type { Href } from 'expo-router';
import { InteractionManager } from 'react-native';

import type { useGuardedRouter } from '@/hooks/useGuardedRouter';

const SLIDES_HREF = '/(onboarding)/slides' as Href;

type GuardedRouter = ReturnType<typeof useGuardedRouter>;

/** push questionnaire — called from onboarding email sheets after redux thunk stores DailyFlo JWTs */
export function completeOnboardingEmailAuth(router: GuardedRouter): void {
  // pops the nested auth formSheet/modal (`login` or `register`) so we aren't showing slides on top of a stale sheet route
  if (typeof router.canGoBack === 'function' && router.canGoBack()) {
    router.back();
  }
  // defer `push` past the native pop animation so the onboarding stack settles (same sequencing idea as browse settings → logout thunk)
  InteractionManager.runAfterInteractions(() => {
    router.push(SLIDES_HREF);
  });
}
