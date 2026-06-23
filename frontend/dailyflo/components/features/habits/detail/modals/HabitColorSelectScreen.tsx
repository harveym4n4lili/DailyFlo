/**
 * Color picker — root route /habit-color-select.
 * Same ColorCirclePicker grid as habit create/edit (HabitFormFields).
 */

import React, { useCallback } from 'react';

import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { ColorCirclePicker } from '@/components/ui/ColorCirclePicker';
import { useCreateHabitDraft } from '@/app/habit/CreateHabitDraftContext';
import { HABIT_COLORS } from '@/components/features/habits/forms/habitFormConstants';
import type { HabitColor } from '@/types/api/habits';
import { HabitPickerSheetChrome } from './HabitPickerSheetChrome';

export function HabitColorSelectScreen() {
  const router = useGuardedRouter();
  const { draft, setDraft } = useCreateHabitDraft();

  const selectedColor = draft.pickedColor ?? 'green';

  const handleSelectColor = useCallback(
    (color: HabitColor) => {
      setDraft({ pickedColor: color });
    },
    [setDraft],
  );

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <HabitPickerSheetChrome title="Color" onClose={handleClose}>
      <ColorCirclePicker<HabitColor>
        selectedColor={selectedColor}
        onChange={handleSelectColor}
        colors={HABIT_COLORS}
      />
    </HabitPickerSheetChrome>
  );
}
