/**
 * DisplaySettingsDraftContext
 *
 * Holds draft display prefs for the nested display modal stack (index + sort/filter pickers).
 * Sub-screens write here immediately; the Display root reads draft + hasChanges and owns the save button.
 * Applied prefs hydrate from auth.user.preferences.displayPreferences (per account).
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
  buildDisplayDraftDefaults,
  getSavedTabDisplayPrefs,
  mergeSavedDisplayPrefsIntoDraft,
} from '@/components/features/display/displayPreferenceDefaults';
import type { DisplayLayoutView } from '@/components/features/display/displayLayoutOptions';
import {
  type DisplayDateSortOption,
  type DisplayOrderingOption,
  type DisplayTabSortingOption,
} from '@/components/features/display/displaySortOptions';
import { useAppSelector } from '@/store';

export type DisplaySettingsDraft = ReturnType<typeof buildDisplayDraftDefaults>;

function draftsEqual(a: DisplaySettingsDraft, b: DisplaySettingsDraft, context: DisplaySettingsContext): boolean {
  return (
    a.layoutView === b.layoutView &&
    a.sortOption === b.sortOption &&
    a.orderingOption === b.orderingOption &&
    a.showCompletedTasks === b.showCompletedTasks &&
    a.prioritySortSublabel === b.prioritySortSublabel &&
    a.showAllDayTasks === b.showAllDayTasks
  );
}

type DisplaySettingsDraftContextValue = {
  draft: DisplaySettingsDraft;
  hasChanges: boolean;
  setLayoutView: (view: DisplayLayoutView) => void;
  setSortOption: (option: DisplayTabSortingOption) => void;
  setOrderingOption: (option: DisplayOrderingOption) => void;
  setDateSortOption: (option: DisplayDateSortOption) => void;
  setPrioritySortSublabel: (value: string) => void;
  setShowCompletedTasks: (value: boolean) => void;
  setShowAllDayTasks: (value: boolean) => void;
  resetAll: () => void;
};

const DisplaySettingsDraftContext = createContext<DisplaySettingsDraftContextValue | null>(null);

export type DisplaySettingsDraftProviderProps = {
  context: DisplaySettingsContext;
  children: ReactNode;
};

export function DisplaySettingsDraftProvider({ context, children }: DisplaySettingsDraftProviderProps) {
  const displayPreferences = useAppSelector((s) => s.auth.user?.preferences?.displayPreferences);
  const savedTabPrefs = getSavedTabDisplayPrefs(displayPreferences, context);

  // applied = saved server prefs merged with defaults — hasChanges compares draft to this
  const appliedDraft = useMemo(
    () => mergeSavedDisplayPrefsIntoDraft(context, savedTabPrefs),
    [context, savedTabPrefs]
  );

  const defaults = useMemo(() => buildDisplayDraftDefaults(context), [context]);
  const [draft, setDraft] = useState<DisplaySettingsDraft>(() => appliedDraft);

  const hasChanges = useMemo(
    () => !draftsEqual(draft, appliedDraft, context),
    [draft, appliedDraft, context]
  );

  const setLayoutView = useCallback((view: DisplayLayoutView) => {
    setDraft((prev) => ({ ...prev, layoutView: view }));
  }, []);

  const setSortOption = useCallback((option: DisplayTabSortingOption) => {
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

  const setShowAllDayTasks = useCallback((value: boolean) => {
    setDraft((prev) => ({ ...prev, showAllDayTasks: value }));
  }, []);

  const resetAll = useCallback(() => {
    setDraft(defaults);
  }, [defaults]);

  const value = useMemo(
    () => ({
      draft,
      hasChanges,
      setLayoutView,
      setSortOption,
      setOrderingOption,
      setDateSortOption,
      setPrioritySortSublabel,
      setShowCompletedTasks,
      setShowAllDayTasks,
      resetAll,
    }),
    [
      draft,
      hasChanges,
      setLayoutView,
      setSortOption,
      setOrderingOption,
      setDateSortOption,
      setPrioritySortSublabel,
      setShowCompletedTasks,
      setShowAllDayTasks,
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
