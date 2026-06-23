/**
 * habits due today that belong to a user list — filters library + today API by listId.
 */

import { useCallback, useEffect, useMemo } from 'react';
import { useFocusEffect } from 'expo-router';

import { useHabits } from '@/store/hooks';
import { toLocalCalendarDayString } from '@/utils/recurrenceUtils';
import { getHabitsDueOnDay, getListHabitsNotDueOnDay, type HabitForCalendarDay } from '@/utils/habitSchedule';

function habitMatchesList(
  listId: string,
  habitListId: string | null | undefined,
): boolean {
  if (habitListId == null || habitListId === '') return false;
  return habitListId === listId;
}

export function useHabitsForList(listId: string | undefined) {
  const {
    allHabits,
    todayHabits: todayHabitsFromApi,
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
    if (listId) refresh();
  }, [listId, refresh]);

  const filteredAllHabits = useMemo(() => {
    if (!listId) return [];
    return allHabits.filter((h) => habitMatchesList(listId, h.listId));
  }, [allHabits, listId]);

  const filteredTodayHabits = useMemo(() => {
    if (!listId) return [];
    return todayHabitsFromApi.filter((h) => habitMatchesList(listId, h.listId));
  }, [todayHabitsFromApi, listId]);

  const todayHabits: HabitForCalendarDay[] = useMemo(
    () => getHabitsDueOnDay(filteredAllHabits, filteredTodayHabits, todayDateKey, todayDateKey),
    [filteredAllHabits, filteredTodayHabits, todayDateKey],
  );

  // habits on this list that are not due today — shown under One-time (matches task list sections)
  const otherHabits: HabitForCalendarDay[] = useMemo(
    () => getListHabitsNotDueOnDay(filteredAllHabits, todayDateKey),
    [filteredAllHabits, todayDateKey],
  );

  const isLoading =
    (isTodayLoading && todayHabitsFromApi.length === 0) ||
    (isAllLoading && allHabits.length === 0);

  return {
    habits: todayHabits,
    todayHabits,
    otherHabits,
    count: todayHabits.length,
    isToday: true,
    isLoading,
    todayDateKey,
    refresh,
  };
}
