/**
 * bottom tab chrome: custom liquid navbar + shared FAB zone styles / layout helpers.
 *
 * REVERT (back to system NativeTabs only):
 * 1) set USE_CUSTOM_LIQUID_TAB_BAR to false in tabBarChrome.constants.ts
 * 2) in app/(tabs)/_layout.tsx use hidden={!USE_CUSTOM_LIQUID_TAB_BAR} and only render
 *    <CustomLiquidTabBar /> when USE_CUSTOM_LIQUID_TAB_BAR is true (already wired)
 * 3) optional: remove CustomTabNavMetricsProvider from app/_layout.tsx if nothing else needs it
 */

export { USE_CUSTOM_LIQUID_TAB_BAR, TAB_BAR_CHROME_LAYOUT, TAB_BAR_CHROME_VISUAL, FAB_CHROME_ZONE } from './tabBarChrome.constants';
export type { CustomTabNavItem } from './tabBarChrome.types';
export { computeTabBarChromeLayout } from './computeTabBarChromeLayout';
export { buildCustomTabNavItems } from './customTabNavItems';
export { CustomLiquidTabBar } from './CustomLiquidTabBar';
export { fabChromeZoneStyle } from './fabChromeZone';
