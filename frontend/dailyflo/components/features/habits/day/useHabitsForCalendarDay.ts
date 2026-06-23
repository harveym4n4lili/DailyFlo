/**
 * habits due on a calendar day — fetches today + full library, filters client-side.
 */

import { useCallback, useEffect, useMemo } from 'react';
import { useFocusEffect } from 'expo-router';

import { useHabits } from '@/store/hooks';
import { toLocalCalendarDayString } from '@/utils/recurrenceUtils';
import { getHabitsDueOnDay, type HabitForCalendarDay } from '@/utils/habitSchedule';

export function useHabitsForCalendarDay(dayKey: string) {
  const {
    allHabits,
    todayHabits,
    isTodayLoading,
    isAllLoading,
    fetchToday,
    fetchAll,
  } = useHabits();

  const todayDateKey = useMemo(() => toLocalCalendarDayString(new Date()), []);

  const refresh = useCallback(() => {
    void fetchToday();
    void fetchAll();
  }, [fetchToday, fetchAll]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  useEffect(() => {
    if (dayKey) refresh();
  }, [dayKey, refresh]);

  const habits: HabitForCalendarDay[] = useMemo(
    () => getHabitsDueOnDay(allHabits, todayHabits, dayKey, todayDateKey),
    [allHabits, todayHabits, dayKey, todayDateKey],
  );

  const isToday = dayKey === todayDateKey;
  const isLoading =
    (isTodayLoading && todayHabits.length === 0) || (isAllLoading && allHabits.length === 0);

  return {
    habits,
    count: habits.length,
    isToday,
    isLoading,
    todayDateKey,
    refresh,
  };
}
