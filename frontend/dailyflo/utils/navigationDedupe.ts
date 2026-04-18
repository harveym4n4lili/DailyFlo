/**
 * blocks back-to-back navigation to the same href (double-tap on rows, FAB, overflow menu, etc.).
 * different routes or different params still navigate immediately; only identical destinations within
 * the cooldown are skipped.
 */
const COOLDOWN_MS = 420;

let lastKey = '';
let lastAt = 0;

function stableParamKey(params: Record<string, string | number | undefined> | undefined): string {
  if (params == null || typeof params !== 'object') return '';
  const keys = Object.keys(params).sort();
  return keys.map((k) => `${k}=${String(params[k])}`).join('&');
}

/** stable string for expo-router href (string or object with pathname + params) */
export function navigationHrefDedupeKey(href: unknown): string {
  if (typeof href === 'string') return href;
  if (href && typeof href === 'object' && 'pathname' in (href as object)) {
    const o = href as { pathname: string; params?: Record<string, string | number | undefined> };
    const q = stableParamKey(o.params);
    return q ? `${o.pathname}?${q}` : o.pathname;
  }
  try {
    return JSON.stringify(href);
  } catch {
    return String(href);
  }
}

export function runIfNotDuplicateNavigation(href: unknown, run: () => void): void {
  const key = navigationHrefDedupeKey(href);
  const now = Date.now();
  if (key === lastKey && now - lastAt < COOLDOWN_MS) {
    return;
  }
  lastKey = key;
  lastAt = now;
  run();
}
