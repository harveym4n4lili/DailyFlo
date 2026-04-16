/**
 * image sources for ios Stack.Toolbar header items — native bar buttons need bundled
 * rasters (require), not the svg icon components used elsewhere in the app.
 * we ship today / timeline / browse / sparkles / ellipses rasters under assets/icons.
 */

import type { ImageSourcePropType } from 'react-native';

/** ios Stack.Toolbar left chip: timeline outline (filled Timeline.png used elsewhere in this file) */
export function stackToolbarDashboardIcon(): ImageSourcePropType {
  return require('@/assets/icons/TimelineOutline.png');
}

/**
 * ios dashboard overflow toolbar draws leading + overflow triggers with RN Image (not UIBarButtonItem icons)
 * so both glyphs share the same logical size; tweak here if the pair feels small/large vs the nav bar.
 */
export const STACK_TOOLBAR_HEADER_GLYPH_PX = 22;

/** planner-only chrome (bulk selection) — matches the Planner tab icon */
export const STACK_TOOLBAR_PLANNER_DASHBOARD: ImageSourcePropType = require('@/assets/icons/Timeline.png');

/** overflow trigger for native bar items that still use bundled pngs (e.g. planner bulk toolbar) */
export const STACK_TOOLBAR_OVERFLOW: ImageSourcePropType = require('@/assets/icons/Browse.png');

/** horizontal ellipses raster — dashboard overflow menu trigger (custom Image in IosDashboardOverflowToolbar) */
export const STACK_TOOLBAR_OVERFLOW_ELLIPSES: ImageSourcePropType = require('@/assets/icons/Ellipses.png');

/** activity log — history / timeline */
export const STACK_TOOLBAR_ACTIVITY: ImageSourcePropType = require('@/assets/icons/Timeline.png');

/** select tasks — day-scoped selection matches Today tab metaphor */
export const STACK_TOOLBAR_SELECT_TASKS: ImageSourcePropType = require('@/assets/icons/Today.png');

/** mark complete — ties to “today” task completion */
export const STACK_TOOLBAR_COMPLETE: ImageSourcePropType = require('@/assets/icons/Today.png');

/** date / schedule — planner timeline */
export const STACK_TOOLBAR_SCHEDULE: ImageSourcePropType = require('@/assets/icons/Timeline.png');

/** move / re-home — browse/lists surface */
export const STACK_TOOLBAR_MOVE: ImageSourcePropType = require('@/assets/icons/Browse.png');

/** duplicate — ai tab icon is the only other distinct affordance in the bundle */
export const STACK_TOOLBAR_DUPLICATE: ImageSourcePropType = require('@/assets/icons/Sparkles.png');
