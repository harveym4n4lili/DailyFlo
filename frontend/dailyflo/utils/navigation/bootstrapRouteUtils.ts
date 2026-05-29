/**
 * cold-start bootstrap helpers for `app/_layout.tsx` —
 * avoid redundant replace when native tabs already focused the user's primary tab.
 */

import type { NavTabKey } from '@/components/features/settings/navigation/navigationTabRegistry';

/** true when pathname/segments already imply the given tab is active (nested routes under that tab still count). */
export function isRouteAlreadyShowingTab(
  pathname: string,
  segments: readonly string[],
  tabKey: NavTabKey,
): boolean {
  if (segments.includes(tabKey)) return true;
  const p = (pathname || '').replace(/\/$/, '');
  return p.endsWith(`/${tabKey}`) || p === `/${tabKey}` || p.endsWith(`(tabs)/${tabKey}`);
}
