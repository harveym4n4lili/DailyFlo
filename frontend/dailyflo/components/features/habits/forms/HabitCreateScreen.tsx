/**
 * create habit modal — POST /habits/ via redux createHabit thunk.
 * mounted from app/(tabs)/habits/create route.
 */

import React, { useCallback, useMemo, useState } from 'react';
import { Alert } from 'react-native';

import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { useCreateHabitDraft } from '@/app/habit/CreateHabitDraftContext';
import { useHabits, useLists } from '@/store/hooks';
import { HabitFormModalShell } from './HabitFormModalShell';
import { HabitFormFields } from './HabitFormFields';
import {
  buildHabitUpdateInput,
  getDefaultScheduleDays,
  MIN_HABIT_COMPLETIONS_PER_DAY,
} from './habitFormUtils';
import type { CreateHabitInput, HabitColor } from '@/types/api/habits';

export default function HabitCreateScreen() {
  const router = useGuardedRouter();
  const { createHabit, isSaving } = useHabits();
  const { draft, setDraft } = useCreateHabitDraft();
  const { lists: reduxLists } = useLists();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [completionsPerDay, setCompletionsPerDay] = useState(MIN_HABIT_COMPLETIONS_PER_DAY);
  const [scheduleDays, setScheduleDays] = useState<number[]>(getDefaultScheduleDays);
  const [color, setColor] = useState<HabitColor>('green');

  const listRowValue = useMemo(() => {
    const picked = draft.pickedListId;
    if (picked === undefined || picked === null) return 'Habits';
    const match = reduxLists.find((l) => l.id === picked && !l.softDeleted);
    return match?.name ?? 'Habits';
  }, [draft.pickedListId, reduxLists]);

  const handleShowListPicker = useCallback(() => {
    // forHabit tells list-select to write CreateHabitDraftContext (not task draft)
    router.push({ pathname: '/list-select', params: { forHabit: '1' } } as any);
  }, [router]);

  const canSubmit = title.trim().length > 0 && !isSaving;

  const handleSubmit = useCallback(() => {
    if (!title.trim() || isSaving) return;

    if (scheduleDays.length === 0) {
      Alert.alert('Pick days', 'Select at least one day for this habit.');
      return;
    }

    const listId =
      draft.pickedListId === undefined ? null : draft.pickedListId;

    const input: CreateHabitInput = buildHabitUpdateInput({
      title,
      description,
      color,
      completionsPerDay,
      scheduleDays,
      reminderTime: '',
      listId,
    }) as CreateHabitInput;

    void (async () => {
      try {
        await createHabit(input);
        setDraft({ pickedListId: undefined });
        router.back();
      } catch (e) {
        Alert.alert('Could not create habit', e instanceof Error ? e.message : 'Try again');
      }
    })();
  }, [
    title,
    description,
    color,
    completionsPerDay,
    scheduleDays,
    draft.pickedListId,
    createHabit,
    router,
    isSaving,
    setDraft,
  ]);

  return (
    <HabitFormModalShell
      headerTitle="New Habit"
      canSubmit={canSubmit}
      onSubmit={handleSubmit}
      submitAccessibilityLabel="Create habit"
    >
      <HabitFormFields
        title={title}
        description={description}
        color={color}
        completionsPerDay={completionsPerDay}
        scheduleDays={scheduleDays}
        listRowValue={listRowValue}
        onTitleChange={setTitle}
        onDescriptionChange={setDescription}
        onColorChange={setColor}
        onCompletionsPerDayChange={setCompletionsPerDay}
        onScheduleDaysChange={setScheduleDays}
        onListPress={handleShowListPicker}
        autoFocusTitle
      />
    </HabitFormModalShell>
  );
}
