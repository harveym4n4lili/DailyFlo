/**
 * Applied display defaults + merge helpers — shared by draft context, Today list, and auth PATCH.
 */

import type { DisplaySettingsContext } from '@/components/features/display/displayStackChrome';
import {
  DEFAULT_DISPLAY_LAYOUT_VIEW_PLANNER,
  DEFAULT_DISPLAY_LAYOUT_VIEW_TODAY,
  type DisplayLayoutView,
} from '@/components/features/display/displayLayoutOptions';
import {
  DEFAULT_DISPLAY_DATE_SORT_OPTION_PLANNER,
  DEFAULT_DISPLAY_DATE_SORT_OPTION_TODAY,
  DEFAULT_DISPLAY_ORDERING_OPTION,
  DEFAULT_DISPLAY_SORTING_OPTION,
  normalizeTabSortOption,
  type DisplayDateSortOption,
  type DisplayOrderingOption,
} from '@/components/features/display/displaySortOptions';
import type { TabDisplayPreferences, UserDisplayPreferences } from '@/types/common/User';

const DEFAULT_PRIORITY_SUBLABEL = 'All';
const DEFAULT_SHOW_ALL_DAY_TASKS = true;

function getDefaultDateSortOption(context: DisplaySettingsContext): DisplayDateSortOption {
  return context === 'today' ? DEFAULT_DISPLAY_DATE_SORT_OPTION_TODAY : DEFAULT_DISPLAY_DATE_SORT_OPTION_PLANNER;
}

/** full draft defaults for a tab — used on reset and when no saved prefs exist */
export function buildDisplayDraftDefaults(context: DisplaySettingsContext) {
  // per-tab layout default — today list, planner timeline (overridden when user saves layoutView)
  const layoutView: DisplayLayoutView =
    context === 'planner' ? DEFAULT_DISPLAY_LAYOUT_VIEW_PLANNER : DEFAULT_DISPLAY_LAYOUT_VIEW_TODAY;

  return {
    layoutView,
    sortOption: DEFAULT_DISPLAY_SORTING_OPTION,
    orderingOption: DEFAULT_DISPLAY_ORDERING_OPTION,
    dateSortOption: getDefaultDateSortOption(context),
    prioritySortSublabel: DEFAULT_PRIORITY_SUBLABEL,
    showCompletedTasks: true,
    showAllDayTasks: DEFAULT_SHOW_ALL_DAY_TASKS,
  };
}

/** map saved server prefs onto draft shape (picker-only fields keep defaults when missing) */
export function mergeSavedDisplayPrefsIntoDraft(
  context: DisplaySettingsContext,
  saved?: TabDisplayPreferences | null
) {
  const defaults = buildDisplayDraftDefaults(context);
  if (!saved) return defaults;

  return {
    ...defaults,
    ...(saved.layoutView !== undefined ? { layoutView: saved.layoutView } : {}),
    ...(saved.sortOption !== undefined
      ? { sortOption: normalizeTabSortOption(saved.sortOption) }
      : {}),
    ...(saved.orderingOption !== undefined ? { orderingOption: saved.orderingOption } : {}),
    ...(saved.showCompletedTasks !== undefined ? { showCompletedTasks: saved.showCompletedTasks } : {}),
    ...(saved.showAllDayTasks !== undefined ? { showAllDayTasks: saved.showAllDayTasks } : {}),
  };
}

/** extract PATCH payload from draft — only persisted fields for this phase */
export function draftToDisplayPreferencesPatch(
  _context: DisplaySettingsContext,
  draft: ReturnType<typeof buildDisplayDraftDefaults>
): TabDisplayPreferences {
  const patch: TabDisplayPreferences = {
    sortOption: draft.sortOption,
    orderingOption: draft.orderingOption,
    showCompletedTasks: draft.showCompletedTasks,
    layoutView: draft.layoutView,
    showAllDayTasks: draft.showAllDayTasks,
  };
  return patch;
}

export function getSavedTabDisplayPrefs(
  displayPreferences: UserDisplayPreferences | undefined,
  context: DisplaySettingsContext
): TabDisplayPreferences | undefined {
  if (context === 'today') return displayPreferences?.today;
  if (context === 'planner') return displayPreferences?.planner;
  return displayPreferences?.inbox;
}
