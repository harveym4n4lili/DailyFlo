/**
 * Shared geometry for the planner timeline column: vertical line, rail (checkbox/icon), and content card.
 * Keeps TimelineView, TimelineItem, and DragOverlay aligned.
 */

import { CHECKBOX_SIZE_DEFAULT } from '@/constants/Checkbox';
import { Paddings } from '@/constants/Paddings';

/** solid vertical line — absolute `left` inside `tasksContainer` */
export const TIMELINE_LINE_LEFT = 21;
export const TIMELINE_LINE_WIDTH = 2;

/** rail column width — fits timeline checkbox or 20px task icon */
export const TIMELINE_RAIL_WIDTH = Math.max(CHECKBOX_SIZE_DEFAULT, 24);

/** centers the rail on the vertical line (line center = LINE_LEFT + LINE_WIDTH / 2) */
export const TIMELINE_RAIL_MARGIN_LEFT =
  TIMELINE_LINE_LEFT + TIMELINE_LINE_WIDTH / 2 - TIMELINE_RAIL_WIDTH / 2;

/** gap between rail (checkbox/icon) and task text — matches TaskCard checkbox-to-title spacing */
export const TIMELINE_CONTENT_GAP = Paddings.cardCompact;

/** left inset for task text, free-time gap copy, and overlapping separators (inside `tasksContainer`) */
export const TIMELINE_CONTENT_LEFT =
  TIMELINE_RAIL_MARGIN_LEFT + TIMELINE_RAIL_WIDTH + TIMELINE_CONTENT_GAP;
