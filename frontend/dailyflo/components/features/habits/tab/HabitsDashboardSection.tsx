/**
 * habits tab dashboard — 2×2 grid of summary tiles above today's habit cards.
 * typography + spacing reuse browse progress board tokens (grouped-list rhythm).
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

import { HabitProgressRing } from '../list/HabitProgressRing';
import {
  formatProgressBoardStreakNumber,
  getProgressBoardStreakUnitLabel,
} from '@/components/features/gamification/browse/progressBoardTextValues';
import {
  PROGRESS_BOARD_LONGEST_STREAK_ICON_SIZE,
  getProgressBoardNewBestMedalGradientColors,
} from '@/components/features/gamification/browse/progressBoardUiTokens';
import { ProgressBoardNewBestMedalIcon } from '@/components/features/gamification/browse/ProgressBoardNewBestMedalIcon';
import { getTypographyStyle } from '@/constants/Typography';
import { useThemeColors, useBrandColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { HabitDashboardTile } from './HabitDashboardTile';
import {
  HABITS_DASHBOARD_CONSISTENCY_DAYS,
  computeHabitsConsistencyScore,
  countHabitsStreaksAtRisk,
  getHabitsDashboardStatusColor,
  getHabitsStreaksAtRiskStatusColor,
  resolveBestActiveStreak,
  resolveTodayProgress,
} from './habitsDashboardMetrics';
import {
  HABIT_DASHBOARD_CONTENT_ROW_GAP,
  HABIT_DASHBOARD_RING_TEXT_GAP,
  HABIT_DASHBOARD_SECONDARY_ROW_GAP,
  HABIT_DASHBOARD_TILE_GAP,
  HABIT_DASHBOARD_TODAY_RING_SIZE,
  HABIT_DASHBOARD_TODAY_RING_STROKE,
  HABIT_DASHBOARD_TODAY_TICK_ICON_SIZE,
} from './habitDashboardUiTokens';
import type { HabitTodayItem, HabitsTodaySummary } from '@/types/api/habits';

type HabitsDashboardSectionProps = {
  habits: HabitTodayItem[];
  summary: HabitsTodaySummary | null;
};

export function HabitsDashboardSection({ habits, summary }: HabitsDashboardSectionProps) {
  const themeColors = useThemeColors();
  const typography = useTypography();
  const { withOpacity: withBrandOpacity } = useBrandColors();

  // numbers — heading-3 with Inter semibold; stat titles use heading-4 (see HabitDashboardTile)
  const numberStyle = getTypographyStyle('heading-3', Platform.OS as 'ios' | 'android' | 'web');
  const statTitleStyle = getTypographyStyle('heading-4', Platform.OS as 'ios' | 'android' | 'web');
  // subtext — body-small + text.tertiary, same as HabitCard "Today's progress:" label
  const subtextStyle = typography.getTextStyle('body-small');
  const statSubtextColor = themeColors.text.tertiary();

  // primary/secondary text; system status colors for graded stats
  const primaryColor = themeColors.text.primary();
  const secondaryColor = themeColors.text.secondary();
  const bestActiveMedalGradientColors = getProgressBoardNewBestMedalGradientColors();

  const bestActiveStreak = resolveBestActiveStreak(habits, summary);
  const streaksAtRisk = countHabitsStreaksAtRisk(habits);
  const today = resolveTodayProgress(summary, habits);
  const consistency = computeHabitsConsistencyScore(habits, HABITS_DASHBOARD_CONSISTENCY_DAYS);

  const streakNumberLabel = formatProgressBoardStreakNumber(bestActiveStreak);
  const streakUnitLabel = getProgressBoardStreakUnitLabel(bestActiveStreak);
  const consistencyPercent = Math.round(Math.min(1, Math.max(0, consistency)) * 100);
  const consistencyColor = getHabitsDashboardStatusColor(consistency);
  const todayProgressColor = getHabitsDashboardStatusColor(today.progress);
  const todayRingTrackColor = withBrandOpacity(todayProgressColor, 0.2);
  const streaksAtRiskColor = getHabitsStreaksAtRiskStatusColor(streaksAtRisk);

  const todayDetailLabel =
    today.scheduled <= 0
      ? 'No habits due'
      : today.allDone
        ? 'All done'
        : today.remaining === 1
          ? '1 left'
          : `${today.remaining} left`;

  const todayGoalDenominator = Math.max(today.scheduled, 1);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        grid: {
          gap: HABIT_DASHBOARD_TILE_GAP,
          marginBottom: HABIT_DASHBOARD_TILE_GAP,
        },
        row: {
          flexDirection: 'row',
          gap: HABIT_DASHBOARD_TILE_GAP,
        },
        streakRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: HABIT_DASHBOARD_SECONDARY_ROW_GAP,
        },
        bestActiveValue: {
          ...numberStyle,
          color: primaryColor,
        },
        bestActiveUnit: {
          ...statTitleStyle,
          color: primaryColor,
        },
        metricUnit: {
          ...statTitleStyle,
          color: secondaryColor,
        },
        bestActiveMedalWrap: {
          width: PROGRESS_BOARD_LONGEST_STREAK_ICON_SIZE,
          height: PROGRESS_BOARD_LONGEST_STREAK_ICON_SIZE,
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        },
        riskValue: {
          ...numberStyle,
          color: streaksAtRiskColor,
        },
        // supporting copy — body-small + text.tertiary (habit card "Today's progress:" label)
        statSubtext: {
          ...subtextStyle,
          color: statSubtextColor,
        },
        statSubtextSpaced: {
          ...subtextStyle,
          color: statSubtextColor,
          marginTop: HABIT_DASHBOARD_CONTENT_ROW_GAP,
        },
        todayRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: HABIT_DASHBOARD_RING_TEXT_GAP,
        },
        todayTextBlock: {
          flex: 1,
          minWidth: 0,
          gap: HABIT_DASHBOARD_CONTENT_ROW_GAP,
        },
        todayFractionRow: {
          flexDirection: 'row',
          alignItems: 'baseline',
          gap: HABIT_DASHBOARD_SECONDARY_ROW_GAP,
        },
        todayCompleted: {
          ...numberStyle,
          color: todayProgressColor,
        },
        todayGoalSuffix: {
          ...statTitleStyle,
          color: secondaryColor,
        },
        consistencyRow: {
          flexDirection: 'row',
          alignItems: 'baseline',
          gap: HABIT_DASHBOARD_SECONDARY_ROW_GAP,
        },
        consistencyValue: {
          ...numberStyle,
          color: consistencyColor,
        },
      }),
    [
      consistencyColor,
      numberStyle,
      primaryColor,
      secondaryColor,
      statSubtextColor,
      statTitleStyle,
      streaksAtRiskColor,
      subtextStyle,
      todayProgressColor,
    ],
  );

  if (habits.length === 0) {
    return null;
  }

  return (
    <View style={styles.grid}>
      <View style={styles.row}>
        <HabitDashboardTile label="Best active">
          <View style={styles.streakRow}>
            <Text style={styles.bestActiveValue}>{streakNumberLabel}</Text>
            {streakUnitLabel ? <Text style={styles.bestActiveUnit}>{streakUnitLabel}</Text> : null}
            {streakUnitLabel ? (
              <View
                accessible
                accessibilityRole="image"
                accessibilityLabel="Best active streak"
                style={styles.bestActiveMedalWrap}
              >
                <ProgressBoardNewBestMedalIcon
                  size={PROGRESS_BOARD_LONGEST_STREAK_ICON_SIZE}
                  gradientColors={bestActiveMedalGradientColors}
                />
              </View>
            ) : null}
          </View>
        </HabitDashboardTile>

        <HabitDashboardTile label="Streaks at risk">
          <Text style={styles.riskValue}>{streaksAtRisk}</Text>
          <Text style={styles.statSubtextSpaced}>
            {streaksAtRisk === 0
              ? 'All protected today'
              : streaksAtRisk === 1
                ? '1 habit needs today'
                : `${streaksAtRisk} habits need today`}
          </Text>
        </HabitDashboardTile>
      </View>

      <View style={styles.row}>
        <HabitDashboardTile label="Habits today">
          <View style={styles.todayRow}>
            <HabitProgressRing
              current={today.completed}
              target={Math.max(1, today.scheduled)}
              isComplete={today.allDone}
              color={todayProgressColor}
              trackColor={todayRingTrackColor}
              size={HABIT_DASHBOARD_TODAY_RING_SIZE}
              strokeWidth={HABIT_DASHBOARD_TODAY_RING_STROKE}
              showCenterLabel={false}
              showCenterPlus={today.allDone}
              tickIconSize={HABIT_DASHBOARD_TODAY_TICK_ICON_SIZE}
            />
            <View style={styles.todayTextBlock}>
              <View style={styles.todayFractionRow}>
                <Text style={styles.todayCompleted}>{today.completed}</Text>
                <Text style={styles.todayGoalSuffix}>/{todayGoalDenominator}</Text>
              </View>
              <Text style={styles.statSubtext}>{todayDetailLabel}</Text>
            </View>
          </View>
        </HabitDashboardTile>

        <HabitDashboardTile label="Consistency">
          <View style={styles.consistencyRow}>
            <Text style={styles.consistencyValue}>{consistencyPercent}</Text>
            <Text style={[styles.metricUnit, { color: consistencyColor }]}>%</Text>
          </View>
          <Text style={styles.statSubtextSpaced}>Last {HABITS_DASHBOARD_CONSISTENCY_DAYS} days</Text>
        </HabitDashboardTile>
      </View>
    </View>
  );
}
