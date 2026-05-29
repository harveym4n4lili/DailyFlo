import type { UserNavigationPreferences } from '@/types/common/User';

import {
  DEFAULT_NAV_TAB_ORDER,
  NAV_TAB_REGISTRY,
  PINNED_NAV_TAB,
  type NavTabKey,
} from './navigationTabRegistry';

const ALL_NAV_TAB_KEYS = Object.keys(NAV_TAB_REGISTRY) as NavTabKey[];

/** compare two tab orders — ignores duplicate browse entries when comparing */
export function navTabOrdersEqual(a: NavTabKey[], b: NavTabKey[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((key, index) => key === b[index]);
}

/**
 * normalize saved or draft order:
 * - drop unknown keys
 * - dedupe
 * - ensure browse is present exactly once at the end
 */
export function normalizeNavTabOrder(order: NavTabKey[]): NavTabKey[] {
  const seen = new Set<NavTabKey>();
  const withoutBrowse: NavTabKey[] = [];

  for (const key of order) {
    if (!ALL_NAV_TAB_KEYS.includes(key) || key === PINNED_NAV_TAB || seen.has(key)) continue;
    seen.add(key);
    withoutBrowse.push(key);
  }

  return [...withoutBrowse, PINNED_NAV_TAB];
}

/** read django/redux prefs into a safe navbar order array */
export function resolveNavTabOrderFromPreferences(
  prefs?: UserNavigationPreferences | null
): NavTabKey[] {
  const saved = prefs?.tabOrder;
  if (!saved?.length) return [...DEFAULT_NAV_TAB_ORDER];
  return normalizeNavTabOrder(saved);
}

/** split order for the edit UI — draggable chunk vs pinned browse row */
export function splitNavTabOrderForEdit(order: NavTabKey[]): {
  draggableKeys: NavTabKey[];
  pinnedBrowse: NavTabKey;
} {
  const normalized = normalizeNavTabOrder(order);
  return {
    draggableKeys: normalized.filter((key) => key !== PINNED_NAV_TAB),
    pinnedBrowse: PINNED_NAV_TAB,
  };
}

/** merge draggable keys back with browse pinned at the end */
export function mergeNavTabOrderFromEdit(draggableKeys: NavTabKey[]): NavTabKey[] {
  return normalizeNavTabOrder([...draggableKeys, PINNED_NAV_TAB]);
}
