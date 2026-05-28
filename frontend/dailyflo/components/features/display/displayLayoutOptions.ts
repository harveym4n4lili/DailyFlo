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

export const DEFAULT_DISPLAY_LAYOUT_VIEW: DisplayLayoutView = 'list';
