/**
 * habits tab section headers — same rhythm as browse GroupedListHeader spacing.
 */

import type { ViewStyle } from 'react-native';

import { Paddings } from '@/constants/Paddings';

/** first section on the habits tab — contentSection already adds top inset */
export const HABIT_SECTION_HEADER_STYLE_FIRST: ViewStyle = {
  marginTop: 0,
};

/** stacked section below today's block — matches browse `sectionHeader` gap */
export const HABIT_SECTION_HEADER_STYLE_FOLLOWING: ViewStyle = {
  marginTop: Paddings.listItemVertical * 2,
};

/** stats dashboard → "Today's Habits" title — slightly tighter than `following` (24 → 16) */
export const HABIT_DASHBOARD_TO_SECTION_HEADER_GAP = Paddings.sectionCompact;

/** space between section title and the cards/list below (browse listsPillsContainer uses this) */
export const HABIT_SECTION_HEADER_CONTENT_GAP = Paddings.groupedListHeaderContentGap;
