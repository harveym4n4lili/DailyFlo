/** layout picker — list vs timeline on today / planner dashboards */

export const DISPLAY_LAYOUT_VIEWS = ['list', 'timeline'] as const;

export type DisplayLayoutView = (typeof DISPLAY_LAYOUT_VIEWS)[number];

export const DISPLAY_LAYOUT_VIEW_OPTIONS: ReadonlyArray<{
  id: DisplayLayoutView;
  label: string;
}> = [
  { id: 'list', label: 'List view' },
  { id: 'timeline', label: 'Timeline view' },
];

/** fallback when no tab context — same as today */
export const DEFAULT_DISPLAY_LAYOUT_VIEW: DisplayLayoutView = 'list';

/** today dashboard default — list of tasks for the day */
export const DEFAULT_DISPLAY_LAYOUT_VIEW_TODAY: DisplayLayoutView = 'list';

/** planner dashboard default — timed timeline + optional all-day footer */
export const DEFAULT_DISPLAY_LAYOUT_VIEW_PLANNER: DisplayLayoutView = 'timeline';
