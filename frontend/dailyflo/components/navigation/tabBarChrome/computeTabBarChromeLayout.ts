import { TAB_BAR_CHROME_LAYOUT } from './tabBarChrome.constants';

/** positions the glass strip vs FAB_SCREEN_INSET + optional measured navbar height */
export function computeTabBarChromeLayout(
  measuredNavBarHeight: number | null,
  fabScreenInset: number
) {
  const stripHeight = measuredNavBarHeight ?? TAB_BAR_CHROME_LAYOUT.estimatedStripHeight;
  const fabOuterSize = measuredNavBarHeight ?? TAB_BAR_CHROME_LAYOUT.defaultFabSide;
  const fabOuterBottom = fabScreenInset;
  const customTabStripBottom = fabOuterBottom + fabOuterSize / 2 - stripHeight / 2;
  const customTabBarRightInset =
    fabScreenInset + fabOuterSize + TAB_BAR_CHROME_LAYOUT.fabToNavGap;

  return {
    stripHeight,
    fabOuterSize,
    customTabStripBottom,
    customTabBarRightInset,
  };
}
