/**
 * layout tokens for ColorCirclePicker — unselected swatches are compact; selected matches weekday circles.
 */

import { Paddings } from '@/constants/Paddings';
import {
  WEEKDAY_PICKER_CIRCLE_SIZE,
  WEEKDAY_PICKER_INNER_PAD_HORIZONTAL,
  WEEKDAY_PICKER_TRACK_HEIGHT,
} from '@/components/ui/WeekdayCirclePicker/weekdayCirclePickerLayout';

/** row band — same 52px track as WeekdayCirclePicker so selected swatches fit */
export const COLOR_CIRCLE_PICKER_TRACK_HEIGHT = WEEKDAY_PICKER_TRACK_HEIGHT;

/** selected swatch — same 44px diameter as frequency day circles */
export const COLOR_CIRCLE_PICKER_SELECTED_SIZE = WEEKDAY_PICKER_CIRCLE_SIZE;

/** vertical breathing room for unselected swatches inside the track */
export const COLOR_CIRCLE_PICKER_ROW_INSET = 6;

/** 4px outer ring on unselected swatches — soft palette shade (300) */
export const COLOR_CIRCLE_PICKER_OUTER_STROKE = 4;

/** unselected swatch outer diameter (32px) */
export const COLOR_CIRCLE_PICKER_SIZE =
  COLOR_CIRCLE_PICKER_SELECTED_SIZE - COLOR_CIRCLE_PICKER_ROW_INSET * 2;

/** fixed tap slot per swatch — keeps the row stable when selection expands */
export const COLOR_CIRCLE_PICKER_SLOT_SIZE = COLOR_CIRCLE_PICKER_SELECTED_SIZE;

/** gap between swatches — sibling chip rhythm (tighter than screen padding, fits 32–44px dots) */
export const COLOR_CIRCLE_PICKER_GAP = Paddings.formDataPillRowGap;

/** horizontal inset — aligned with weekday picker row */
export const COLOR_CIRCLE_PICKER_INNER_PAD_HORIZONTAL = WEEKDAY_PICKER_INNER_PAD_HORIZONTAL;

/**
 * how many swatches fit on one row for a given content width (used by tests / layout tuning).
 * flex-wrap in ColorCirclePicker uses the same slot + gap math implicitly.
 */
export function getColorCirclePickerColumnsForWidth(contentWidth: number): number {
  if (contentWidth <= 0) return 1;
  const unit = COLOR_CIRCLE_PICKER_SLOT_SIZE + COLOR_CIRCLE_PICKER_GAP;
  return Math.max(1, Math.floor((contentWidth + COLOR_CIRCLE_PICKER_GAP) / unit));
}

/** spring when a swatch moves between unselected ↔ selected */
export const COLOR_CIRCLE_PICKER_SPRING = {
  damping: 20,
  stiffness: 340,
  mass: 0.8,
} as const;
