/**
 * scroll content bottom inset on main tab screens — keeps the last row clear of the
 * liquid tab bar + floating action button overlay (same math as ListCard default).
 */

import { Paddings } from './Paddings';

/** tab strip + fab band + gap before scrollBottomExtra — mirrors ListCard listContainer */
const TAB_BAR_SCROLL_CLEARANCE = 58 + 80 + 16;

export function tabScreenScrollPaddingBottom(safeAreaBottom: number): number {
  return TAB_BAR_SCROLL_CLEARANCE + safeAreaBottom + Paddings.scrollBottomExtra;
}
