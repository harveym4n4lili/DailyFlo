/**
 * habit tab dashboard tiles — spacing aligned with GroupedList + browse progress board tokens.
 */

import {
  PROGRESS_BOARD_CONTENT_ROW_GAP,
  PROGRESS_BOARD_GROUPED_LIST_CONTENT_PADDING_HORIZONTAL,
  PROGRESS_BOARD_SECTION_LABEL_MARGIN_BOTTOM,
  PROGRESS_BOARD_SECONDARY_ROW_GAP,
} from '@/components/features/gamification/browse/progressBoardUiTokens';
import { Paddings } from '@/constants/Paddings';

/** gap between the four dashboard tiles (same as grouped-list icon-to-text spacing) */
export const HABIT_DASHBOARD_TILE_GAP = Paddings.groupedListIconTextSpacing;

/** horizontal inset — matches browse dashboard GroupedList + habit cards */
export const HABIT_DASHBOARD_TILE_PADDING_HORIZONTAL =
  PROGRESS_BOARD_GROUPED_LIST_CONTENT_PADDING_HORIZONTAL;

/** vertical inset — child grouped-list rows (habit cards use itemPadding="child") */
export const HABIT_DASHBOARD_TILE_PADDING_VERTICAL = Paddings.groupedListChildContentVertical;

/** space below tile section labels — same rhythm as progress board streak/tasks headers */
export const HABIT_DASHBOARD_SECTION_LABEL_MARGIN_BOTTOM =
  PROGRESS_BOARD_SECTION_LABEL_MARGIN_BOTTOM;

/** vertical gap between value row and hint inside a tile */
export const HABIT_DASHBOARD_CONTENT_ROW_GAP = PROGRESS_BOARD_CONTENT_ROW_GAP;

/** horizontal gap inside streak count rows (number + unit) */
export const HABIT_DASHBOARD_SECONDARY_ROW_GAP = PROGRESS_BOARD_SECONDARY_ROW_GAP;

/** gap between progress ring and fraction text — grouped-list icon column spacing */
export const HABIT_DASHBOARD_RING_TEXT_GAP = Paddings.groupedListIconTextSpacing;

/** min height so the 2×2 grid feels balanced */
export const HABIT_DASHBOARD_TILE_MIN_HEIGHT = 108;

/** today's progress ring in the bottom-left tile */
export const HABIT_DASHBOARD_TODAY_RING_SIZE = 44;

export const HABIT_DASHBOARD_TODAY_RING_STROKE = 3.5;

/** center tick when all habits today are complete — scaled for dashboard ring size */
export const HABIT_DASHBOARD_TODAY_TICK_ICON_SIZE = 22;
