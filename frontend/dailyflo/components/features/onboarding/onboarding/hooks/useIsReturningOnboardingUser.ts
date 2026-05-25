/**
 * after sign-in, decides if this account is returning (existing) vs brand-new.
 * returning users see Skip in the questionnaire header next to the progress bar.
 *
 * primary signal: django social auth `is_new_user` stored in redux as `auth.onboardingIsNewAccount`.
 * fallbacks: per-user / server onboarding_completed flags, or account age on session restore.
 */

import { useEffect, useState } from 'react';

import { useAppSelector } from '@/store';
import {
  isReturningOnboardingUser,
  isReturningOnboardingUserSync,
} from '@/utils/onboarding/onboardingUserStatus';

export function useIsReturningOnboardingUser(): boolean {
  const user = useAppSelector((state) => state.auth.user);
  const onboardingIsNewAccount = useAppSelector((state) => state.auth.onboardingIsNewAccount);
  const [returning, setReturning] = useState(() =>
    isReturningOnboardingUserSync(user, onboardingIsNewAccount),
  );

  useEffect(() => {
    setReturning(isReturningOnboardingUserSync(user, onboardingIsNewAccount));
    let cancelled = false;
    void (async () => {
      const value = await isReturningOnboardingUser(user, onboardingIsNewAccount);
      if (!cancelled) setReturning(value);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, onboardingIsNewAccount, user?.id, user?.preferences?.onboardingCompleted]);

  return returning;
}
