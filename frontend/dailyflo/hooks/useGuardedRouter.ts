import { useMemo } from 'react';
import { useRouter, type Href, type Router } from 'expo-router';

import { runIfNotDuplicateNavigation } from '@/utils/navigationDedupe';

/**
 * same api as useRouter from expo-router, but push / navigate / replace / dismissTo ignore a second
 * identical href within a short window (see navigationDedupe.ts) so fast double taps don’t stack duplicates.
 */
export function useGuardedRouter(): Router {
  const router = useRouter();
  return useMemo(
    () => ({
      ...router,
      push: (href: Href, options?: Parameters<Router['push']>[1]) => {
        runIfNotDuplicateNavigation(href, () => router.push(href, options));
      },
      navigate: (href: Href, options?: Parameters<Router['navigate']>[1]) => {
        runIfNotDuplicateNavigation(href, () => router.navigate(href, options));
      },
      replace: (href: Href, options?: Parameters<Router['replace']>[1]) => {
        runIfNotDuplicateNavigation(href, () => router.replace(href, options));
      },
      dismissTo: (href: Href, options?: Parameters<Router['dismissTo']>[1]) => {
        runIfNotDuplicateNavigation(href, () => router.dismissTo(href, options));
      },
    }),
    [router]
  );
}
