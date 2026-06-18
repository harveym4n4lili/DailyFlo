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
  completionsPerDayFromHabit,
  deriveFrequencyFromScheduleDays,
  habitTrackingFromCompletionsPerDay,
  MIN_HABIT_COMPLETIONS_PER_DAY,
  scheduleDaysFromHabit,
} from './habitFormUtils';
import type { CreateHabitInput, HabitColor, UpdateHabitInput } from '@/types/api/habits';

export default function HabitEditScreen() {
  const { habitId } = useLocalSearchParams<{ habitId: string }>();
  const router = useGuardedRouter();
  const themeColors = useThemeColors();
  const { fetchHabit, updateHabit, isSaving, detailHabit, isDetailLoading } = useHabits();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [completionsPerDay, setCompletionsPerDay] = useState(MIN_HABIT_COMPLETIONS_PER_DAY);
  const [scheduleDays, setScheduleDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
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
    setDescription(detailHabit.description ?? '');
    setCompletionsPerDay(
      completionsPerDayFromHabit(detailHabit.trackingType, detailHabit.targetValue),
    );
    setColor(detailHabit.color);
    setScheduleDays(
      scheduleDaysFromHabit(
        detailHabit.frequencyType,
        (detailHabit.frequencyConfig ?? {}) as Record<string, unknown>,
      ),
    );
    setHydrated(true);
  }, [detailHabit, habitId, hydrated]);

  const canSubmit = title.trim().length > 0 && !isSaving && hydrated;

  const buildInput = useCallback((): UpdateHabitInput => {
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
    return input;
  }, [title, description, color, completionsPerDay, scheduleDays]);

  const handleSubmit = useCallback(() => {
    if (!habitId || !title.trim()) return;
    if (scheduleDays.length === 0) {
      Alert.alert('Pick days', 'Select at least one day for this habit.');
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
  }, [habitId, title, scheduleDays, buildInput, updateHabit, router]);

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
        description={description}
        color={color}
        completionsPerDay={completionsPerDay}
        scheduleDays={scheduleDays}
        onTitleChange={setTitle}
        onDescriptionChange={setDescription}
        onColorChange={setColor}
        onCompletionsPerDayChange={setCompletionsPerDay}
        onScheduleDaysChange={setScheduleDays}
        descriptionInputKey={hydrated ? habitId : undefined}
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
