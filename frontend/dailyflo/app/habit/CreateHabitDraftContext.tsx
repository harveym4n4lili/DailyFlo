/**
 * CreateHabitDraftContext
 *
 * Holds picker fields edited on root stack sheets (completions, frequency, reminder, list, color)
 * so they stay in sync with habit detail. pickedListId: null = inbox-style default,
 * string = list id, undefined = use server/form value until user opens list-select.
 */

import React, { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

import { MIN_HABIT_COMPLETIONS_PER_DAY, getDefaultScheduleDays } from '@/components/features/habits/forms/habitFormUtils';
import type { HabitColor } from '@/types/api/habits';

export interface CreateHabitDraftSlice {
  completionsPerDay: number;
  scheduleDays: number[];
  /** empty string = reminder off */
  reminderTime: string;
  pickedListId?: string | null;
  /** undefined = use localValues.color until user opens color picker */
  pickedColor?: HabitColor;
}

interface CreateHabitDraftContextValue {
  draft: CreateHabitDraftSlice;
  setCompletionsPerDay: (value: number) => void;
  setScheduleDays: (days: number[]) => void;
  setReminderTime: (time: string) => void;
  setDraft: (slice: Partial<CreateHabitDraftSlice>) => void;
}

const defaultDraft: CreateHabitDraftSlice = {
  completionsPerDay: MIN_HABIT_COMPLETIONS_PER_DAY,
  scheduleDays: getDefaultScheduleDays(),
  reminderTime: '',
};

const CreateHabitDraftContext = createContext<CreateHabitDraftContextValue | null>(null);

export function CreateHabitDraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraftState] = useState<CreateHabitDraftSlice>(defaultDraft);

  const setCompletionsPerDay = useCallback((value: number) => {
    setDraftState((prev) => ({ ...prev, completionsPerDay: value }));
  }, []);

  const setScheduleDays = useCallback((days: number[]) => {
    setDraftState((prev) => ({ ...prev, scheduleDays: days }));
  }, []);

  const setReminderTime = useCallback((time: string) => {
    setDraftState((prev) => ({ ...prev, reminderTime: time }));
  }, []);

  const setDraft = useCallback((slice: Partial<CreateHabitDraftSlice>) => {
    setDraftState((prev) => ({ ...prev, ...slice }));
  }, []);

  const value: CreateHabitDraftContextValue = {
    draft,
    setCompletionsPerDay,
    setScheduleDays,
    setReminderTime,
    setDraft,
  };

  return (
    <CreateHabitDraftContext.Provider value={value}>{children}</CreateHabitDraftContext.Provider>
  );
}

export function useCreateHabitDraft() {
  const ctx = useContext(CreateHabitDraftContext);
  if (!ctx) {
    throw new Error('useCreateHabitDraft must be used within CreateHabitDraftProvider');
  }
  return ctx;
}
