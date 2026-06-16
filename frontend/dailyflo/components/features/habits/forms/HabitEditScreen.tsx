/**
 * edit habit modal — PATCH /habits/:id/ via redux updateHabit thunk.
 * mounted from app/(tabs)/habits/[habitId]/edit route.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';

import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { useThemeColors } from '@/hooks/useColorPalette';
import { Paddings } from '@/constants/Paddings';
import { useHabits } from '@/store/hooks';
import { HabitFormModalShell } from './HabitFormModalShell';
import { HabitFormFields } from './HabitFormFields';
import {
  buildHabitFrequencyConfig,
  isValidHabitReminderTime,
  normalizeHabitReminderTime,
  readCustomDaysFromConfig,
} from './habitFormUtils';
import type {
  CreateHabitInput,
  HabitColor,
  HabitFrequencyType,
  HabitTrackingType,
  UpdateHabitInput,
} from '@/types/api/habits';

export default function HabitEditScreen() {
  const { habitId } = useLocalSearchParams<{ habitId: string }>();
  const router = useGuardedRouter();
  const themeColors = useThemeColors();
  const { fetchHabit, updateHabit, isSaving, detailHabit, isDetailLoading } = useHabits();

  const [title, setTitle] = useState('');
  const [trackingType, setTrackingType] = useState<HabitTrackingType>('binary');
  const [targetValue, setTargetValue] = useState('8');
  const [unitLabel, setUnitLabel] = useState('');
  const [frequencyType, setFrequencyType] = useState<HabitFrequencyType>('daily');
  const [dayOfWeek, setDayOfWeek] = useState(0);
  const [timesPerWeek, setTimesPerWeek] = useState('3');
  const [customDays, setCustomDays] = useState<number[]>([]);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('09:00');
  const [color, setColor] = useState<HabitColor>('green');
  const [hydrated, setHydrated] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (habitId) void fetchHabit(habitId);
    }, [habitId, fetchHabit]),
  );

  useEffect(() => {
    if (!detailHabit || detailHabit.id !== habitId || hydrated) return;
    setTitle(detailHabit.title);
    setTrackingType(detailHabit.trackingType);
    setTargetValue(String(detailHabit.targetValue ?? 8));
    setUnitLabel(detailHabit.unitLabel ?? '');
    setFrequencyType(detailHabit.frequencyType);
    setColor(detailHabit.color);
    const cfg = detailHabit.frequencyConfig ?? {};
    setDayOfWeek(cfg.dayOfWeek ?? cfg.day_of_week ?? 0);
    setTimesPerWeek(String(cfg.targetCount ?? cfg.target_count ?? 3));
    setCustomDays(readCustomDaysFromConfig(cfg as Record<string, unknown>));
    setReminderEnabled(Boolean(detailHabit.reminderTime?.trim()));
    setReminderTime(detailHabit.reminderTime?.trim() || '09:00');
    setHydrated(true);
  }, [detailHabit, habitId, hydrated]);

  const canSubmit = title.trim().length > 0 && !isSaving && hydrated;

  const buildInput = useCallback((): UpdateHabitInput => {
    const input: CreateHabitInput = {
      title: title.trim(),
      color,
      trackingType,
      frequencyType,
      frequencyConfig: buildHabitFrequencyConfig(frequencyType, dayOfWeek, timesPerWeek, customDays),
      reminderTime: normalizeHabitReminderTime(reminderEnabled, reminderTime),
    };
    if (trackingType === 'numeric') {
      input.targetValue = parseInt(targetValue, 10);
      input.unitLabel = unitLabel.trim();
    } else {
      input.targetValue = null;
      input.unitLabel = '';
    }
    return input;
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
  ]);

  const handleSubmit = useCallback(() => {
    if (!habitId || !title.trim()) return;
    if (trackingType === 'numeric') {
      const parsed = parseInt(targetValue, 10);
      if (Number.isNaN(parsed) || parsed < 1) {
        Alert.alert('Invalid target', 'Enter a daily target of at least 1.');
        return;
      }
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
        await updateHabit(habitId, buildInput());
        router.back();
      } catch (e) {
        Alert.alert('Could not save habit', e instanceof Error ? e.message : 'Try again');
      }
    })();
  }, [
    habitId,
    title,
    trackingType,
    targetValue,
    frequencyType,
    timesPerWeek,
    customDays,
    reminderEnabled,
    reminderTime,
    buildInput,
    updateHabit,
    router,
  ]);

  if (!habitId) return null;

  if (isDetailLoading && !hydrated) {
    return (
      <View style={[styles.loading, { backgroundColor: themeColors.background.primary() }]}>
        <ActivityIndicator color={themeColors.text.secondary()} />
      </View>
    );
  }

  return (
    <HabitFormModalShell
      headerTitle="Edit Habit"
      canSubmit={canSubmit}
      onSubmit={handleSubmit}
      submitAccessibilityLabel="Save habit"
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
      />
    </HabitFormModalShell>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Paddings.screen,
  },
});
