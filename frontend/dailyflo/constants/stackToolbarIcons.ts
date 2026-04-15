/**
 * image sources for ios Stack.Toolbar header items — native bar buttons need bundled
 * rasters (require), not the svg icon components used elsewhere in the app.
 * we only ship today / timeline / browse / sparkles families under assets/icons.
 */

import type { ImageSourcePropType } from 'react-native';

import { getTodayTabIcon } from '@/utils/todayIcon';

/** decorative dashboard chip: same day-based icon as the Today tab */
export function stackToolbarDashboardIcon(): ImageSourcePropType {
  return getTodayTabIcon();
}

/** planner-only chrome (bulk selection) — matches the Planner tab icon */
export const STACK_TOOLBAR_PLANNER_DASHBOARD: ImageSourcePropType = require('@/assets/icons/Timeline.png');

/** overflow trigger: no ellipsis png exists; browse icon reads as “more / lists” in this app */
export const STACK_TOOLBAR_OVERFLOW: ImageSourcePropType = require('@/assets/icons/Browse.png');

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
