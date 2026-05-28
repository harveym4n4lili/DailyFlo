/**
 * Which Display modal sections show per tab + layout view.
 *
 * List view — Sort + Filter always (one list for the day).
 * Timeline view — Filter always; All-day toggle in Layout; Sort only when all-day is on
 * (timeline order is fixed by time; sort applies to the all-day footer ListCard only).
 */

import type { DisplayLayoutView } from '@/components/features/display/displayLayoutOptions';

/** Sort + Ordering rows — hidden on timeline until all-day tasks are enabled */
export function shouldShowDisplaySortSection(
  layoutView: DisplayLayoutView,
  showAllDayTasks: boolean
): boolean {
  if (layoutView === 'list') return true;
  return showAllDayTasks;
}

/** All-day tasks switch — timeline only (list view merges all tasks into one list) */
export function shouldShowDisplayAllDayToggle(layoutView: DisplayLayoutView): boolean {
  return layoutView === 'timeline';
}

/** timeline puts Filter above Sort; list puts Sort above Filter */
export function shouldFilterBeforeSort(layoutView: DisplayLayoutView): boolean {
  return layoutView === 'timeline';
}
