/**
 * local cache for navbar tab order — used on cold start before redux/API prefs hydrate.
 * expo NativeTabs picks the first trigger as the initial tab, so we persist order after save/login.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  DEFAULT_NAV_TAB_ORDER,
  type NavTabKey,
} from '@/components/features/settings/navigation/navigationTabRegistry';
import { normalizeNavTabOrder } from '@/components/features/settings/navigation/navigationPreferenceUtils';

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
  await AsyncStorage.setItem(NAV_TAB_ORDER_LAST_KEY, json);
  if (userId) {
    await AsyncStorage.setItem(userNavTabOrderKey(userId), json);
  }
}

/** read cached order — prefer per-user key when id is known */
export async function loadPersistedNavTabOrder(
  userId?: string | null,
): Promise<NavTabKey[] | null> {
  if (userId) {
    const forUser = parseStoredOrder(await AsyncStorage.getItem(userNavTabOrderKey(userId)));
    if (forUser) return forUser;
  }
  return parseStoredOrder(await AsyncStorage.getItem(NAV_TAB_ORDER_LAST_KEY));
}

/** safe fallback when nothing is cached yet */
export function defaultNavTabOrder(): NavTabKey[] {
  return [...DEFAULT_NAV_TAB_ORDER];
}
