/**
 * create habit modal — POST /habits/ via redux createHabit thunk.
 * mounted from app/(tabs)/habits/create route.
 */

import React, { useCallback, useState } from 'react';
import { Alert } from 'react-native';

import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { useHabits } from '@/store/hooks';
import { HabitFormModalShell } from './HabitFormModalShell';
import { HabitFormFields } from './HabitFormFields';
import {
  buildHabitFrequencyConfig,
  deriveFrequencyFromScheduleDays,
  getDefaultScheduleDays,
  habitTrackingFromCompletionsPerDay,
  MIN_HABIT_COMPLETIONS_PER_DAY,
} from './habitFormUtils';
import type { CreateHabitInput, HabitColor } from '@/types/api/habits';

export default function HabitCreateScreen() {
  const router = useGuardedRouter();
  const { createHabit, isSaving } = useHabits();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [completionsPerDay, setCompletionsPerDay] = useState(MIN_HABIT_COMPLETIONS_PER_DAY);
  const [scheduleDays, setScheduleDays] = useState<number[]>(getDefaultScheduleDays);
  const [color, setColor] = useState<HabitColor>('green');

  const canSubmit = title.trim().length > 0 && !isSaving;

  const handleSubmit = useCallback(() => {
    if (!title.trim() || isSaving) return;

    if (scheduleDays.length === 0) {
      Alert.alert('Pick days', 'Select at least one day for this habit.');
      return;
    }

    const { frequencyType, dayOfWeek, customDays } = deriveFrequencyFromScheduleDays(scheduleDays);
    const { trackingType, targetValue } = habitTrackingFromCompletionsPerDay(completionsPerDay);

    const input: CreateHabitInput = {
      title: title.trim(),
      description: description.trim(),
      color,
      trackingType,
      targetValue,
      frequencyType,
      frequencyConfig: buildHabitFrequencyConfig(frequencyType, dayOfWeek, '', customDays),
      reminderTime: '',
    };

    void (async () => {
      try {
        await createHabit(input);
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
    createHabit,
    router,
    isSaving,
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
        onTitleChange={setTitle}
        onDescriptionChange={setDescription}
        onColorChange={setColor}
        onCompletionsPerDayChange={setCompletionsPerDay}
        onScheduleDaysChange={setScheduleDays}
        autoFocusTitle
      />
    </HabitFormModalShell>
  );
}
