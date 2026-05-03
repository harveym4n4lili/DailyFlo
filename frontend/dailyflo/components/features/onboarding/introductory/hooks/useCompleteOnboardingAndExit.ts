/**
 * persists onboarding-complete flag then navigates home — root `_layout.tsx` trusts this key.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useState } from 'react';

import { useGuardedRouter } from '@/hooks/useGuardedRouter';

export const ONBOARDING_COMPLETE_STORAGE_KEY = '@DailyFlo:onboardingComplete';

export function useCompleteOnboardingAndExit() {
  const router = useGuardedRouter();
  const [busy, setBusy] = useState(false);

  const completeAndExit = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      await AsyncStorage.setItem(ONBOARDING_COMPLETE_STORAGE_KEY, 'true');
      // intro was pushed as a root modal over today — pop it so the tab stays underneath.
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)/today');
      }
    } finally {
      setBusy(false);
    }
  }, [busy, router]);

  return { completeAndExit, busy };
}
