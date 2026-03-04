/**
 * Checkbox-related constants
 *
 * Centralized sizes and timing for all checkboxes across the app.
 */

// delay before syncing checkbox changes to backend - ui stays fully local until then
export const CHECKBOX_SYNC_DELAY_MS = 30_000;

// --- CHECKBOX SIZES ---
// default size for TaskCard, TimelineItem, SubtaskListItem, DragOverlay
export const CHECKBOX_SIZE_DEFAULT = 22;
// task screen title checkbox (larger for prominence)
export const CHECKBOX_SIZE_TASK_VIEW = 24;
// small indicator (e.g. subtask count in TimelineItem)
export const CHECKBOX_SIZE_SMALL = 12;

// tick icon size as ratio of checkbox size (0.65 = 65% of checkbox)
export const CHECKBOX_TICK_SIZE_RATIO = 0.9;
