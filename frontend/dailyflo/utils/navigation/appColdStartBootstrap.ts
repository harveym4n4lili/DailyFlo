/**
 * cold-start bootstrap run once before the root Stack mounts.
 * resolves navbar tab order from API + AsyncStorage so NativeTabs can use the correct first trigger.
 */

import { store } from '@/store';
import { checkAuthStatus, logout } from '@/store/slices/auth/authSlice';
import { fetchLists } from '@/store/slices/lists/listsSlice';
import { fetchTasks } from '@/store/slices/tasks/tasksSlice';
import { resolveNavTabOrderForBootstrap } from '@/components/features/settings/navigation/navigationPreferenceUtils';
import type { NavTabKey } from '@/components/features/settings/navigation/navigationTabRegistry';
import {
  getDeviceOnboardingComplete,
  hasUserEverCompletedOnboarding,
} from '@/utils/onboarding/onboardingUserStatus';
import {
  loadPersistedNavTabOrder,
  persistNavTabOrder,
} from '@/utils/navigation/navigationTabOrderStorage';

export type AppColdStartBootstrapResult = {
  navTabOrder: NavTabKey[];
  needsOnboarding: boolean;
};

export async function runAppColdStartBootstrap(): Promise<AppColdStartBootstrapResult> {
  const onboardingComplete = await getDeviceOnboardingComplete();
  const cachedNavTabOrder = await loadPersistedNavTabOrder();

  await store.dispatch(checkAuthStatus());

  let authState = store.getState().auth;
  const userId = authState.user?.id ?? null;
  const cachedForUser = userId
    ? ((await loadPersistedNavTabOrder(userId)) ?? cachedNavTabOrder)
    : cachedNavTabOrder;

  const accountFinishedOnboardingBefore =
    authState.user != null && (await hasUserEverCompletedOnboarding(authState.user));
  if (!onboardingComplete && authState.isAuthenticated && !accountFinishedOnboardingBefore) {
    store.dispatch(logout());
    authState = store.getState().auth;
  }

  if (authState.isAuthenticated) {
    const { tasks, lists } = store.getState();
    if (tasks.lastFetched === null) {
      void store.dispatch(fetchTasks());
    }
    if (lists.lastFetched === null) {
      void store.dispatch(fetchLists());
    }
  }

  const navTabOrder = resolveNavTabOrderForBootstrap(
    authState.user?.preferences?.navigationPreferences,
    cachedForUser,
  );

  if (authState.isAuthenticated) {
    void persistNavTabOrder(navTabOrder, userId);
  }

  const needsOnboarding = !onboardingComplete || !authState.isAuthenticated;

  return { navTabOrder, needsOnboarding };
}
