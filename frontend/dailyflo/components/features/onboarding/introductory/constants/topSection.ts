/**
 * intro funnel — skip control placement + hit area (overlay, not headerRight slot on ios).
 */

import { Paddings } from '@/constants/Paddings';

export const INTRO_SKIP_BUTTON_HIT_SLOP = {
  top: Paddings.listItemVertical,
  bottom: Paddings.listItemVertical,
  left: Paddings.listItemVertical,
  right: Paddings.touchTarget,
} as const;

export const INTRO_SKIP_BUTTON_ABSOLUTE_LAYOUT = {
  offsetRight: Paddings.screenSmall,
  zIndex: 3,
  /** added to safe-area top for the overlay skip row */
  topInsetPlus: Paddings.groupedListHeaderContentGap,
} as const;

export const INTRO_SKIP_BUTTON_ACCESSIBILITY_LABEL = 'Skip introduction';

export const INTRO_SKIP_BUTTON_LABEL = 'Skip';
