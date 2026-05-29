import {
  DEFAULT_NAV_TAB_ORDER,
  NAV_TAB_REGISTRY,
  type NavTabKey,
} from '@/components/features/settings/navigation/navigationTabRegistry';
import { normalizeNavTabOrder } from '@/components/features/settings/navigation/navigationPreferenceUtils';
import type { CustomTabNavItem } from './tabBarChrome.types';

export { DEFAULT_NAV_TAB_ORDER };

/**
 * build liquid navbar items from a saved tab order (redux auth prefs) or the app default.
 * keep in sync with NativeTabs.Trigger entries in app/(tabs)/_layout.tsx.
 */
export function buildCustomTabNavItems(tabOrder?: NavTabKey[]): CustomTabNavItem[] {
  const order = normalizeNavTabOrder(tabOrder ?? DEFAULT_NAV_TAB_ORDER);
  return order.map((key) => {
    const meta = NAV_TAB_REGISTRY[key];
    return {
      key,
      href: meta.href,
      source: meta.getIconSource(),
      label: meta.label,
    };
  });
}
