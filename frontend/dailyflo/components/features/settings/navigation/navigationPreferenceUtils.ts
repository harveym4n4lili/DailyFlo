import type { UserNavigationPreferences } from '@/types/common/User';

import {
  DEFAULT_NAV_TAB_ORDER,
  NAV_TAB_REGISTRY,
  PINNED_NAV_TAB,
  resolveNavTabHref,
  type NavTabKey,
} from './navigationTabRegistry';

const ALL_NAV_TAB_KEYS = Object.keys(NAV_TAB_REGISTRY) as NavTabKey[];

/** compare two tab orders */
export function navTabOrdersEqual(a: NavTabKey[], b: NavTabKey[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((key, index) => key === b[index]);
}

/**
 * normalize saved or draft order:
 * - drop unknown keys
 * - dedupe
 * - ensure browse is present exactly once (user can place it anywhere)
 */
export function normalizeNavTabOrder(order: NavTabKey[]): NavTabKey[] {
  const seen = new Set<NavTabKey>();
  const normalized: NavTabKey[] = [];
  let hasBrowse = false;

  for (const key of order) {
    if (!ALL_NAV_TAB_KEYS.includes(key) || seen.has(key)) continue;
    seen.add(key);
    normalized.push(key);
    if (key === PINNED_NAV_TAB) hasBrowse = true;
  }

  if (!hasBrowse) {
    normalized.push(PINNED_NAV_TAB);
  }

  return normalized;
}

/** read django/redux prefs into a safe navbar order array */
export function resolveNavTabOrderFromPreferences(
  prefs?: UserNavigationPreferences | null
): NavTabKey[] {
  const saved = prefs?.tabOrder;
  if (!saved?.length) return [...DEFAULT_NAV_TAB_ORDER];
  return normalizeNavTabOrder(saved);
}

/** merge server prefs with per-user asyncstorage cache for cold-start bootstrap */
export function resolveNavTabOrderForBootstrap(
  prefs?: UserNavigationPreferences | null,
  cachedOrder?: NavTabKey[] | null,
): NavTabKey[] {
  if (prefs?.tabOrder?.length) return resolveNavTabOrderFromPreferences(prefs);
  // cachedOrder must come from loadPersistedNavTabOrder(userId) — never another account's order
  if (cachedOrder?.length) return normalizeNavTabOrder(cachedOrder);
  return [...DEFAULT_NAV_TAB_ORDER];
}

/** first tab in the user's navbar — used for cold-start bootstrap when Today may be absent */
export function resolvePrimaryNavTabKey(
  prefs?: UserNavigationPreferences | null
): NavTabKey {
  const order = resolveNavTabOrderFromPreferences(prefs);
  return order[0] ?? DEFAULT_NAV_TAB_ORDER[0];
}

/** expo-router href for the user's primary navbar tab */
export function resolvePrimaryNavTabHref(
  prefs?: UserNavigationPreferences | null
): string {
  return resolveNavTabHref(resolvePrimaryNavTabKey(prefs));
}

