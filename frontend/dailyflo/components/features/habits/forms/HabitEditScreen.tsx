/**
 * edit habit modal — PATCH /habits/:id/ via redux updateHabit thunk.
 * mounted from app/(tabs)/habits/[habitId]/edit route.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { Stack, useLocalSearchParams, useFocusEffect } from 'expo-router';

import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { useThemeColors } from '@/hooks/useColorPalette';
import { MainCloseButton, MainSubmitButton } from '@/components/ui/Button';
import {
  IosBrowseModalCloseStackToolbar,
  IosBrowseModalTrailingStackToolbar,
} from '@/components/navigation/IosBrowseModalStackToolbars';
import { GroupedList, FormDetailButton } from '@/components/ui/List/GroupedList';
import { Paddings } from '@/constants/Paddings';
import { useHabits } from '@/store/hooks';
import { HABIT_COLORS, HABIT_FREQUENCIES, HABIT_WEEKDAYS } from './habitFormConstants';
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
    setHydrated(true);
  }, [detailHabit, habitId, hydrated]);

  const canSubmit = title.trim().length > 0 && !isSaving && hydrated;

  const buildInput = useCallback((): UpdateHabitInput => {
    const input: CreateHabitInput = {
      title: title.trim(),
      color,
      trackingType,
      frequencyType,
      frequencyConfig: {},
    };
    if (trackingType === 'numeric') {
      input.targetValue = parseInt(targetValue, 10);
      input.unitLabel = unitLabel.trim();
    } else {
      input.targetValue = null;
      input.unitLabel = '';
    }
    if (frequencyType === 'weekly') {
      input.frequencyConfig = { dayOfWeek };
    } else if (frequencyType === 'times_per_week') {
      input.frequencyConfig = { targetCount: parseInt(timesPerWeek, 10) };
    }
    return input;
  }, [title, color, trackingType, targetValue, unitLabel, frequencyType, dayOfWeek, timesPerWeek]);

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
    void (async () => {
      try {
        await updateHabit(habitId, buildInput());
        router.back();
      } catch (e) {
        Alert.alert('Could not save habit', e instanceof Error ? e.message : 'Try again');
      }
    })();
  }, [habitId, title, trackingType, targetValue, frequencyType, timesPerWeek, buildInput, updateHabit, router]);

  const headerHeight = useHeaderHeight();
  const styles = useMemo(() => createStyles(), []);

  if (!habitId) return null;

  return (
    <>
      <Stack.Screen options={{ title: 'Edit Habit' }} />
      <IosBrowseModalCloseStackToolbar />
      <IosBrowseModalTrailingStackToolbar
        icon="checkmark"
        onPress={handleSubmit}
        disabled={!canSubmit}
        accessibilityLabel="Save habit"
      />
      <View style={[styles.screen, { backgroundColor: themeColors.background.root() }]}>
        {Platform.OS === 'android' ? (
          <View style={[styles.androidBar, { paddingTop: headerHeight }]}>
            <MainCloseButton onPress={() => router.back()} />
            <MainSubmitButton onPress={handleSubmit} disabled={!canSubmit} />
          </View>
        ) : null}
        {isDetailLoading && !hydrated ? (
          <View style={styles.loading}>
            <ActivityIndicator color={themeColors.text.secondary()} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <TextInput
              placeholder="Habit title"
              placeholderTextColor={themeColors.text.tertiary()}
              value={title}
              onChangeText={setTitle}
              style={[
                styles.input,
                {
                  color: themeColors.text.primary(),
                  backgroundColor: themeColors.background.primarySecondaryBlend(),
                },
              ]}
            />
            <GroupedList
              backgroundColor={themeColors.background.primarySecondaryBlend()}
              borderRadius={24}
            >
              {(['binary', 'numeric'] as HabitTrackingType[]).map((t) => (
                <FormDetailButton
                  key={t}
                  label={t === 'binary' ? 'Check off when done' : 'Count toward a target'}
                  value={trackingType === t ? 'Selected' : ''}
                  onPress={() => setTrackingType(t)}
                  showChevron={false}
                />
              ))}
            </GroupedList>
            {trackingType === 'numeric' ? (
              <>
                <TextInput
                  placeholder="Daily target"
                  placeholderTextColor={themeColors.text.tertiary()}
                  value={targetValue}
                  onChangeText={setTargetValue}
                  keyboardType="number-pad"
                  style={[
                    styles.input,
                    {
                      color: themeColors.text.primary(),
                      backgroundColor: themeColors.background.primarySecondaryBlend(),
                    },
                  ]}
                />
                <TextInput
                  placeholder="Unit label (optional)"
                  placeholderTextColor={themeColors.text.tertiary()}
                  value={unitLabel}
                  onChangeText={setUnitLabel}
                  style={[
                    styles.input,
                    {
                      color: themeColors.text.primary(),
                      backgroundColor: themeColors.background.primarySecondaryBlend(),
                    },
                  ]}
                />
              </>
            ) : null}
            <GroupedList
              backgroundColor={themeColors.background.primarySecondaryBlend()}
              borderRadius={24}
            >
              {HABIT_FREQUENCIES.map((f) => (
                <FormDetailButton
                  key={f.id}
                  label={f.label}
                  value={frequencyType === f.id ? 'Selected' : ''}
                  onPress={() => setFrequencyType(f.id)}
                  showChevron={false}
                />
              ))}
            </GroupedList>
            {frequencyType === 'weekly' ? (
              <GroupedList
                backgroundColor={themeColors.background.primarySecondaryBlend()}
                borderRadius={24}
              >
                {HABIT_WEEKDAYS.map((d) => (
                  <FormDetailButton
                    key={d.value}
                    label={d.label}
                    value={dayOfWeek === d.value ? 'Selected' : ''}
                    onPress={() => setDayOfWeek(d.value)}
                    showChevron={false}
                  />
                ))}
              </GroupedList>
            ) : null}
            {frequencyType === 'times_per_week' ? (
              <TextInput
                placeholder="Times per week"
                placeholderTextColor={themeColors.text.tertiary()}
                value={timesPerWeek}
                onChangeText={setTimesPerWeek}
                keyboardType="number-pad"
                style={[
                  styles.input,
                  {
                    color: themeColors.text.primary(),
                    backgroundColor: themeColors.background.primarySecondaryBlend(),
                  },
                ]}
              />
            ) : null}
            <GroupedList
              backgroundColor={themeColors.background.primarySecondaryBlend()}
              borderRadius={24}
            >
              {HABIT_COLORS.map((c) => (
                <FormDetailButton
                  key={c}
                  label={c.charAt(0).toUpperCase() + c.slice(1)}
                  value={color === c ? 'Selected' : ''}
                  onPress={() => setColor(c)}
                  showChevron={false}
                />
              ))}
            </GroupedList>
          </ScrollView>
        )}
      </View>
    </>
  );
}

const createStyles = () =>
  StyleSheet.create({
    screen: { flex: 1 },
    androidBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: Paddings.screen,
    },
    loading: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scroll: {
      padding: Paddings.screen,
      gap: Paddings.sectionCompact,
      paddingBottom: Paddings.scrollBottomExtra + Paddings.sectionCompact,
    },
    input: {
      borderRadius: Paddings.formDataPillRadius,
      paddingHorizontal: Paddings.groupedListContentHorizontal,
      paddingVertical: Paddings.listItemVertical,
      fontSize: 16,
    },
  });
