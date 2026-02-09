/**
 * CreateTaskDraftContext
 *
 * Holds the "picker" form fields (dueDate, time, duration, alerts) that are edited
 * on stack screens (date-select, time-duration-select, alert-select) so they stay
 * in sync with the main task form (index). All screens in the task
 * stack read/write this context so we don't need to pass params when pushing.
 */

import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export interface CreateTaskDraftSlice {
  dueDate: string | undefined;
  time: string | undefined;
  duration: number | undefined;
  alerts: string[];
}

interface CreateTaskDraftContextValue {
  draft: CreateTaskDraftSlice;
  setDueDate: (date: string | undefined) => void;
  setTime: (time: string | undefined) => void;
  setDuration: (duration: number | undefined) => void;
  setAlerts: (alertIds: string[]) => void;
  /** Replace the whole draft slice (e.g. when index initializes from params) */
  setDraft: (slice: Partial<CreateTaskDraftSlice>) => void;
}

const defaultDraft: CreateTaskDraftSlice = {
  dueDate: undefined,
  time: undefined,
  duration: undefined,
  alerts: [],
};

const CreateTaskDraftContext = createContext<CreateTaskDraftContextValue | null>(null);

export function CreateTaskDraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraftState] = useState<CreateTaskDraftSlice>(defaultDraft);

  const setDueDate = useCallback((date: string | undefined) => {
    setDraftState((prev) => ({ ...prev, dueDate: date }));
  }, []);
  const setTime = useCallback((time: string | undefined) => {
    setDraftState((prev) => ({ ...prev, time }));
  }, []);
  const setDuration = useCallback((duration: number | undefined) => {
    setDraftState((prev) => ({ ...prev, duration }));
  }, []);
  const setAlerts = useCallback((alertIds: string[]) => {
    setDraftState((prev) => ({ ...prev, alerts: alertIds }));
  }, []);
  const setDraft = useCallback((slice: Partial<CreateTaskDraftSlice>) => {
    setDraftState((prev) => ({ ...prev, ...slice }));
  }, []);

  const value: CreateTaskDraftContextValue = {
    draft,
    setDueDate,
    setTime,
    setDuration,
    setAlerts,
    setDraft,
  };

  return (
    <CreateTaskDraftContext.Provider value={value}>
      {children}
    </CreateTaskDraftContext.Provider>
  );
}

export function useCreateTaskDraft() {
  const ctx = useContext(CreateTaskDraftContext);
  if (!ctx) {
    throw new Error('useCreateTaskDraft must be used within CreateTaskDraftProvider');
  }
  return ctx;
}
