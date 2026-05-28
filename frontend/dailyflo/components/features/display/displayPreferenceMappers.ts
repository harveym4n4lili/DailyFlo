/**
 * Map saved/applied display prefs → ListCard sort + completed visibility props.
 */

import {
  DEFAULT_DISPLAY_ORDERING_OPTION,
  DEFAULT_DISPLAY_SORTING_OPTION,
  normalizeTabSortOption,
  type DisplayOrderingOption,
} from '@/components/features/display/displaySortOptions';
import type { TabDisplayPreferences } from '@/types/common/User';

export type ListCardSortBy = 'none' | 'createdAt' | 'dueDate' | 'priority' | 'title';
export type ListCardSortDirection = 'asc' | 'desc';

export type TodayListCardDisplayProps = {
  sortBy: ListCardSortBy;
  sortDirection: ListCardSortDirection;
  hideCompletedTasks: boolean;
};

function mapSortOptionToListCardSortBy(
  sortOption: ReturnType<typeof normalizeTabSortOption>
): ListCardSortBy {
  switch (sortOption) {
    case 'Added Date':
      return 'createdAt';
    case 'Priority':
      return 'priority';
    case 'None':
    default:
      return 'none';
  }
}

function mapOrderingToSortDirection(ordering: DisplayOrderingOption): ListCardSortDirection {
  return ordering === 'Descending' ? 'desc' : 'asc';
}

/** shared sort + completed mapping for tab ListCard sections */
function mapTabDisplayPrefsToListCardSort(
  saved?: TabDisplayPreferences | null
): TodayListCardDisplayProps {
  const sortOption = normalizeTabSortOption(saved?.sortOption ?? DEFAULT_DISPLAY_SORTING_OPTION);
  const orderingOption = saved?.orderingOption ?? DEFAULT_DISPLAY_ORDERING_OPTION;
  const showCompletedTasks = saved?.showCompletedTasks ?? true;

  return {
    sortBy: mapSortOptionToListCardSortBy(sortOption),
    sortDirection: mapOrderingToSortDirection(orderingOption),
    hideCompletedTasks: !showCompletedTasks,
  };
}

/** today tab: read auth prefs and produce ListCard props */
export function mapTodayDisplayPrefsToListCard(
  saved?: TabDisplayPreferences | null
): TodayListCardDisplayProps {
  return mapTabDisplayPrefsToListCardSort(saved);
}

export type PlannerAllDayListDisplayProps = TodayListCardDisplayProps & {
  /** when false, planner hides the all-day footer ListCard entirely */
  showAllDayTasks: boolean;
};

/** planner tab: sort/completed apply to all-day footer only — timeline order unchanged */
export function mapPlannerDisplayPrefsToAllDayList(
  saved?: TabDisplayPreferences | null
): PlannerAllDayListDisplayProps {
  return {
    ...mapTabDisplayPrefsToListCardSort(saved),
    showAllDayTasks: saved?.showAllDayTasks ?? true,
  };
}
