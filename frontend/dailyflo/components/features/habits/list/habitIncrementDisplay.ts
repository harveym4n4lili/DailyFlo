/**
 * shared increment ring display — binary (1/day) and numeric habits use the same 0/x UI.
 */

import type { HabitTodayItem } from '@/types/api/habits';

export type HabitIncrementDisplay = {
  target: number;
  current: number;
  scoreLabel: string;
};

export function getHabitIncrementDisplay(habit: HabitTodayItem): HabitIncrementDisplay | null {
  if (habit.trackingType !== 'binary' && habit.trackingType !== 'numeric') {
    return null;
  }

  const isBinary = habit.trackingType === 'binary';
  const target = isBinary ? 1 : (habit.targetValue ?? 1);
  const current = isBinary
    ? habit.isCompleteToday
      ? 1
      : Math.min(Math.round(habit.loggedValue ?? 0), 1)
    : Math.round(habit.loggedValue ?? 0);
  const unitSuffix = !isBinary && habit.unitLabel ? ` ${habit.unitLabel}` : '';

  return {
    target,
    current,
    scoreLabel: `${current}/${target}${unitSuffix}`,
  };
}
