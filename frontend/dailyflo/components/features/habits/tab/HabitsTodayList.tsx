/**
 * scrollable list of today's due habits — each habit uses the habit card shell.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Animated from 'react-native-reanimated';

import { HabitCard } from '../list/HabitCard';
import { LAYOUT_TRANSITION_SPRING } from '@/constants/LayoutTransitions';
import { HabitsDashboardSection } from './HabitsDashboardSection';
import { HabitsCollapsibleSection } from './HabitsCollapsibleSection';
import {
  HABIT_DASHBOARD_TO_SECTION_HEADER_GAP,
  HABIT_SECTION_HEADER_CONTENT_GAP,
} from './habitSectionUiTokens';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { useHabits } from '@/store/hooks';
import { Paddings } from '@/constants/Paddings';
import type { HabitTodayItem } from '@/types/api/habits';

type HabitsTodayListProps = {
  habits: HabitTodayItem[];
  isLoading: boolean;
  error: string | null;
  onOpenDetail?: (habitId: string) => void;
};

export function HabitsTodayList({ habits, isLoading, error, onOpenDetail }: HabitsTodayListProps) {
  const themeColors = useThemeColors();
  const typography = useTypography();
  const { todaySummary } = useHabits();
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
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyTitle}>No habits due today</Text>
        <Text style={styles.emptyHint}>Tap + to create a habit and build consistency.</Text>
      </View>
    );
  }

  return (
    <View style={styles.todaySection}>
      <HabitsDashboardSection habits={habits} summary={todaySummary} />
      <HabitsCollapsibleSection
        title="Today's Habits"
        itemCount={habits.length}
        headerStyle={styles.todaySectionHeader}
      >
        <View style={styles.habitCards}>
          {habits.map((habit) => (
            <Animated.View key={habit.id} layout={LAYOUT_TRANSITION_SPRING}>
              <HabitCard
                defaultVariant="heatmap"
                title={habit.title}
                color={habit.color}
                currentStreak={habit.currentStreak}
                heatmap={habit.heatmap}
                habit={habit}
                onPress={onOpenDetail ? () => onOpenDetail(habit.id) : undefined}
              />
            </Animated.View>
          ))}
        </View>
      </HabitsCollapsibleSection>
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
    todaySection: {
      gap: 0,
    },
    todaySectionHeader: {
      marginTop: HABIT_DASHBOARD_TO_SECTION_HEADER_GAP,
    },
    habitCards: {
      gap: Paddings.screen,
      paddingTop: HABIT_SECTION_HEADER_CONTENT_GAP,
    },
    emptyWrap: {
      paddingVertical: Paddings.sectionCompact,
      alignItems: 'center',
    },
  });
