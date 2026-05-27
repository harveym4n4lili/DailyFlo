/** sorting picker labels — local screen state only until task reload / filter wiring */

export const DISPLAY_SORTING_OPTIONS = ['None', 'Due Date', 'Added Date', 'Priority'] as const;

export type DisplaySortingOption = (typeof DISPLAY_SORTING_OPTIONS)[number];

export const DEFAULT_DISPLAY_SORTING_OPTION: DisplaySortingOption = 'None';

/** date filter picker — which due-date window to show on today / planner */
export const DISPLAY_DATE_SORT_OPTIONS = ['All', 'Today', 'This week', 'Next 7 days', 'No date'] as const;

export type DisplayDateSortOption = (typeof DISPLAY_DATE_SORT_OPTIONS)[number];

export const DEFAULT_DISPLAY_DATE_SORT_OPTION_TODAY: DisplayDateSortOption = 'Today';

export const DEFAULT_DISPLAY_DATE_SORT_OPTION_PLANNER: DisplayDateSortOption = 'All';

/** ordering picker — ascending vs descending for the active sort field */
export const DISPLAY_ORDERING_OPTIONS = ['Ascending', 'Descending'] as const;

export type DisplayOrderingOption = (typeof DISPLAY_ORDERING_OPTIONS)[number];

export const DEFAULT_DISPLAY_ORDERING_OPTION: DisplayOrderingOption = 'Ascending';
