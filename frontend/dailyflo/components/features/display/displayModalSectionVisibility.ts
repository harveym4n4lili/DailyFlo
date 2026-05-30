/**
 * Which Display modal sections show per tab + layout view.
 *
 * List view — Sort + Filter always (one list for the day).
 * Timeline view — Filter always; All-day toggle in Layout; Sort only when all-day is on
 * (timeline order is fixed by time; sort applies to the all-day footer ListCard only).
 */

import type { DisplayLayoutView } from '@/components/features/display/displayLayoutOptions';
import type { DisplaySettingsContext } from '@/components/features/display/displayStackChrome';

/** Sort + Ordering rows — hidden on timeline until all-day is on; inbox always shows sort (list-only UI) */
export function shouldShowDisplaySortSection(
  layoutView: DisplayLayoutView,
  showAllDayTasks: boolean,
  context?: DisplaySettingsContext
): boolean {
  if (context === 'inbox') return true;
  if (layoutView === 'list') return true;
  return showAllDayTasks;
}

/** List vs timeline picker — inbox is list-only for now */
export function shouldShowDisplayLayoutViewSelector(context?: DisplaySettingsContext): boolean {
  if (context === 'inbox') return false;
  return true;
}

/** All-day tasks switch — timeline only; inbox has no timeline implementation yet */
export function shouldShowDisplayAllDayToggle(
  layoutView: DisplayLayoutView,
  context?: DisplaySettingsContext
): boolean {
  if (context === 'inbox') return false;
  return layoutView === 'timeline';
}

/** timeline puts Filter above Sort; list puts Sort above Filter; inbox uses list order */
export function shouldFilterBeforeSort(
  layoutView: DisplayLayoutView,
  context?: DisplaySettingsContext
): boolean {
  if (context === 'inbox') return false;
  return layoutView === 'timeline';
}
