/**
 * create habit modal — POST /habits/ via redux createHabit thunk.
 * mounted from app/(tabs)/habits/create route.
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { Stack } from 'expo-router';

import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { MainCloseButton, MainSubmitButton } from '@/components/ui/Button';
import {
  IosBrowseModalCloseStackToolbar,
  IosBrowseModalTrailingStackToolbar,
} from '@/components/navigation/IosBrowseModalStackToolbars';
import { GroupedList, FormDetailButton } from '@/components/ui/List/GroupedList';
import { Paddings } from '@/constants/Paddings';
import { useHabits } from '@/store/hooks';
import type { CreateHabitInput, HabitColor, HabitFrequencyType, HabitTrackingType } from '@/types/api/habits';

const FREQUENCIES: { id: HabitFrequencyType; label: string }[] = [
  { id: 'daily', label: 'Every day' },
  { id: 'weekdays', label: 'Weekdays' },
  { id: 'weekends', label: 'Weekends' },
  { id: 'weekly', label: 'Once a week' },
  { id: 'times_per_week', label: 'X times per week' },
];

const WEEKDAYS = [
  { value: 0, label: 'Monday' },
  { value: 1, label: 'Tuesday' },
  { value: 2, label: 'Wednesday' },
  { value: 3, label: 'Thursday' },
  { value: 4, label: 'Friday' },
  { value: 5, label: 'Saturday' },
  { value: 6, label: 'Sunday' },
];

const COLORS: HabitColor[] = ['green', 'blue', 'teal', 'purple', 'orange', 'yellow', 'red'];

export default function HabitCreateScreen() {
  const router = useGuardedRouter();
  const themeColors = useThemeColors();
  const typography = useTypography();
  const { createHabit, isSaving } = useHabits();

  const [title, setTitle] = useState('');
  const [trackingType, setTrackingType] = useState<HabitTrackingType>('binary');
  const [targetValue, setTargetValue] = useState('8');
  const [unitLabel, setUnitLabel] = useState('');
  const [frequencyType, setFrequencyType] = useState<HabitFrequencyType>('daily');
  const [dayOfWeek, setDayOfWeek] = useState(0);
  const [timesPerWeek, setTimesPerWeek] = useState('3');
  const [color, setColor] = useState<HabitColor>('green');

  const canSubmit = title.trim().length > 0 && !isSaving;

  const handleSubmit = useCallback(() => {
    if (!title.trim()) return;

    const input: CreateHabitInput = {
      title: title.trim(),
      color,
      trackingType,
      frequencyType,
      frequencyConfig: {},
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

    if (frequencyType === 'weekly') {
      input.frequencyConfig = { dayOfWeek };
    } else if (frequencyType === 'times_per_week') {
      const count = parseInt(timesPerWeek, 10);
      if (Number.isNaN(count) || count < 1) {
        Alert.alert('Invalid count', 'Enter how many times per week (at least 1).');
        return;
      }
      input.frequencyConfig = { targetCount: count };
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
    createHabit,
    router,
  ]);

  const headerHeight = useHeaderHeight();
  const styles = useMemo(() => createStyles(), []);

  return (
    <>
      <Stack.Screen options={{ title: 'New Habit' }} />
      <IosBrowseModalCloseStackToolbar />
      <IosBrowseModalTrailingStackToolbar
        icon="checkmark"
        onPress={handleSubmit}
        disabled={!canSubmit}
        accessibilityLabel="Create habit"
      />
      <View style={[styles.screen, { backgroundColor: themeColors.background.root() }]}>
        {Platform.OS === 'android' ? (
          <View style={[styles.androidBar, { paddingTop: headerHeight }]}>
            <MainCloseButton onPress={() => router.back()} />
            <MainSubmitButton onPress={handleSubmit} disabled={!canSubmit} />
          </View>
        ) : null}
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={[typography.getTextStyle('body-small'), { color: themeColors.text.secondary() }]}>
            Track consistency with a daily check-off or a numeric target you can +1 from the list.
          </Text>
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
                placeholder="Daily target (e.g. 8)"
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
                placeholder="Unit label (optional, e.g. glasses)"
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
            {FREQUENCIES.map((f) => (
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
              {WEEKDAYS.map((d) => (
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
            {COLORS.map((c) => (
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
