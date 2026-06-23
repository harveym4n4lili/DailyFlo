/**
 * Frequency picker — root route /habit-frequency-select.
 * reads/writes CreateHabitDraftContext; parent auto-saves on return.
 */

import React, { useCallback } from 'react';

import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { useCreateHabitDraft } from '@/app/habit/CreateHabitDraftContext';
import { HabitFrequencyPickerBody } from '@/components/features/habits/forms/HabitFrequencyPickerBody';
import { HabitPickerSheetChrome } from './HabitPickerSheetChrome';

export function HabitFrequencySelectScreen() {
  const router = useGuardedRouter();
  const { draft, setScheduleDays } = useCreateHabitDraft();

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <HabitPickerSheetChrome title="Frequency" onClose={handleClose}>
      <HabitFrequencyPickerBody
        scheduleDays={draft.scheduleDays}
        onScheduleDaysChange={setScheduleDays}
        showSectionHeader={false}
      />
    </HabitPickerSheetChrome>
  );
}
