/**
 * today tab habits block — only habits due today; sits above the task list.
 */

import React, { useMemo, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';

import { GroupedListHeader } from '@/components/ui/List/GroupedList';
import { HabitListItem } from '../list/HabitListItem';
import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { useHabits } from '@/store/hooks';
import { Paddings } from '@/constants/Paddings';

export function TodayHabitsSection() {
  const router = useGuardedRouter();
  const { todayHabits, todaySummary } = useHabits();
  const styles = useMemo(() => createStyles(), []);

  const openHabitDetail = useCallback(
    (habitId: string) => {
      router.push(`/(tabs)/habits/${habitId}` as any);
    },
    [router],
  );

  if (!todayHabits.length) return null;

  const headerTitle =
    todaySummary && todaySummary.scheduledCount > 0
      ? `Habits · ${todaySummary.completedCount}/${todaySummary.scheduledCount}`
      : 'Habits';

  return (
    <View style={styles.wrap}>
      <GroupedListHeader title={headerTitle} />
      {todayHabits.map((habit) => (
        <HabitListItem key={habit.id} habit={habit} compact onOpenDetail={openHabitDetail} />
      ))}
    </View>
  );
}

const createStyles = () =>
  StyleSheet.create({
    wrap: {
      marginBottom: Paddings.sectionCompact,
    },
  });
