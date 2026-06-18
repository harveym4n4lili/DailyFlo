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
  deriveFrequencyFromScheduleDays,
  scheduleDaysFromHabit,
} from './habitFormUtils';
import type { CreateHabitInput, HabitColor, HabitTrackingType, UpdateHabitInput } from '@/types/api/habits';

export default function HabitEditScreen() {
  const { habitId } = useLocalSearchParams<{ habitId: string }>();
  const router = useGuardedRouter();
  const themeColors = useThemeColors();
  const { fetchHabit, updateHabit, isSaving, detailHabit, isDetailLoading } = useHabits();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [trackingType, setTrackingType] = useState<HabitTrackingType>('binary');
  const [targetValue, setTargetValue] = useState('8');
  const [unitLabel, setUnitLabel] = useState('');
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
    setTrackingType(detailHabit.trackingType);
    setTargetValue(String(detailHabit.targetValue ?? 8));
    setUnitLabel(detailHabit.unitLabel ?? '');
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
      input.targetValue = parseInt(targetValue, 10);
      input.unitLabel = unitLabel.trim();
    } else {
      input.targetValue = null;
      input.unitLabel = '';
    }
    return input;
  }, [
    title,
    description,
    color,
    trackingType,
    targetValue,
    unitLabel,
    scheduleDays,
  ]);

  const handleSubmit = useCallback(() => {
    if (!habitId || !title.trim()) return;
    if (scheduleDays.length === 0) {
      Alert.alert('Pick days', 'Select at least one day for this habit.');
      return;
    }
    if (trackingType === 'numeric') {
      const parsed = parseInt(targetValue, 10);
      if (Number.isNaN(parsed) || parsed < 1) {
        Alert.alert('Invalid target', 'Enter a daily target of at least 1.');
        return;
      }
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
    scheduleDays,
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
