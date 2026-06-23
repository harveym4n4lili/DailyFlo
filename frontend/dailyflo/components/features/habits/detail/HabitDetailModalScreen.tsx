/**
 * Habit detail — root formSheet state owner (mirrors TaskEditModalScreen).
 * localValues: title, description — explicit Save only.
 * CreateHabitDraftContext: color, completions, frequency, reminder, list — auto-save on change.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, usePathname } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { useCreateHabitDraft } from '@/app/habit/CreateHabitDraftContext';
import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useHabits } from '@/store/hooks';
import { flushAllPendingHabitIncrementSyncs } from '@/utils/pendingHabitIncrementSyncRegistry';
import { HabitDetailScreenContent } from './HabitDetailScreenContent';
import type { HabitDetailFormValues } from '../forms/habitFormUtils';
import {
  buildHabitPickerUpdateInput,
  completionsPerDayFromHabit,
  habitPickerDraftChanged,
  scheduleDaysFromHabit,
} from '../forms/habitFormUtils';
import type { HabitColor } from '@/types/api/habits';

function normalizeRouteParam(id: string | string[] | undefined): string | undefined {
  if (id == null) return undefined;
  return typeof id === 'string' ? id : id[0];
}

function habitIdFromHabitPath(pathname: string | undefined): string | undefined {
  if (!pathname) return undefined;
  const parts = pathname.split('/').filter(Boolean);
  if (parts[0] !== 'habit' || parts.length < 2) return undefined;
  try {
    const id = decodeURIComponent(parts[1]);
    return id || undefined;
  } catch {
    return parts[1] || undefined;
  }
}

type LocalHabitValues = Pick<HabitDetailFormValues, 'title' | 'description'>;

export default function HabitDetailModalScreen() {
  const router = useGuardedRouter();
  const pathname = usePathname();
  const params = useLocalSearchParams<{ habitId: string }>();
  const themeColors = useThemeColors();
  const { draft, setDraft } = useCreateHabitDraft();
  const { detailHabit, updateHabit, isSaving, fetchHabit, clearHabitDetail } = useHabits();

  const habitId =
    normalizeRouteParam(params.habitId as string | string[] | undefined) ??
    habitIdFromHabitPath(pathname);

  const [localValues, setLocalValues] = useState<LocalHabitValues>({
    title: '',
    description: '',
  });
  const [validationError, setValidationError] = useState<string | null>(null);

  const initialValuesRef = useRef<Pick<HabitDetailFormValues, 'title' | 'description'> | null>(null);
  const initialDraftSyncedRef = useRef(false);
  const prevAutoSaveDraftRef = useRef('');

  useEffect(() => {
    if (habitId) void fetchHabit(habitId);
  }, [habitId, fetchHabit]);

  useEffect(() => {
    return () => {
      flushAllPendingHabitIncrementSyncs();
      clearHabitDetail();
    };
  }, [clearHabitDetail]);

  useEffect(() => {
    if (!habitId || !detailHabit || detailHabit.id !== habitId) return;

    const completionsPerDay = completionsPerDayFromHabit(
      detailHabit.trackingType,
      detailHabit.targetValue,
    );
    const scheduleDays = scheduleDaysFromHabit(
      detailHabit.frequencyType,
      (detailHabit.frequencyConfig ?? {}) as Record<string, unknown>,
    );
    const reminderTime = detailHabit.reminderTime ?? '';

    initialDraftSyncedRef.current = false;
    prevAutoSaveDraftRef.current = '';

    setDraft({
      completionsPerDay,
      scheduleDays,
      reminderTime,
      pickedListId: undefined,
      pickedColor: undefined,
    });

    setLocalValues({
      title: detailHabit.title,
      description: detailHabit.description ?? '',
    });

    initialValuesRef.current = {
      title: detailHabit.title,
      description: detailHabit.description ?? '',
    };
  }, [habitId, detailHabit, setDraft]);

  const values: HabitDetailFormValues = useMemo(
    () => ({
      ...localValues,
      color: draft.pickedColor ?? detailHabit?.color ?? 'green',
      completionsPerDay: draft.completionsPerDay,
      scheduleDays: draft.scheduleDays,
      reminderTime: draft.reminderTime,
      listId:
        draft.pickedListId !== undefined
          ? draft.pickedListId
          : (detailHabit?.listId ?? null),
    }),
    [localValues, draft, detailHabit?.color, detailHabit?.listId],
  );

  // auto-save everything except title/description (skip first run after hydrate)
  useEffect(() => {
    if (!habitId || !detailHabit || detailHabit.id !== habitId) return;
    if (!initialDraftSyncedRef.current) {
      initialDraftSyncedRef.current = true;
      return;
    }
    if (!habitPickerDraftChanged(detailHabit, draft)) return;

    const effectiveColor = draft.pickedColor ?? detailHabit.color;
    const effectiveListId =
      draft.pickedListId !== undefined ? draft.pickedListId : (detailHabit.listId ?? null);
    const draftKey = `${effectiveColor}|${draft.completionsPerDay}|${[...draft.scheduleDays].sort((a, b) => a - b).join(',')}|${draft.reminderTime.trim()}|${effectiveListId ?? 'null'}`;
    if (prevAutoSaveDraftRef.current === draftKey) return;
    prevAutoSaveDraftRef.current = draftKey;

    void (async () => {
      try {
        await updateHabit(
          habitId,
          buildHabitPickerUpdateInput({
            color: effectiveColor,
            completionsPerDay: draft.completionsPerDay,
            scheduleDays: draft.scheduleDays,
            reminderTime: draft.reminderTime,
            listId: effectiveListId,
          }),
        );
        // after server confirms color, drop draft override so we track detailHabit.color
        if (draft.pickedColor != null) {
          setDraft({ pickedColor: undefined });
        }
        if (draft.pickedListId !== undefined) {
          setDraft({ pickedListId: undefined });
        }
      } catch (e) {
        console.error('HabitDetailModalScreen: auto-save failed', e);
      }
    })();
  }, [
    habitId,
    detailHabit,
    draft,
    draft.completionsPerDay,
    draft.scheduleDays,
    draft.reminderTime,
    draft.pickedColor,
    draft.pickedListId,
    updateHabit,
    setDraft,
  ]);

  const onChange = useCallback(
    <K extends keyof HabitDetailFormValues>(key: K, v: HabitDetailFormValues[K]) => {
      setValidationError(null);
      if (key === 'completionsPerDay') {
        setDraft({ completionsPerDay: v as number });
      } else if (key === 'scheduleDays') {
        setDraft({ scheduleDays: v as number[] });
      } else if (key === 'reminderTime') {
        setDraft({ reminderTime: v as string });
      } else if (key === 'listId') {
        setDraft({ pickedListId: v as string | null | undefined });
      } else if (key === 'color') {
        setDraft({ pickedColor: v as HabitColor });
      } else {
        setLocalValues((prev) => ({ ...prev, [key]: v }));
      }
    },
    [setDraft],
  );

  const hasChanges = useMemo(() => {
    if (!initialValuesRef.current) return false;
    const init = initialValuesRef.current;
    return (
      (values.title?.trim() ?? '') !== (init.title ?? '').trim() ||
      (values.description ?? '') !== (init.description ?? '')
    );
  }, [values.title, values.description]);

  const seedPickerDraftFromValues = useCallback(() => {
    setDraft({
      completionsPerDay: values.completionsPerDay,
      scheduleDays: values.scheduleDays,
      reminderTime: values.reminderTime,
      pickedListId: draft.pickedListId,
      pickedColor: draft.pickedColor ?? values.color,
    });
  }, [values, setDraft, draft.pickedListId, draft.pickedColor]);

  const pickerHandlers = useMemo(
    () => ({
      onShowCompletionsPicker: () => {
        seedPickerDraftFromValues();
        router.push('/habit-completions-select' as any);
      },
      onShowFrequencyPicker: () => {
        seedPickerDraftFromValues();
        router.push('/habit-frequency-select' as any);
      },
      onShowReminderPicker: () => {
        seedPickerDraftFromValues();
        router.push('/habit-reminder-select' as any);
      },
      onShowListPicker: () => {
        seedPickerDraftFromValues();
        router.push({ pathname: '/list-select', params: { habitId: habitId! } } as any);
      },
      onShowColorPicker: () => {
        setDraft({ pickedColor: values.color });
        router.push('/habit-color-select' as any);
      },
    }),
    [router, habitId, seedPickerDraftFromValues, setDraft, values.color],
  );

  const handleSave = useCallback(async () => {
    if (!habitId) return;
    const trimmedTitle = values.title.trim();
    if (!trimmedTitle) {
      setValidationError('Habit name is required');
      return;
    }
    setValidationError(null);

    try {
      await updateHabit(habitId, {
        title: trimmedTitle,
        description: values.description.trim(),
      });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      router.back();
    } catch (e) {
      Alert.alert('Could not save habit', e instanceof Error ? e.message : 'Try again');
    }
  }, [habitId, values.title, values.description, updateHabit, router]);

  if (!habitId) {
    return (
      <View style={[styles.loadingRoot, { backgroundColor: themeColors.background.primary() }]}>
        <ActivityIndicator size="large" color={themeColors.primaryButton.fill()} />
      </View>
    );
  }

  return (
    <HabitDetailScreenContent
      habitId={habitId}
      onClose={() => router.back()}
      values={values}
      onChange={onChange}
      hasChanges={hasChanges}
      onSave={handleSave}
      isSaving={isSaving}
      validationError={validationError}
      pickerHandlers={pickerHandlers}
    />
  );
}

const styles = StyleSheet.create({
  loadingRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
