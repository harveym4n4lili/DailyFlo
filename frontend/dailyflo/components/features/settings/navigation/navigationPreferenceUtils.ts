import type { UserNavigationPreferences } from '@/types/common/User';

import {
  DEFAULT_NAV_TAB_ORDER,
  NAV_TAB_REGISTRY,
  PINNED_NAV_TAB,
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

