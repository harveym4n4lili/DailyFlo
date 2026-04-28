import { getTodayTabIcon } from '@/utils/todayIcon';
import type { CustomTabNavItem } from './tabBarChrome.types';

// static icons — same assets as NativeTabs.Trigger routes in app/(tabs)/_layout.tsx
const PLANNER_TAB_ICON = require('@/assets/icons/Timeline.png');
const AI_TAB_ICON = require('@/assets/icons/Sparkles.png');
const BROWSE_TAB_ICON = require('@/assets/icons/Browse.png');

/**
 * tab list for the custom navbar only — add/remove entries together with NativeTabs.Trigger + folders under app/(tabs)/
 */
export function buildCustomTabNavItems(): CustomTabNavItem[] {
  return [
    {
      key: 'today',
      href: '/(tabs)/today',
      source: getTodayTabIcon(),
      label: 'Today',
    },
    {
      key: 'planner',
      href: '/(tabs)/planner',
      source: PLANNER_TAB_ICON,
      label: 'Planner',
    },
    { key: 'ai', href: '/(tabs)/ai', source: AI_TAB_ICON, label: 'AI' },
    {
      key: 'browse',
      href: '/(tabs)/browse',
      source: BROWSE_TAB_ICON,
      label: 'Browse',
    },
  ];
}
