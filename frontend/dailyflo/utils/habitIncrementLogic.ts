/**
 * shared habit increment math — used by local UI overlay and redux sync.
 * keeps ring, score label, and heatmap cell in sync when tapping quickly.
 */

import {
  habitTodayHeatmapScore,
  patchHabitHeatmapDayScore,
} from '@/components/features/habits/detail/habitHeatmapColors';
import type { HabitHeatmapData, HabitTodayItem } from '@/types/api/habits';

/** apply one +1 tap to today's progress fields (no heatmap yet) */
export function applyHabitIncrementStep(habit: HabitTodayItem, delta = 1): HabitTodayItem {
  if (habit.trackingType === 'binary') {
    const isCompleteToday = !habit.isCompleteToday;
    return {
      ...habit,
      isCompleteToday,
      loggedValue: isCompleteToday ? 1 : 0,
    };
  }

  const step = delta;
  const target = habit.targetValue ?? 1;
  const current = habit.loggedValue ?? 0;

  if (current >= target && habit.isCompleteToday) {
    return {
      ...habit,
      loggedValue: 0,
      isCompleteToday: false,
    };
  }

  const loggedValue = Math.min(current + step, target);
  return {
    ...habit,
    loggedValue,
    isCompleteToday: loggedValue >= target,
  };
}

export function patchHabitHeatmapForToday(
  heatmap: HabitHeatmapData | undefined,
  dayIso: string | null | undefined,
  habit: HabitTodayItem,
): HabitHeatmapData | undefined {
  if (!heatmap || !dayIso) return heatmap;

  const score = habitTodayHeatmapScore(
    habit.trackingType,
    habit.loggedValue ?? 0,
    habit.isCompleteToday,
    habit.targetValue,
  );

  return patchHabitHeatmapDayScore(heatmap, dayIso, score);
}

/** one tap with optional heatmap patch for today */
export function applyHabitIncrementWithHeatmap(
  habit: HabitTodayItem,
  todayDate: string | null | undefined,
  delta = 1,
): HabitTodayItem {
  const progressed = applyHabitIncrementStep(habit, delta);
  const heatmap = patchHabitHeatmapForToday(habit.heatmap, todayDate, progressed);
  return heatmap ? { ...progressed, heatmap } : progressed;
}

/** true when redux row matches local overlay — safe to drop overlay */
export function habitTodayProgressMatches(a: HabitTodayItem, b: HabitTodayItem): boolean {
  return (
    (a.loggedValue ?? 0) === (b.loggedValue ?? 0) && a.isCompleteToday === b.isCompleteToday
  );
}
