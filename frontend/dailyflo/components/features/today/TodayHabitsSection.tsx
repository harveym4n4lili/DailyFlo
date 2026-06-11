/**
 * today tab habits block — only habits due today; sits above the task list.
 */

import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';

import { GroupedListHeader } from '@/components/ui/List/GroupedList';
import { HabitListItem } from '@/components/features/habits/HabitListItem';
import { useHabits } from '@/store/hooks';
import { Paddings } from '@/constants/Paddings';

export function TodayHabitsSection() {
  const { todayHabits, todaySummary } = useHabits();
  const styles = useMemo(() => createStyles(), []);

  if (!todayHabits.length) return null;

  const headerTitle =
    todaySummary && todaySummary.scheduledCount > 0
      ? `Habits · ${todaySummary.completedCount}/${todaySummary.scheduledCount}`
      : 'Habits';

  return (
    <View style={styles.wrap}>
      <GroupedListHeader title={headerTitle} />
      {todayHabits.map((habit) => (
        <HabitListItem key={habit.id} habit={habit} compact />
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
