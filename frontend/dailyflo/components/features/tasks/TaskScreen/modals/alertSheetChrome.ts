/**
 * Shared chrome for alert-select, alert-offset-select, time-duration-select, and date-select liquid glass form sheets.
 * Keeps horizontal inset, close placement, and header scroll offset in sync.
 */

import { Paddings } from '@/constants/Paddings';

/** horizontal inset from sheet edge — title, list, and close share this rhythm */
export const ALERT_SHEET_HORIZONTAL_INSET = Paddings.screen;

/** MainCloseButton diameter */
export const ALERT_SHEET_CLOSE_SIZE = 42;

/** close button top offset — flush with sheet edge inset (same as FAB / browse modals) */
export const ALERT_SHEET_CLOSE_TOP = ALERT_SHEET_HORIZONTAL_INSET;

/** scroll content top — title row aligns with close band without full button-height gap */
export const ALERT_SHEET_SCROLL_PADDING_TOP =
  ALERT_SHEET_CLOSE_TOP + Paddings.listItemVertical;

/** trailing reserve on heading text so it never runs under the top-right close */
export const ALERT_SHEET_HEADER_TRAILING_INSET =
  ALERT_SHEET_CLOSE_SIZE + Paddings.groupedListIconTextSpacing;
