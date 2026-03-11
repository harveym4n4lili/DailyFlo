/**
 * Checkbox-related constants
 *
 * Centralized sizes and timing for all checkboxes across the app.
 */

// delay before syncing checkbox changes to backend - batches rapid taps
// overridden: when user switches tabs, flushAllPendingCheckboxSyncs() runs pending syncs immediately
export const CHECKBOX_SYNC_DELAY_MS = 0;

// animation durations - used so hide delay waits for these to finish before linear transition
export const CHECKBOX_TICK_ANIMATION_MS = 100;

// strikethrough duration scales with text width so visual speed feels consistent (long text no longer strikes too fast)
export const STRIKETHROUGH_MIN_MS = 400;
export const STRIKETHROUGH_MS_PER_PX = 1;
export const STRIKETHROUGH_MAX_MS = 1500;

/** returns duration in ms - scales with total line width so strikethrough speed feels consistent across text lengths */
export function getStrikethroughDuration(lines: { width: number }[]): number {
  const totalWidth = lines.reduce((sum, l) => sum + l.width, 0);
  const duration = STRIKETHROUGH_MIN_MS + totalWidth * STRIKETHROUGH_MS_PER_PX;
  return Math.min(STRIKETHROUGH_MAX_MS, Math.max(STRIKETHROUGH_MIN_MS, duration));
}

// delay before hiding completed task - must exceed tick + strikethrough so linear transition starts after both
// keeping this noticeably longer so user can clearly see the strikethrough animate before the card slides away
export const CHECKBOX_HIDE_DELAY_MS = STRIKETHROUGH_MAX_MS;

// approximate height per task card (card + spacing) - used when scrolling up after hiding completed tasks
// so the list scrolls by the height of removed content instead of leaving a gap
export const TASK_HEIGHT_ESTIMATE = 80;

// --- CHECKBOX SIZES ---
// default size for TaskCard, TimelineItem, SubtaskListItem, DragOverlay
export const CHECKBOX_SIZE_DEFAULT = 22;
// task screen title checkbox (larger for prominence)
export const CHECKBOX_SIZE_TASK_VIEW = 24;
// small indicator (e.g. subtask count in TimelineItem)
export const CHECKBOX_SIZE_SMALL = 12;

// tick icon size as ratio of checkbox size (0.65 = 65% of checkbox)
export const CHECKBOX_TICK_SIZE_RATIO = 0.9;

// when selectionMode: animate from default size to size-1, and border radius to circle
export const CHECKBOX_SELECTION_MODE_SIZE_OFFSET = 4;
export const CHECKBOX_SELECTION_SHAPE_ANIMATION_MS =360;
