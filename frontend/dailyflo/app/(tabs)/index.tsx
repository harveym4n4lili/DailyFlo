import { Redirect, type Href } from 'expo-router';
import { useEffect, useState } from 'react';

import { useAppSelector } from '@/store';
import type { NavTabKey } from '@/components/features/settings/navigation/navigationTabRegistry';
import {
  resolveNavTabOrderForBootstrap,
  resolvePrimaryNavTabHref,
} from '@/components/features/settings/navigation/navigationPreferenceUtils';
import { loadPersistedNavTabOrder } from '@/utils/navigation/navigationTabOrderStorage';

/** tabs group index — redirect to the user's first navbar tab once auth is hydrated */
export default function TabsIndex() {
  const isLoading = useAppSelector((s) => s.auth.isLoading);
  const navPrefs = useAppSelector((s) => s.auth.user?.preferences?.navigationPreferences);
  const userId = useAppSelector((s) => s.auth.user?.id);
  const [cachedOrder, setCachedOrder] = useState<NavTabKey[] | null>(null);
  const [cacheLoaded, setCacheLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void loadPersistedNavTabOrder(userId).then((order) => {
      if (!cancelled) {
        setCachedOrder(order);
        setCacheLoaded(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (isLoading || !cacheLoaded) {
    return null;
  }

  const order = resolveNavTabOrderForBootstrap(navPrefs, cachedOrder);
  const href = resolvePrimaryNavTabHref(
    navPrefs?.tabOrder?.length ? navPrefs : { tabOrder: order },
  ) as Href;

  return <Redirect href={href} />;
}
