/**
 * local cache for navbar tab order — used on cold start before redux/API prefs hydrate.
 * expo NativeTabs picks the first trigger as the initial tab, so we persist order after save/login.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  DEFAULT_NAV_TAB_ORDER,
  type NavTabKey,
} from '@/components/features/settings/navigation/navigationTabRegistry';
import { normalizeNavTabOrder, resolveNavTabOrderFromPreferences } from '@/components/features/settings/navigation/navigationPreferenceUtils';
import type { UserNavigationPreferences } from '@/types/common/User';

/** last-known order for any signed-in user — read before profile id is available */
const NAV_TAB_ORDER_LAST_KEY = '@dailyflo/navigation_tab_order/last';

const userNavTabOrderKey = (userId: string) =>
  `@dailyflo/navigation_tab_order/user/${userId}`;

function parseStoredOrder(raw: string | null): NavTabKey[] | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    const normalized = normalizeNavTabOrder(parsed as NavTabKey[]);
    return normalized.length > 0 ? normalized : null;
  } catch {
    return null;
  }
}

/** write tab order after login or navigation settings save */
export async function persistNavTabOrder(
  order: NavTabKey[],
  userId?: string | null,
): Promise<void> {
  const normalized = normalizeNavTabOrder(order);
  const json = JSON.stringify(normalized);
  if (userId) {
    await AsyncStorage.setItem(userNavTabOrderKey(userId), json);
  }
  // legacy mirror — not read when a user id is known (avoids leaking order across accounts)
  await AsyncStorage.setItem(NAV_TAB_ORDER_LAST_KEY, json);
}

/** cache navbar order from django profile prefs — call on every successful auth/session restore */
export async function persistNavTabOrderForUser(user: {
  id: string;
  preferences?: { navigationPreferences?: UserNavigationPreferences | null };
}): Promise<void> {
  const tabOrder = resolveNavTabOrderFromPreferences(user.preferences?.navigationPreferences);
  await persistNavTabOrder(tabOrder, user.id);
}

/** read cached order — per-user only when id is known; never fall back to another account's last order */
export async function loadPersistedNavTabOrder(
  userId?: string | null,
): Promise<NavTabKey[] | null> {
  if (userId) {
    return parseStoredOrder(await AsyncStorage.getItem(userNavTabOrderKey(userId)));
  }
  return parseStoredOrder(await AsyncStorage.getItem(NAV_TAB_ORDER_LAST_KEY));
}

/** safe fallback when nothing is cached yet */
export function defaultNavTabOrder(): NavTabKey[] {
  return [...DEFAULT_NAV_TAB_ORDER];
}
