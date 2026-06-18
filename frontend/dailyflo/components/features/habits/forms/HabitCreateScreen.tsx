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
} from './habitFormUtils';
import type { CreateHabitInput, HabitColor, HabitTrackingType } from '@/types/api/habits';

export default function HabitCreateScreen() {
  const router = useGuardedRouter();
  const { createHabit, isSaving } = useHabits();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [trackingType, setTrackingType] = useState<HabitTrackingType>('binary');
  const [targetValue, setTargetValue] = useState('8');
  const [unitLabel, setUnitLabel] = useState('');
  const [scheduleDays, setScheduleDays] = useState<number[]>(getDefaultScheduleDays);
  const color: HabitColor = 'green';

  const canSubmit = title.trim().length > 0 && !isSaving;

  const handleSubmit = useCallback(() => {
    if (!title.trim() || isSaving) return;

    if (scheduleDays.length === 0) {
      Alert.alert('Pick days', 'Select at least one day for this habit.');
      return;
    }

    const { frequencyType, dayOfWeek, customDays } = deriveFrequencyFromScheduleDays(scheduleDays);

    const input: CreateHabitInput = {
      title: title.trim(),
      description: description.trim(),
      color,
      trackingType,
      frequencyType,
      frequencyConfig: buildHabitFrequencyConfig(frequencyType, dayOfWeek, '', customDays),
      reminderTime: '',
    };

    if (trackingType === 'numeric') {
      const parsed = parseInt(targetValue, 10);
      if (Number.isNaN(parsed) || parsed < 1) {
        Alert.alert('Invalid target', 'Enter a daily target of at least 1.');
        return;
      }
      input.targetValue = parsed;
      input.unitLabel = unitLabel.trim();
    }

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
    trackingType,
    targetValue,
    unitLabel,
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
        trackingType={trackingType}
        targetValue={targetValue}
        unitLabel={unitLabel}
        scheduleDays={scheduleDays}
        onTitleChange={setTitle}
        onDescriptionChange={setDescription}
        onTrackingTypeChange={setTrackingType}
        onTargetValueChange={setTargetValue}
        onUnitLabelChange={setUnitLabel}
        onScheduleDaysChange={setScheduleDays}
        autoFocusTitle
      />
    </HabitFormModalShell>
  );
}
