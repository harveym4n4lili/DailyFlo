/**
 * true while onboarding modal routes are open or the signed-in user has not finished
 * the device onboarding funnel — tab cold-start redirect must wait until this is false.
 */

import { useEffect, useState } from 'react';
import { usePathname, useSegments } from 'expo-router';

import { useAppSelector } from '@/store';
import { getDeviceOnboardingComplete } from '@/utils/onboarding/onboardingUserStatus';

function isOnboardingRoute(pathname: string, segments: readonly string[]): boolean {
  // pathname is usually `/onboarding/...` — route groups are omitted from the string
  if (pathname.includes('/onboarding')) return true;
  return segments.some((s) => s === '(onboarding)' || s === 'onboarding');
}

export function useOnboardingBlocksTabReveal(): boolean {
  const pathname = usePathname() ?? '';
  const segments = useSegments();
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const [deviceOnboardingComplete, setDeviceOnboardingComplete] = useState<boolean | null>(null);

  useEffect(() => {
    void getDeviceOnboardingComplete().then(setDeviceOnboardingComplete);
  }, [pathname, isAuthenticated]);

  const inOnboardingRoute = isOnboardingRoute(pathname, segments);

  // treat null as incomplete while signed in — avoids a race where auth flips true before
  // AsyncStorage resolves and cold-start navigation pushes tabs over the onboarding modal
  const onboardingIncompleteOnDevice =
    isAuthenticated && deviceOnboardingComplete !== true;

  return inOnboardingRoute || onboardingIncompleteOnDevice;
}
