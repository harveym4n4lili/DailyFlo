/**
 * client-side habit due-date logic — mirrors backend habit_schedule.habit_is_due.
 * used by planner/today habit segment pills when viewing any calendar day.
 */

import { getHabitHeatmapDayScore } from '@/components/features/habits/detail/habitHeatmapColors';
import { getHabitIncrementDisplay } from '@/components/features/habits/list/habitIncrementDisplay';
import type { HabitIncrementDisplay } from '@/components/features/habits/list/habitIncrementDisplay';
import type {
  Habit,
  HabitHeatmapData,
  HabitLibraryItem,
  HabitTodayItem,
} from '@/types/api/habits';

export type HabitForCalendarDay = {
  /** row passed to HabitCard — increment enabled only when canIncrement */
  item: HabitTodayItem;
  source: HabitLibraryItem;
  canIncrement: boolean;
  /** set when !canIncrement — decorative ring + progress bar for that day */
  readOnlyProgress: HabitIncrementDisplay | null;
};

function parseDayKey(dayKey: string): Date {
  const [y, m, d] = dayKey.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** monday=0 … sunday=6 — matches django habit_schedule */
function pythonWeekday(d: Date): number {
  return (d.getDay() + 6) % 7;
}

function addDays(d: Date, days: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + days);
  return next;
}

function toDayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isoWeekStart(dayKey: string): Date {
  const d = parseDayKey(dayKey);
  return addDays(d, -pythonWeekday(d));
}

function readCustomDays(config: Record<string, unknown> | undefined): number[] {
  const raw = config?.days;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((x) => (typeof x === 'number' ? x : parseInt(String(x), 10)))
    .filter((n) => Number.isFinite(n) && n >= 0 && n <= 6);
}

function countWeekCompletionsFromHeatmap(heatmap: HabitHeatmapData, dayKey: string): number {
  const start = isoWeekStart(dayKey);
  let count = 0;
  for (let i = 0; i < 7; i++) {
    const key = toDayKey(addDays(start, i));
    const score = getHabitHeatmapDayScore(heatmap, key);
    if (score >= 1) count += 1;
  }
  return count;
}

/** true when habit should appear on the habits list for dayKey */
export function habitIsDueOnDate(habit: Habit, dayKey: string): boolean {
  if (habit.isActive === false) return false;

  const targetDate = parseDayKey(dayKey);
  const wd = pythonWeekday(targetDate);
  const freq = habit.frequencyType;
  const config = (habit.frequencyConfig ?? {}) as Record<string, unknown>;

  if (freq === 'daily') return true;

  if (freq === 'weekly') {
    const configured = config.dayOfWeek ?? config.day_of_week ?? 0;
    const day = typeof configured === 'number' ? configured : parseInt(String(configured), 10);
    return wd === day;
  }

  if (freq === 'weekdays') return wd <= 4;
  if (freq === 'weekends') return wd >= 5;

  if (freq === 'custom') {
    const days = readCustomDays(config);
    return days.includes(wd);
  }

  if (freq === 'times_per_week') {
    const rawTarget = config.targetCount ?? config.target_count ?? 1;
    let targetCount = typeof rawTarget === 'number' ? rawTarget : parseInt(String(rawTarget), 10);
    if (!Number.isFinite(targetCount)) targetCount = 1;
    if (targetCount <= 0) return false;
    if (targetCount > 7) return true;

    const heatmap = 'heatmap' in habit ? (habit as HabitLibraryItem).heatmap : undefined;
    const completed = heatmap ? countWeekCompletionsFromHeatmap(heatmap, dayKey) : 0;
    if (completed >= targetCount) return false;

    const weekStart = isoWeekStart(dayKey);
    const weekEnd = addDays(weekStart, 6);
    const daysLeftIncludingToday = Math.floor((weekEnd.getTime() - targetDate.getTime()) / 86400000) + 1;
    const remaining = targetCount - completed;
    return remaining > 0 && daysLeftIncludingToday >= remaining;
  }

  return false;
}

function loggedStateFromHeatmap(
  habit: HabitLibraryItem,
  dayKey: string,
): { loggedValue: number; isCompleteToday: boolean } {
  const score = getHabitHeatmapDayScore(habit.heatmap, dayKey);
  const isBinary = habit.trackingType === 'binary';
  const target = isBinary ? 1 : (habit.targetValue ?? 1);

  if (isBinary) {
    const complete = score >= 1;
    return { loggedValue: complete ? 1 : 0, isCompleteToday: complete };
  }

  const loggedValue = Math.round(score * target);
  const isCompleteToday = score >= 1 || loggedValue >= target;
  return { loggedValue, isCompleteToday };
}

/** build a HabitTodayItem for display on a non-today calendar day (from library + heatmap) */
export function buildHabitTodayItemForDay(
  habit: HabitLibraryItem,
  dayKey: string,
): HabitTodayItem {
  const { loggedValue, isCompleteToday } = loggedStateFromHeatmap(habit, dayKey);
  return {
    id: habit.id,
    title: habit.title,
    iconKey: habit.iconKey,
    color: habit.color,
    trackingType: habit.trackingType,
    targetValue: habit.targetValue,
    loggedValue,
    unitLabel: habit.unitLabel,
    isCompleteToday,
    currentStreak: habit.currentStreak,
    longestStreak: habit.longestStreak,
    frequencyType: habit.frequencyType,
    reminderTime: habit.reminderTime,
    heatmap: habit.heatmap,
  };
}

export function getHabitsDueOnDay(
  allHabits: HabitLibraryItem[],
  todayHabits: HabitTodayItem[],
  dayKey: string,
  todayDateKey: string,
): HabitForCalendarDay[] {
  if (!dayKey) return [];

  const isToday = dayKey === todayDateKey;
  const libraryById = new Map(allHabits.map((h) => [h.id, h]));

  // today list comes from GET /habits/today/ — authoritative for due + increment state
  if (isToday) {
    return todayHabits
      .map((item) => {
        const source =
          libraryById.get(item.id) ??
          ({
            ...item,
            description: '',
            frequencyConfig: {},
            reminderTime: item.reminderTime ?? '',
            sortOrder: 0,
            isActive: true,
            longestStreak: item.longestStreak,
          } as HabitLibraryItem);

        return {
          item,
          source,
          canIncrement: true,
          readOnlyProgress: null,
        };
      })
      .sort((a, b) => a.item.title.localeCompare(b.item.title));
  }

  const todayById = new Map(todayHabits.map((h) => [h.id, h]));
  const due = allHabits.filter((h) => habitIsDueOnDate(h, dayKey));

  const rows: HabitForCalendarDay[] = due.map((source) => {
    const todayRow = todayById.get(source.id);
    const canIncrement = false;
    const item = todayRow ?? buildHabitTodayItemForDay(source, dayKey);
    const readOnlyProgress = getHabitIncrementDisplay(item);

    return { item, source, canIncrement, readOnlyProgress };
  });

  return rows.sort((a, b) => a.item.title.localeCompare(b.item.title));
}

/** list-assigned habits not due on dayKey — read-only rows for One-time section */
export function getListHabitsNotDueOnDay(
  listHabits: HabitLibraryItem[],
  dayKey: string,
): HabitForCalendarDay[] {
  const rows = listHabits
    .filter((source) => !habitIsDueOnDate(source, dayKey))
    .map((source) => {
      const item = buildHabitTodayItemForDay(source, dayKey);
      return {
        item,
        source,
        canIncrement: false,
        readOnlyProgress: getHabitIncrementDisplay(item),
      };
    });

  return rows.sort((a, b) => a.item.title.localeCompare(b.item.title));
}
