/**
 * single habit row — binary checkbox tap or numeric +1 with streak pill.
 */

import React, { useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';

import { Checkbox } from '@/components/ui/Button';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { Paddings } from '@/constants/Paddings';
import { getTaskColorValue } from '@/utils/taskColors';
import { useAppDispatch } from '@/store';
import {
  logHabitProgress,
  optimisticLogHabit,
  revertOptimisticLog,
} from '@/store/slices/habits/habitsSlice';
import type { HabitTodayItem } from '@/types/api/habits';

type HabitListItemProps = {
  habit: HabitTodayItem;
  compact?: boolean;
  /** tap title/body to open habit detail — checkbox/+1 stay separate */
  onOpenDetail?: (habitId: string) => void;
};

export function HabitListItem({ habit, compact = false, onOpenDetail }: HabitListItemProps) {
  const themeColors = useThemeColors();
  const typography = useTypography();
  const dispatch = useAppDispatch();
  const snapshotRef = useRef<HabitTodayItem | null>(null);

  const accent = useMemo(() => getTaskColorValue(habit.color), [habit.color]);
  const styles = useMemo(
    () => createStyles(themeColors, typography, accent, compact),
    [themeColors, typography, accent, compact],
  );

  const handleBinaryPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    snapshotRef.current = { ...habit };
    dispatch(optimisticLogHabit({ id: habit.id }));
    void dispatch(logHabitProgress({ id: habit.id }))
      .unwrap()
      .catch(() => {
        if (snapshotRef.current) {
          dispatch(revertOptimisticLog({ id: habit.id, snapshot: snapshotRef.current }));
        }
      });
  }, [dispatch, habit]);

  const handleIncrement = useCallback(() => {
    if (habit.isCompleteToday) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    snapshotRef.current = { ...habit };
    dispatch(optimisticLogHabit({ id: habit.id, delta: 1 }));
    void dispatch(logHabitProgress({ id: habit.id, delta: 1 }))
      .unwrap()
      .catch(() => {
        if (snapshotRef.current) {
          dispatch(revertOptimisticLog({ id: habit.id, snapshot: snapshotRef.current }));
        }
      });
  }, [dispatch, habit]);

  const numericLabel =
    habit.trackingType === 'numeric'
      ? `${Math.round(habit.loggedValue)}/${habit.targetValue ?? 1}${habit.unitLabel ? ` ${habit.unitLabel}` : ''}`
      : null;

  return (
    <View style={styles.row}>
      {habit.trackingType === 'binary' ? (
        <Checkbox checked={habit.isCompleteToday} onPress={handleBinaryPress} expandTapArea />
      ) : (
        <Pressable
          onPress={handleIncrement}
          style={[styles.incrementButton, habit.isCompleteToday && styles.incrementDone]}
          accessibilityLabel={`Add one to ${habit.title}`}
        >
          <Text style={styles.incrementText}>+1</Text>
        </Pressable>
      )}
      <Pressable
        style={styles.body}
        onPress={onOpenDetail ? () => onOpenDetail(habit.id) : undefined}
        disabled={!onOpenDetail}
      >
        <Text
          style={[styles.title, habit.isCompleteToday && styles.titleDone]}
          numberOfLines={1}
        >
          {habit.title}
        </Text>
        {numericLabel ? (
          <Text style={styles.subtitle}>{numericLabel}</Text>
        ) : null}
      </Pressable>
      {habit.currentStreak > 0 ? (
        <View style={styles.streakPill}>
          <Text style={styles.streakText}>{habit.currentStreak}d</Text>
        </View>
      ) : null}
    </View>
  );
}

const createStyles = (
  themeColors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useTypography>,
  accent: string,
  compact: boolean,
) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: compact ? 8 : Paddings.listItemVertical,
    },
    body: {
      flex: 1,
      minWidth: 0,
    },
    title: {
      ...typography.getTextStyle('body-large'),
      color: themeColors.text.primary(),
    },
    titleDone: {
      color: themeColors.text.tertiary(),
      textDecorationLine: 'line-through',
    },
    subtitle: {
      ...typography.getTextStyle('body-small'),
      color: themeColors.text.secondary(),
      marginTop: 2,
    },
    streakPill: {
      backgroundColor: themeColors.withOpacity(accent, 0.15),
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    streakText: {
      ...typography.getTextStyle('body-small'),
      color: accent,
      fontWeight: '600',
    },
    incrementButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 1.5,
      borderColor: accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    incrementDone: {
      opacity: 0.4,
    },
    incrementText: {
      ...typography.getTextStyle('body-medium'),
      color: accent,
      fontWeight: '600',
    },
  });
