/**
 * Completions per day picker — root route /habit-completions-select.
 * reads/writes CreateHabitDraftContext; parent auto-saves on return.
 */

import React, { useCallback } from 'react';

import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { useCreateHabitDraft } from '@/app/habit/CreateHabitDraftContext';
import { HabitCompletionsPickerBody } from '@/components/features/habits/forms/HabitCompletionsPickerBody';
import { HabitPickerSheetChrome } from './HabitPickerSheetChrome';

export function HabitCompletionsSelectScreen() {
  const router = useGuardedRouter();
  const { draft, setCompletionsPerDay } = useCreateHabitDraft();

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <HabitPickerSheetChrome title="Completions per day" onClose={handleClose}>
      <HabitCompletionsPickerBody
        value={draft.completionsPerDay}
        onChange={setCompletionsPerDay}
        showSectionHeader={false}
      />
    </HabitPickerSheetChrome>
  );
}
