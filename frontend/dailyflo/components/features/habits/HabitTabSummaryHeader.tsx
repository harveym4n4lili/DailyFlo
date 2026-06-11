/**
 * habits tab summary — scheduled vs completed today + best active streak.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { Paddings } from '@/constants/Paddings';
import type { HabitsTodaySummary } from '@/types/api/habits';

type HabitTabSummaryHeaderProps = {
  summary: HabitsTodaySummary | null;
  dateLabel?: string;
};

export function HabitTabSummaryHeader({ summary, dateLabel }: HabitTabSummaryHeaderProps) {
  const themeColors = useThemeColors();
  const typography = useTypography();
  const styles = useMemo(() => createStyles(themeColors, typography), [themeColors, typography]);

  if (!summary || summary.scheduledCount === 0) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{dateLabel ?? 'Today'}</Text>
      <Text style={styles.stats}>
        {summary.completedCount}/{summary.scheduledCount} done
        {summary.bestActiveStreak > 0 ? ` · best streak ${summary.bestActiveStreak}d` : ''}
      </Text>
    </View>
  );
}

const createStyles = (
  themeColors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useTypography>,
) =>
  StyleSheet.create({
    wrap: {
      marginBottom: Paddings.sectionCompact,
    },
    title: {
      ...typography.getTextStyle('heading-3'),
      color: themeColors.text.primary(),
    },
    stats: {
      ...typography.getTextStyle('body-medium'),
      color: themeColors.text.secondary(),
      marginTop: 4,
    },
  });
