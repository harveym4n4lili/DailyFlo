/**
 * single habit row — increment ring for all trackable habits (binary + numeric).
 */

import React, { useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';

import { HabitProgressRing } from './HabitProgressRing';
import { getHabitIncrementDisplay } from './habitIncrementDisplay';
import { getHabitProgressRingColors } from './habitProgressRingColors';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { Paddings } from '@/constants/Paddings';
import { getTaskColorValue, getTaskHabitTitleColor } from '@/utils/taskColors';
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
  const ringColors = useMemo(() => getHabitProgressRingColors(habit.color), [habit.color]);
  const titleColor = useMemo(() => getTaskHabitTitleColor(habit.color), [habit.color]);
  const styles = useMemo(
    () => createStyles(themeColors, typography, accent, compact),
    [themeColors, typography, accent, compact],
  );

  const incrementDisplay = useMemo(() => getHabitIncrementDisplay(habit), [habit]);

  const handleIncrement = useCallback(() => {
    if (!habit) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    snapshotRef.current = { ...habit };
    const wasCompleteBefore = habit.isCompleteToday;
    dispatch(optimisticLogHabit({ id: habit.id, delta: 1 }));
    void dispatch(logHabitProgress({ id: habit.id, delta: 1, wasCompleteBefore }))
      .unwrap()
      .catch(() => {
        if (snapshotRef.current) {
          dispatch(revertOptimisticLog({ id: habit.id, snapshot: snapshotRef.current }));
        }
      });
  }, [dispatch, habit]);

  const progressLabel = incrementDisplay
    ? `Today's progress: ${incrementDisplay.scoreLabel}`
    : null;

  return (
    <View style={styles.row}>
      {incrementDisplay ? (
        <Pressable
          onPress={handleIncrement}
          style={styles.ringAction}
          accessibilityLabel={
            habit.isCompleteToday
              ? `Reset today's count for ${habit.title}`
              : `Add one to ${habit.title}`
          }
        >
          <HabitProgressRing
            current={incrementDisplay.current}
            target={incrementDisplay.target}
            color={ringColors.progress}
            trackColor={ringColors.track}
            iconColor={ringColors.icon}
            showCenterLabel={false}
            showCenterPlus
          />
        </Pressable>
      ) : null}
      <Pressable
        style={styles.body}
        onPress={onOpenDetail ? () => onOpenDetail(habit.id) : undefined}
        disabled={!onOpenDetail}
      >
        <Text
          style={[
            styles.title,
            { color: titleColor },
            habit.isCompleteToday && styles.titleDone,
          ]}
          numberOfLines={1}
        >
          {habit.title}
        </Text>
        {progressLabel ? (
          <Text style={styles.subtitle}>{progressLabel}</Text>
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
    },
    titleDone: {
      opacity: 0.55,
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
    ringAction: {
      flexShrink: 0,
    },
  });
