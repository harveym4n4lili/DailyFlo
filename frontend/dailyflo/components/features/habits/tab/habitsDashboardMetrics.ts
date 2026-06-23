/**
 * habit tab dashboard — derived stats from today's habits + heatmaps.
 */

import { getHabitHeatmapDayScore } from '../detail/habitHeatmapColors';
import {
  getSystemStatusColor,
  type SystemStatusColorName,
  type SystemStatusColorShade,
} from '@/constants/ColorPalette';
import { localTodayDateStr } from '@/components/features/gamification/utils/computeTodayTaskGoal';
import type { HabitTodayItem, HabitsTodaySummary } from '@/types/api/habits';

/** rolling window for the consistency tile (last N calendar days including today) */
export const HABITS_DASHBOARD_CONSISTENCY_DAYS = 7;

/** dashboard stat tiers — maps to SystemStatusColors red / orange / yellow / green */
export const HABITS_DASHBOARD_STATUS_COLOR_THRESHOLDS = {
  redBelow: 0.3,
  orangeBelow: 0.5,
  yellowBelow: 0.6,
} as const;

/** @deprecated use HABITS_DASHBOARD_STATUS_COLOR_THRESHOLDS */
export const HABITS_CONSISTENCY_COLOR_THRESHOLDS = HABITS_DASHBOARD_STATUS_COLOR_THRESHOLDS;

/** pick status color for a 0–1 ratio using dashboard tier breakpoints (consistency, habits today, etc.) */
export function getHabitsDashboardStatusColor(
  ratio: number,
  shade: SystemStatusColorShade = 500,
): string {
  const clamped = Math.min(1, Math.max(0, ratio));
  let status: SystemStatusColorName;

  if (clamped < HABITS_DASHBOARD_STATUS_COLOR_THRESHOLDS.redBelow) {
    status = 'red';
  } else if (clamped < HABITS_DASHBOARD_STATUS_COLOR_THRESHOLDS.orangeBelow) {
    status = 'orange';
  } else if (clamped < HABITS_DASHBOARD_STATUS_COLOR_THRESHOLDS.yellowBelow) {
    status = 'yellow';
  } else {
    status = 'green';
  }

  return getSystemStatusColor(status, shade);
}

/** @deprecated use getHabitsDashboardStatusColor */
export const getHabitsConsistencyStatusColor = getHabitsDashboardStatusColor;

/** streaks-at-risk count — green when none at risk, red when any habit needs today */
export function getHabitsStreaksAtRiskStatusColor(
  streaksAtRisk: number,
  shade: SystemStatusColorShade = 500,
): string {
  return getSystemStatusColor(streaksAtRisk === 0 ? 'green' : 'red', shade);
}
/** habits with an active streak that are not complete yet today */
export function countHabitsStreaksAtRisk(habits: HabitTodayItem[]): number {
  return habits.filter((habit) => habit.currentStreak > 0 && !habit.isCompleteToday).length;
}

/** iso yyyy-mm-dd for today minus offset days (local calendar) */
function localDayIsoDaysAgo(daysAgo: number, anchorIso: string): string {
  const [y, m, d] = anchorIso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() - daysAgo);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * average completion ratio across all habit-days in the window —
 * numeric habits contribute partial credit via heatmap dayScores.
 */
export function computeHabitsConsistencyScore(
  habits: HabitTodayItem[],
  windowDays = HABITS_DASHBOARD_CONSISTENCY_DAYS,
  todayIso = localTodayDateStr(),
): number {
  if (habits.length === 0 || windowDays <= 0) return 0;

  let earned = 0;
  let slots = 0;

  for (let offset = 0; offset < windowDays; offset += 1) {
    const dayIso = localDayIsoDaysAgo(offset, todayIso);
    for (const habit of habits) {
      slots += 1;
      earned += Math.min(1, Math.max(0, getHabitHeatmapDayScore(habit.heatmap, dayIso)));
    }
  }

  return slots === 0 ? 0 : earned / slots;
}

export function formatHabitsConsistencyLabel(ratio: number): string {
  return `${Math.round(Math.min(1, Math.max(0, ratio)) * 100)}%`;
}

export function resolveBestActiveStreak(
  habits: HabitTodayItem[],
  summary: HabitsTodaySummary | null,
): number {
  if (summary?.bestActiveStreak != null) {
    return summary.bestActiveStreak;
  }
  if (habits.length === 0) return 0;
  return Math.max(...habits.map((h) => h.currentStreak), 0);
}

export function resolveTodayProgress(summary: HabitsTodaySummary | null, habits: HabitTodayItem[]) {
  const scheduled = summary?.scheduledCount ?? habits.length;
  const completed =
    summary?.completedCount ?? habits.filter((habit) => habit.isCompleteToday).length;
  const remaining = Math.max(0, scheduled - completed);
  const progress = scheduled <= 0 ? 0 : Math.min(1, completed / scheduled);

  return { scheduled, completed, remaining, progress, allDone: scheduled > 0 && remaining === 0 };
}
