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
  tabIconSize: 24,
  glassBorderRadius: 32,
  fallbackBorderRadius: 26,
  /**
   * one value for: padding inside the glass on all four edges, and horizontal gap between tab columns.
   * keeps edge-to-first-tab spacing equal to tab-to-tab spacing.
   */
  tabBarInset: 0,
  /** vertical gap between icon and label inside each tab */
  iconLabelGap: 4,
  /** optional extra vertical padding inside each tab hit target (symmetric) */
  tabItemPaddingV: 10,
  /** label type uses navbar token (10pt) as base — these override one step larger */
  tabLabelFontSize: 12,
  tabLabelLineHeight: 14,
  labelMaxWidth: 72,
  /** expo-glass-effect style for the navbar pill */
  glassEffectStyle: 'regular' as const,
  /** lifts the whole bottom chrome stack (fade + navbar) above tab screen content */
  chromeOverlayStackZIndex: 1998,
  /** FAB layer in (tabs)/_layout — must stay above chromeOverlayStack so the button isn’t covered by the fade */
  tabFabAboveChromeZIndex: 2000,
  /**
   * inside chromeOverlayStack only: fade first (0), navbar second (1) so the pill always paints on top.
   * do not reuse 1997/1998 on those inner views — sibling order + these values keep ordering stable on ios/android.
   */
  chromeFadeRelativeZIndex: 0,
  chromeNavBarRelativeZIndex: 1,
  /** sits under the pill; scroll content fades through this band (height excludes safe-area; insets added in component) */
  bottomChromeFadeBaseHeight: 96,
} as const;

/**
 * bottom band height on tab screens for the FAB overlay — keeps hit targets aligned with tab chrome.
 * change here if FAB or nav moves vertically.
 */
export const FAB_CHROME_ZONE = {
  height: 120,
} as const;
