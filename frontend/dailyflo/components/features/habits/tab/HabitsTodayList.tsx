/**
 * scrollable list of today's due habits — each habit uses the gamification board card shell.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

import { HabitBoardCard } from '../list/HabitBoardCard';
import { HabitTabSummaryHeader } from './HabitTabSummaryHeader';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { Paddings } from '@/constants/Paddings';
import type { HabitTodayItem, HabitsTodaySummary } from '@/types/api/habits';

type HabitsTodayListProps = {
  habits: HabitTodayItem[];
  summary: HabitsTodaySummary | null;
  isLoading: boolean;
  error: string | null;
  onOpenDetail?: (habitId: string) => void;
};

export function HabitsTodayList({ habits, summary, isLoading, error, onOpenDetail }: HabitsTodayListProps) {
  const themeColors = useThemeColors();
  const typography = useTypography();
  const styles = useMemo(() => createStyles(themeColors, typography), [themeColors, typography]);

  if (isLoading && habits.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={themeColors.text.secondary()} />
      </View>
    );
  }

  if (error && habits.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (habits.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyTitle}>No habits due today</Text>
        <Text style={styles.emptyHint}>Tap + to create a habit and build consistency.</Text>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      <HabitTabSummaryHeader summary={summary} />
      <View style={styles.habitCards}>
        {habits.map((habit) => (
          <HabitBoardCard
            key={habit.id}
            title={habit.title}
            color={habit.color}
            currentStreak={habit.currentStreak}
            heatmap={habit.heatmap}
            habit={habit}
            onPress={onOpenDetail ? () => onOpenDetail(habit.id) : undefined}
          />
        ))}
      </View>
    </View>
  );
}

const createStyles = (
  themeColors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useTypography>,
) =>
  StyleSheet.create({
    centered: {
      paddingVertical: Paddings.section,
      alignItems: 'center',
    },
    emptyTitle: {
      ...typography.getTextStyle('heading-4'),
      color: themeColors.text.primary(),
    },
    emptyHint: {
      ...typography.getTextStyle('body-medium'),
      color: themeColors.text.secondary(),
      marginTop: 8,
      textAlign: 'center',
    },
    errorText: {
      ...typography.getTextStyle('body-medium'),
      color: themeColors.text.secondary(),
    },
    list: {
      gap: Paddings.sectionCompact,
    },
    habitCards: {
      gap: Paddings.screen,
    },
  });
