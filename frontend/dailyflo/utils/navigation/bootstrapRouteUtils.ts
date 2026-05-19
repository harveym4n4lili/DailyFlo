/**
 * cold-start bootstrap helpers for `app/_layout.tsx` —
 * avoid redundant `replace('/(tabs)/today')` when native tabs already focused Today (duplicate transition + empty flash).
 */

/** true when pathname/segments already imply the Today tab is active (nested `index` under today still counts). */
export function isRouteAlreadyShowingToday(
  pathname: string,
  segments: readonly string[],
): boolean {
  if (segments.includes('today')) return true;
  const p = (pathname || '').replace(/\/$/, '');
  return p.endsWith('/today') || p === '/today' || p.endsWith('(tabs)/today');
}
