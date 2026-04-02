/**
 * persisted browse search: recent query strings (max 4) + items opened from search (max 6).
 * asyncstorage survives app restarts; push* helpers return the next array for setState.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export const BROWSE_RECENT_SEARCHES_KEY = '@DailyFlo:browseRecentSearches';
export const BROWSE_RECENTLY_VIEWED_KEY = '@DailyFlo:browseRecentlyViewed';

export const MAX_RECENT_SEARCHES = 4;
export const MAX_RECENTLY_VIEWED = 6;

export type RecentlyViewedEntry = {
  kind: 'task' | 'list';
  id: string;
  label: string;
};

export async function loadRecentSearches(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(BROWSE_RECENT_SEARCHES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === 'string').slice(0, MAX_RECENT_SEARCHES);
  } catch {
    return [];
  }
}

export async function persistRecentSearches(rows: string[]): Promise<void> {
  await AsyncStorage.setItem(BROWSE_RECENT_SEARCHES_KEY, JSON.stringify(rows.slice(0, MAX_RECENT_SEARCHES)));
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

export async function loadRecentlyViewed(): Promise<RecentlyViewedEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(BROWSE_RECENTLY_VIEWED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isRecentlyViewedEntry).slice(0, MAX_RECENTLY_VIEWED);
  } catch {
    return [];
  }
}

export async function persistRecentlyViewed(rows: RecentlyViewedEntry[]): Promise<void> {
  await AsyncStorage.setItem(BROWSE_RECENTLY_VIEWED_KEY, JSON.stringify(rows.slice(0, MAX_RECENTLY_VIEWED)));
}

/** most recent first; dedupe by kind + id */
export function pushRecentlyViewed(entry: RecentlyViewedEntry, prev: RecentlyViewedEntry[]): RecentlyViewedEntry[] {
  const key = `${entry.kind}:${entry.id}`;
  const filtered = prev.filter((e) => `${e.kind}:${e.id}` !== key);
  return [entry, ...filtered].slice(0, MAX_RECENTLY_VIEWED);
}
