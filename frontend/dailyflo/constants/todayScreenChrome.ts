/**
 * today tab layout — fixed blur + pills, then scroll big title + list content.
 */

import {
  TAB_ROOT_TOP_SECTION_ANCHOR_HEIGHT,
  TAB_ROOT_TOP_SECTION_ROW_HEIGHT,
} from '@/components/navigation/TabRootTopSectionChrome';
import { Paddings } from '@/constants/Paddings';

export const TODAY_TOP_TOOLBAR_ROW_HEIGHT = TAB_ROOT_TOP_SECTION_ROW_HEIGHT;
export const TODAY_TOP_CHROME_BODY_HEIGHT = TAB_ROOT_TOP_SECTION_ANCHOR_HEIGHT;
export const TODAY_TOP_CHROME_FADE_TAIL =
  TAB_ROOT_TOP_SECTION_ANCHOR_HEIGHT - TAB_ROOT_TOP_SECTION_ROW_HEIGHT;

/** gap under heading-1 in scroll — matches TodayBigScrollHeader */
export const TODAY_BIG_TITLE_BOTTOM_GAP = 8;

/** heading-1 line box + bottom gap — timeline pills sit below this when title is at scroll top */
export const TODAY_BIG_TITLE_BLOCK_HEIGHT = 46 + TODAY_BIG_TITLE_BOTTOM_GAP;

/** list view: fixed Tasks | Habits row under blur (pill min-height + bleed + bottom gap) */
export const TODAY_LIST_PILL_BAR_BLOCK_HEIGHT =
  Paddings.liquidGlassBleed * 2 + 48 + Paddings.timelineAllDayPillPaddingBottom;

export function todayBlurChromeHeight(safeAreaTop: number): number {
  return safeAreaTop + TODAY_TOP_CHROME_BODY_HEIGHT;
}

/** list view: scroll starts below blur only — big title + pills scroll, then pills stick */
export function todayListScrollTopPadding(): number {
  return TAB_ROOT_TOP_SECTION_ANCHOR_HEIGHT;
}

/** scroll offset when inline pills should lock under blur (after big title scrolls away) */
export const TODAY_LIST_PILL_STICKY_SCROLL_THRESHOLD = TODAY_BIG_TITLE_BLOCK_HEIGHT;

/**
 * today timeline segment only — space below pills before the timed grid.
 * habits/all-day keep their own list padding; this levels the timeline row to match.
 */
export const TODAY_TIMELINE_ROW_BELOW_PILLS_GAP = Paddings.section;

/** list view: fixed pills sit directly under blur chrome */
export function todayListPillBarTop(safeAreaTop: number): number {
  return todayBlurChromeHeight(safeAreaTop);
}

/** timeline: fixed pills below blur + scroll big-title slot */
export function todayPillBarTopInset(safeAreaTop: number): number {
  return todayBlurChromeHeight(safeAreaTop) + TODAY_BIG_TITLE_BLOCK_HEIGHT;
}
