/**
 * persisted browse search: recent query strings (max 4) + items opened from search (max 6).
 * asyncstorage survives app restarts; push* helpers return the next array for setState.
 * keys are scoped per signed-in user so history never leaks across accounts on one device.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

/** legacy global keys — only read when no user id is available (pre-login / cold start edge) */
export const BROWSE_RECENT_SEARCHES_KEY = '@DailyFlo:browseRecentSearches';
export const BROWSE_RECENTLY_VIEWED_KEY = '@DailyFlo:browseRecentlyViewed';

export const MAX_RECENT_SEARCHES = 4;
export const MAX_RECENTLY_VIEWED = 6;

const userRecentSearchesKey = (userId: string) =>
  `@DailyFlo:browseRecentSearches/user/${userId}`;

const userRecentlyViewedKey = (userId: string) =>
  `@DailyFlo:browseRecentlyViewed/user/${userId}`;

export type RecentlyViewedEntry = {
  kind: 'task' | 'list';
  id: string;
  label: string;
};

function parseRecentSearches(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === 'string').slice(0, MAX_RECENT_SEARCHES);
  } catch {
    return [];
  }
}

/** load recent query strings for the active account only */
export async function loadRecentSearches(userId?: string | null): Promise<string[]> {
  try {
    if (userId) {
      return parseRecentSearches(await AsyncStorage.getItem(userRecentSearchesKey(userId)));
    }
    return parseRecentSearches(await AsyncStorage.getItem(BROWSE_RECENT_SEARCHES_KEY));
  } catch {
    return [];
  }
}

/** save recent query strings under the active account's storage key */
export async function persistRecentSearches(rows: string[], userId?: string | null): Promise<void> {
  const payload = JSON.stringify(rows.slice(0, MAX_RECENT_SEARCHES));
  if (userId) {
    await AsyncStorage.setItem(userRecentSearchesKey(userId), payload);
    return;
  }
  await AsyncStorage.setItem(BROWSE_RECENT_SEARCHES_KEY, payload);
}

/** prepend trimmed query, dedupe, cap at MAX_RECENT_SEARCHES */
export function pushRecentSearch(trimmed: string, prev: string[]): string[] {
  const q = trimmed.trim();
  if (!q) return prev;
  return [q, ...prev.filter((x) => x !== q)].slice(0, MAX_RECENT_SEARCHES);
}

function isRecentlyViewedEntry(x: unknown): x is RecentlyViewedEntry {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  return (
    (o.kind === 'task' || o.kind === 'list') &&
    typeof o.id === 'string' &&
    typeof o.label === 'string'
  );
}

function parseRecentlyViewed(raw: string | null): RecentlyViewedEntry[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isRecentlyViewedEntry).slice(0, MAX_RECENTLY_VIEWED);
  } catch {
    return [];
  }
}

/** load recently opened tasks/lists for the active account only */
export async function loadRecentlyViewed(userId?: string | null): Promise<RecentlyViewedEntry[]> {
  try {
    if (userId) {
      return parseRecentlyViewed(await AsyncStorage.getItem(userRecentlyViewedKey(userId)));
    }
    return parseRecentlyViewed(await AsyncStorage.getItem(BROWSE_RECENTLY_VIEWED_KEY));
  } catch {
    return [];
  }
}

/** save recently opened tasks/lists under the active account's storage key */
export async function persistRecentlyViewed(rows: RecentlyViewedEntry[], userId?: string | null): Promise<void> {
  const payload = JSON.stringify(rows.slice(0, MAX_RECENTLY_VIEWED));
  if (userId) {
    await AsyncStorage.setItem(userRecentlyViewedKey(userId), payload);
    return;
  }
  await AsyncStorage.setItem(BROWSE_RECENTLY_VIEWED_KEY, payload);
}

/** most recent first; dedupe by kind + id */
export function pushRecentlyViewed(entry: RecentlyViewedEntry, prev: RecentlyViewedEntry[]): RecentlyViewedEntry[] {
  const key = `${entry.kind}:${entry.id}`;
  const filtered = prev.filter((e) => `${e.kind}:${e.id}` !== key);
  return [entry, ...filtered].slice(0, MAX_RECENTLY_VIEWED);
}
