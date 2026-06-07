import { Platform } from 'react-native';
import type { ImageSourcePropType } from 'react-native';

import { getTodayTabIcon } from '@/utils/todayIcon';

/** keys that can appear in the navbar — synced with app/(tabs)/ folders + NativeTabs.Trigger names */
export type NavTabKey = 'today' | 'planner' | 'ai' | 'browse' | 'inbox' | 'habits';

/** browse is always present in the navbar and cannot be removed from settings */
export const PINNED_NAV_TAB: NavTabKey = 'browse';

/** default navbar order when the account has no saved navigation_preferences yet */
export const DEFAULT_NAV_TAB_ORDER: NavTabKey[] = ['today', 'planner', 'ai', 'browse'];

const PLANNER_TAB_ICON = require('@/assets/icons/Timeline.png');
const AI_TAB_ICON = require('@/assets/icons/Sparkles.png');
const BROWSE_TAB_ICON = require('@/assets/icons/Browse.png');
const INBOX_TAB_ICON = require('@/assets/icons/Browse.png');
// todo: replace with final habits icon — temporary stand-in copied from Sparkles.png
const HABITS_TAB_ICON = require('@/assets/icons/Habits.png');

export type NavTabMeta = {
  key: NavTabKey;
  label: string;
  /** sf symbol name for grouped-list rows (ios) */
  sfSymbol: string;
  getIconSource: () => ImageSourcePropType;
  href: string;
};

/** static metadata for every tab the user may add to the navbar */
export const NAV_TAB_REGISTRY: Record<NavTabKey, NavTabMeta> = {
  today: {
    key: 'today',
    label: 'Today',
    sfSymbol: 'calendar',
    getIconSource: getTodayTabIcon,
    href: '/(tabs)/today',
  },
  planner: {
    key: 'planner',
    label: 'Planner',
    sfSymbol: 'calendar.day.timeline.left',
    getIconSource: () => PLANNER_TAB_ICON,
    href: '/(tabs)/planner',
  },
  ai: {
    key: 'ai',
    label: 'AI',
    sfSymbol: 'sparkles',
    getIconSource: () => AI_TAB_ICON,
    href: '/(tabs)/ai',
  },
  browse: {
    key: 'browse',
    label: 'Browse',
    sfSymbol: 'square.grid.2x2',
    getIconSource: () => BROWSE_TAB_ICON,
    href: '/(tabs)/browse',
  },
  inbox: {
    key: 'inbox',
    label: 'Inbox',
    sfSymbol: 'tray.full',
    getIconSource: () => INBOX_TAB_ICON,
    href: '/(tabs)/inbox',
  },
  habits: {
    key: 'habits',
    label: 'Habits',
    sfSymbol: 'arrow.triangle.2.circlepath',
    getIconSource: () => HABITS_TAB_ICON,
    href: '/(tabs)/habits',
  },
};

/** expo-router href for a navbar tab — inbox falls back to browse stack on android (6th native trigger slot) */
export function resolveNavTabHref(key: NavTabKey): string {
  if (key === 'inbox' && Platform.OS === 'android') {
    return '/(tabs)/browse/inbox';
  }
  return NAV_TAB_REGISTRY[key].href;
}

/** every tab the user may show in the navbar — order for Tab Bar options grouped list */
export const ALL_NAV_TAB_OPTION_KEYS: NavTabKey[] = [
  'today',
  'planner',
  'ai',
  'inbox',
  'habits',
  'browse',
];

/** tabs the user can pick from the Add row (excludes browse — always present) */
export const ADDABLE_NAV_TAB_KEYS: NavTabKey[] = ['today', 'planner', 'ai', 'inbox', 'habits'];
