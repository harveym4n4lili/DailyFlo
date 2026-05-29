/**
 * resolves the user's first navbar tab href — same bootstrap rules as cold start
 * (redux navigation prefs + asyncstorage cache + default order).
 */

import type { Href } from 'expo-router';

import {
  resolveNavTabOrderForBootstrap,
  resolvePrimaryNavTabHref,
} from '@/components/features/settings/navigation/navigationPreferenceUtils';
import type { UserNavigationPreferences } from '@/types/common/User';

import { loadPersistedNavTabOrder } from './navigationTabOrderStorage';

/** expo-router href for the tab the user placed first in navigation settings */
export async function resolvePrimaryTabHomeHref(
  userId?: string | null,
  navPrefs?: UserNavigationPreferences | null,
): Promise<Href> {
  const cachedOrder = await loadPersistedNavTabOrder(userId);
  const order = resolveNavTabOrderForBootstrap(navPrefs, cachedOrder);

  return resolvePrimaryNavTabHref(
    navPrefs?.tabOrder?.length ? navPrefs : { tabOrder: order },
  ) as Href;
}
