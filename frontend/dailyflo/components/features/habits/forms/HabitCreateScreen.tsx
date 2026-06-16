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
  isValidHabitReminderTime,
  normalizeHabitReminderTime,
} from './habitFormUtils';
import type { CreateHabitInput, HabitColor, HabitFrequencyType, HabitTrackingType } from '@/types/api/habits';

export default function HabitCreateScreen() {
  const router = useGuardedRouter();
  const { createHabit, isSaving } = useHabits();

  const [title, setTitle] = useState('');
  const [trackingType, setTrackingType] = useState<HabitTrackingType>('binary');
  const [targetValue, setTargetValue] = useState('8');
  const [unitLabel, setUnitLabel] = useState('');
  const [frequencyType, setFrequencyType] = useState<HabitFrequencyType>('daily');
  const [dayOfWeek, setDayOfWeek] = useState(0);
  const [timesPerWeek, setTimesPerWeek] = useState('3');
  const [customDays, setCustomDays] = useState<number[]>([0, 2, 4]);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('09:00');
  const [color, setColor] = useState<HabitColor>('green');

  const canSubmit = title.trim().length > 0 && !isSaving;

  const handleSubmit = useCallback(() => {
    if (!title.trim()) return;

    const input: CreateHabitInput = {
      title: title.trim(),
      color,
      trackingType,
      frequencyType,
      frequencyConfig: buildHabitFrequencyConfig(frequencyType, dayOfWeek, timesPerWeek, customDays),
      reminderTime: normalizeHabitReminderTime(reminderEnabled, reminderTime),
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

    if (frequencyType === 'times_per_week') {
      const count = parseInt(timesPerWeek, 10);
      if (Number.isNaN(count) || count < 1) {
        Alert.alert('Invalid count', 'Enter how many times per week (at least 1).');
        return;
      }
    }

    if (frequencyType === 'custom' && customDays.length === 0) {
      Alert.alert('Pick days', 'Select at least one day for a custom schedule.');
      return;
    }

    if (reminderEnabled && !isValidHabitReminderTime(reminderTime)) {
      Alert.alert('Invalid time', 'Enter reminder time as HH:MM (e.g. 09:00).');
      return;
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
    color,
    trackingType,
    targetValue,
    unitLabel,
    frequencyType,
    dayOfWeek,
    timesPerWeek,
    customDays,
    reminderEnabled,
    reminderTime,
    createHabit,
    router,
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
        trackingType={trackingType}
        targetValue={targetValue}
        unitLabel={unitLabel}
        frequencyType={frequencyType}
        dayOfWeek={dayOfWeek}
        timesPerWeek={timesPerWeek}
        customDays={customDays}
        reminderEnabled={reminderEnabled}
        reminderTime={reminderTime}
        color={color}
        onTitleChange={setTitle}
        onTrackingTypeChange={setTrackingType}
        onTargetValueChange={setTargetValue}
        onUnitLabelChange={setUnitLabel}
        onFrequencyTypeChange={setFrequencyType}
        onDayOfWeekChange={setDayOfWeek}
        onTimesPerWeekChange={setTimesPerWeek}
        onCustomDaysChange={setCustomDays}
        onReminderEnabledChange={setReminderEnabled}
        onReminderTimeChange={setReminderTime}
        onColorChange={setColor}
        showCreateHint
        autoFocusTitle
      />
    </HabitFormModalShell>
  );
}
