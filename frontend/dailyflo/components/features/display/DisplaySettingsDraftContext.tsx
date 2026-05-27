/**
 * DisplaySettingsDraftContext
 *
 * Holds draft display prefs for the nested display modal stack (index + sort/filter pickers).
 * Sub-screens write here immediately; the Display root reads draft + hasChanges and owns the save button.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { DisplaySettingsContext } from '@/components/features/display/displayStackChrome';
import {
  DEFAULT_DISPLAY_DATE_SORT_OPTION_PLANNER,
  DEFAULT_DISPLAY_DATE_SORT_OPTION_TODAY,
  DEFAULT_DISPLAY_ORDERING_OPTION,
  DEFAULT_DISPLAY_SORTING_OPTION,
  type DisplayDateSortOption,
  type DisplayOrderingOption,
  type DisplaySortingOption,
} from '@/components/features/display/displaySortOptions';

const DEFAULT_PRIORITY_SUBLABEL = 'All';

function getDefaultDateSortOption(context: DisplaySettingsContext): DisplayDateSortOption {
  return context === 'today' ? DEFAULT_DISPLAY_DATE_SORT_OPTION_TODAY : DEFAULT_DISPLAY_DATE_SORT_OPTION_PLANNER;
}

export type DisplaySettingsDraft = {
  sortOption: DisplaySortingOption;
  orderingOption: DisplayOrderingOption;
  dateSortOption: DisplayDateSortOption;
  prioritySortSublabel: string;
  showCompletedTasks: boolean;
};

function buildDefaults(context: DisplaySettingsContext): DisplaySettingsDraft {
  return {
    sortOption: DEFAULT_DISPLAY_SORTING_OPTION,
    orderingOption: DEFAULT_DISPLAY_ORDERING_OPTION,
    dateSortOption: getDefaultDateSortOption(context),
    prioritySortSublabel: DEFAULT_PRIORITY_SUBLABEL,
    showCompletedTasks: true,
  };
}

type DisplaySettingsDraftContextValue = {
  draft: DisplaySettingsDraft;
  hasChanges: boolean;
  setSortOption: (option: DisplaySortingOption) => void;
  setOrderingOption: (option: DisplayOrderingOption) => void;
  setDateSortOption: (option: DisplayDateSortOption) => void;
  setPrioritySortSublabel: (value: string) => void;
  setShowCompletedTasks: (value: boolean) => void;
  resetAll: () => void;
};

const DisplaySettingsDraftContext = createContext<DisplaySettingsDraftContextValue | null>(null);

export type DisplaySettingsDraftProviderProps = {
  context: DisplaySettingsContext;
  children: ReactNode;
};

export function DisplaySettingsDraftProvider({ context, children }: DisplaySettingsDraftProviderProps) {
  const defaults = useMemo(() => buildDefaults(context), [context]);
  const [draft, setDraft] = useState<DisplaySettingsDraft>(() => buildDefaults(context));

  const hasChanges = useMemo(
    () =>
      draft.sortOption !== defaults.sortOption ||
      draft.orderingOption !== defaults.orderingOption ||
      // today tab is always scoped to today — date filter is hidden so ignore draft drift
      (context !== 'today' && draft.dateSortOption !== defaults.dateSortOption) ||
      draft.prioritySortSublabel !== defaults.prioritySortSublabel ||
      draft.showCompletedTasks !== defaults.showCompletedTasks,
    [context, draft, defaults]
  );

  const setSortOption = useCallback((option: DisplaySortingOption) => {
    setDraft((prev) => ({ ...prev, sortOption: option }));
  }, []);

  const setOrderingOption = useCallback((option: DisplayOrderingOption) => {
    setDraft((prev) => ({ ...prev, orderingOption: option }));
  }, []);

  const setDateSortOption = useCallback((option: DisplayDateSortOption) => {
    setDraft((prev) => ({ ...prev, dateSortOption: option }));
  }, []);

  const setPrioritySortSublabel = useCallback((value: string) => {
    setDraft((prev) => ({ ...prev, prioritySortSublabel: value }));
  }, []);

  const setShowCompletedTasks = useCallback((value: boolean) => {
    setDraft((prev) => ({ ...prev, showCompletedTasks: value }));
  }, []);

  const resetAll = useCallback(() => {
    setDraft(defaults);
  }, [defaults]);

  const value = useMemo(
    () => ({
      draft,
      hasChanges,
      setSortOption,
      setOrderingOption,
      setDateSortOption,
      setPrioritySortSublabel,
      setShowCompletedTasks,
      resetAll,
    }),
    [
      draft,
      hasChanges,
      setSortOption,
      setOrderingOption,
      setDateSortOption,
      setPrioritySortSublabel,
      setShowCompletedTasks,
      resetAll,
    ]
  );

  return (
    <DisplaySettingsDraftContext.Provider value={value}>{children}</DisplaySettingsDraftContext.Provider>
  );
}

export function useDisplaySettingsDraft() {
  const value = useContext(DisplaySettingsDraftContext);
  if (!value) {
    throw new Error('useDisplaySettingsDraft must be used within DisplaySettingsDraftProvider');
  }
  return value;
}
