/**
 * scrollable list of today's due habits — used on habits tab.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

import { HabitListItem } from './HabitListItem';
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
};

export function HabitsTodayList({ habits, summary, isLoading, error }: HabitsTodayListProps) {
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
    <View>
      <HabitTabSummaryHeader summary={summary} />
      {habits.map((habit) => (
        <HabitListItem key={habit.id} habit={habit} />
      ))}
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
  });
