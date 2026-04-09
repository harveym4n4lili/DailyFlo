/**
 * single place to tune bottom tab chrome (liquid navbar + shared FAB layout math).
 * revert: set USE_CUSTOM_LIQUID_TAB_BAR to false and NativeTabs hidden={false} in app/(tabs)/_layout.tsx
 */

import { Paddings } from '@/constants/Paddings';

/** false = system NativeTabs bar visible, no glass strip (see _layout wiring) */
export const USE_CUSTOM_LIQUID_TAB_BAR = true;

/** layout math shared with FloatingActionButton (FAB_SCREEN_INSET) + measured strip height */
export const TAB_BAR_CHROME_LAYOUT = {
  /** before onLayout; should stay in sync with FloatingActionButton default circle size */
  defaultFabSide: 64,
  /** horizontal gap between navbar trailing edge and FAB */
  fabToNavGap: 16,
  /** first-frame strip height until onLayout runs */
  estimatedStripHeight: 62,
  /** distance from screen left edge to navbar start (uses global screen padding) */
  leftInset: Paddings.screen,
} as const;

/** visual tokens for the glass strip + row (icons, radii, z-order) */
export const TAB_BAR_CHROME_VISUAL = {
  tabIconSize: 25,
  glassBorderRadius: 28,
  fallbackBorderRadius: 26,
  glassBleedPaddingV: 6,
  glassBleedPaddingH: 8,
  innerPaddingV: 4,
  innerPaddingH: 4,
  labelMaxWidth: 72,
  /** expo-glass-effect style for the navbar pill */
  glassEffectStyle: 'regular' as const,
  wrapZIndex: 1998,
} as const;

/**
 * bottom band height on tab screens for the FAB overlay — keeps hit targets aligned with tab chrome.
 * change here if FAB or nav moves vertically.
 */
export const FAB_CHROME_ZONE = {
  height: 120,
} as const;
