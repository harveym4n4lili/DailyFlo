/** liquid navbar + bottom fade + FAB zone helpers; (tabs)/_layout always mounts chrome + overlay FAB. */

export { USE_CUSTOM_LIQUID_TAB_BAR, TAB_BAR_CHROME_LAYOUT, TAB_BAR_CHROME_VISUAL, FAB_CHROME_ZONE } from './tabBarChrome.constants';
export type { CustomTabNavItem } from './tabBarChrome.types';
export { computeTabBarChromeLayout } from './computeTabBarChromeLayout';
export { buildCustomTabNavItems } from './customTabNavItems';
export { CustomLiquidTabBar } from './CustomLiquidTabBar';
export { fabChromeZoneStyle } from './fabChromeZone';
