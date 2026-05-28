/** sorting picker labels — persisted per account under display_preferences.{today|planner} */

/** today + planner pickers — no Due Date (tab is already scoped to one calendar day) */
export const DISPLAY_TAB_SORTING_OPTIONS = ['None', 'Added Date', 'Priority'] as const;

export type DisplayTabSortingOption = (typeof DISPLAY_TAB_SORTING_OPTIONS)[number];

/** legacy stored value — still accepted from API but not shown in tab pickers */
export type DisplaySortingOption = DisplayTabSortingOption | 'Due Date';

export const DEFAULT_DISPLAY_SORTING_OPTION: DisplayTabSortingOption = 'None';

/** map saved/API sort to a picker value — Due Date is treated as None for day-scoped tabs */
export function normalizeTabSortOption(
  sortOption?: DisplaySortingOption | string | null
): DisplayTabSortingOption {
  if (sortOption === 'Due Date') return DEFAULT_DISPLAY_SORTING_OPTION;
  if (
    sortOption != null &&
    (DISPLAY_TAB_SORTING_OPTIONS as readonly string[]).includes(sortOption)
  ) {
    return sortOption as DisplayTabSortingOption;
  }
  return DEFAULT_DISPLAY_SORTING_OPTION;
}

/** date filter picker — which due-date window to show on today / planner */
export const DISPLAY_DATE_SORT_OPTIONS = ['All', 'Today', 'This week', 'Next 7 days', 'No date'] as const;

export type DisplayDateSortOption = (typeof DISPLAY_DATE_SORT_OPTIONS)[number];

export const DEFAULT_DISPLAY_DATE_SORT_OPTION_TODAY: DisplayDateSortOption = 'Today';

export const DEFAULT_DISPLAY_DATE_SORT_OPTION_PLANNER: DisplayDateSortOption = 'All';

/** ordering picker — ascending vs descending for the active sort field */
export const DISPLAY_ORDERING_OPTIONS = ['Ascending', 'Descending'] as const;

export type DisplayOrderingOption = (typeof DISPLAY_ORDERING_OPTIONS)[number];

export const DEFAULT_DISPLAY_ORDERING_OPTION: DisplayOrderingOption = 'Ascending';
