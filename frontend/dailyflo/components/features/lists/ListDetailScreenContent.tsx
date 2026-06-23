/**
 * browse list detail body — tasks + habits for one list, list/timeline layouts from display prefs.
 * parent route owns blur header, back button, and overflow toolbar.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { useThemeColors, useSemanticColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { ListCard } from '@/components/ui/Card';
import { DayTimelineWithAllDayFooter, DayListSegmentChrome } from '@/components/features/timeline';
import { useHabitsForList } from '@/components/features/habits/day';
import { Paddings } from '@/constants/Paddings';
import { todayListScrollTopPadding } from '@/constants/todayScreenChrome';
import { LIST_CARD_TASK_ROW_PRESET_TODAY } from '@/constants/listCardTaskRowPreset';
import { DEFAULT_DISPLAY_LAYOUT_VIEW_TODAY } from '@/components/features/display/displayLayoutOptions';
import {
  mapTodayDisplayPrefsToListCard,
  mapTimelineAllDayListDisplayProps,
} from '@/components/features/display/displayPreferenceMappers';
import { useUI } from '@/store/hooks';
import { useAppDispatch, useAppSelector, store } from '@/store';
import { updateTask, deleteTask, transformApiTaskToTask } from '@/store/slices/tasks/tasksSlice';
import listsApi from '@/services/api/lists';
import { Task } from '@/types';
import {
  expandTasksForDates,
  filterTasksForCalendarDay,
  buildListDetailDisplayTasks,
  isExpandedRecurrenceId,
  getBaseTaskId,
  getOccurrenceDateFromId,
  toLocalCalendarDayString,
} from '@/utils/recurrenceUtils';
import {
  coerceWakeSleepHHMM,
  DEFAULT_SLEEP_HHMM,
  DEFAULT_WAKE_HHMM,
  timelinePlannerHoursFromWakeSleepHHMM,
} from '@/utils/preferenceScheduleTimes';

export type ListDetailScreenContentProps = {
  listId: string;
  title: string;
  listSelectionMode?: boolean;
  /** shared with browse blur mini title — ListCard updates this on scroll */
  scrollYSharedValue?: ReturnType<typeof useSharedValue<number>>;
};

export function ListDetailScreenContent({
  listId,
  title,
  listSelectionMode = false,
  scrollYSharedValue: scrollYProp,
}: ListDetailScreenContentProps) {
  const router = useGuardedRouter();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const themeColors = useThemeColors();
  const semanticColors = useSemanticColors();
  const typography = useTypography();
  const internalScrollY = useSharedValue(0);
  const scrollY = scrollYProp ?? internalScrollY;
  const { selection, toggleItemSelection } = useUI();

  const listDisplayPrefs = useAppSelector(
    (state) => state.auth.user?.preferences?.displayPreferences?.list,
  );
  const listListDisplayProps = useMemo(
    () => mapTodayDisplayPrefsToListCard(listDisplayPrefs),
    [listDisplayPrefs],
  );
  const layoutView = listDisplayPrefs?.layoutView ?? DEFAULT_DISPLAY_LAYOUT_VIEW_TODAY;
  const listTimelineDisplayProps = useMemo(
    () => mapTimelineAllDayListDisplayProps(listDisplayPrefs),
    [listDisplayPrefs],
  );

  const wakeHHMMFromProfile = useAppSelector((s) =>
    coerceWakeSleepHHMM(s.auth.user?.preferences.wakeTime, DEFAULT_WAKE_HHMM),
  );
  const sleepHHMMFromProfile = useAppSelector((s) =>
    coerceWakeSleepHHMM(s.auth.user?.preferences.sleepTime, DEFAULT_SLEEP_HHMM),
  );
  const { startHour: listTimelineStartHour, endHour: listTimelineEndHour } = useMemo(
    () => timelinePlannerHoursFromWakeSleepHHMM(wakeHHMMFromProfile, sleepHHMMFromProfile),
    [wakeHHMMFromProfile, sleepHHMMFromProfile],
  );

  const [listTasks, setListTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);

  const todayDateStr = useMemo(() => toLocalCalendarDayString(new Date()), []);

  const loadListTasks = useCallback(async () => {
    if (!listId) return;
    setTasksLoading(true);
    try {
      const raw = await listsApi.fetchTasksForList(listId);
      setListTasks(raw.map((row) => transformApiTaskToTask(row)));
    } catch {
      setListTasks([]);
    } finally {
      setTasksLoading(false);
    }
  }, [listId]);

  useFocusEffect(
    useCallback(() => {
      void loadListTasks();
    }, [loadListTasks]),
  );

  useEffect(() => {
    scrollY.value = 0;
  }, [layoutView, scrollY]);

  const {
    habits: listDayHabits,
    todayHabits: listTodayHabits,
    otherHabits: listOtherHabits,
    count: listHabitsCount,
    isToday: listHabitsIsToday,
    isLoading: listHabitsLoading,
    refresh: refreshListHabits,
  } = useHabitsForList(listId);

  const handleHabitDetailPress = useCallback(
    (habitId: string) => {
      router.push({ pathname: '/habit/[habitId]', params: { habitId } } as any);
    },
    [router],
  );

  const listHabitsSegment = useMemo(
    () => ({
      dayKey: todayDateStr,
      habits: listDayHabits,
      count: listHabitsCount,
      isToday: listHabitsIsToday,
      isLoading: listHabitsLoading,
      onOpenDetail: handleHabitDetailPress,
    }),
    [
      todayDateStr,
      listDayHabits,
      listHabitsCount,
      listHabitsIsToday,
      listHabitsLoading,
      handleHabitDetailPress,
    ],
  );

  const listDisplayTasks = useMemo(
    () => buildListDetailDisplayTasks(listTasks, todayDateStr),
    [listTasks, todayDateStr],
  );

  const listTodayTasks = useMemo(() => {
    const expanded = expandTasksForDates(listTasks, [todayDateStr], {
      includeOneOffBeforeRange: false,
    });
    return filterTasksForCalendarDay(expanded, todayDateStr);
  }, [listTasks, todayDateStr]);

  const listScheduleAnchorsPayload = useMemo(
    () => ({
      wakeHHMM: wakeHHMMFromProfile,
      sleepHHMM: sleepHHMMFromProfile,
      dueDateIso: `${todayDateStr}T12:00:00`,
    }),
    [wakeHHMMFromProfile, sleepHHMMFromProfile, todayDateStr],
  );

  const handleRefresh = useCallback(async () => {
    await Promise.all([loadListTasks(), refreshListHabits()]);
  }, [loadListTasks, refreshListHabits]);

  const handleTaskPress = useCallback(
    (task: Task) => {
      const baseId = isExpandedRecurrenceId(task.id) ? getBaseTaskId(task.id) : task.id;
      const occurrenceDate = isExpandedRecurrenceId(task.id)
        ? getOccurrenceDateFromId(task.id)
        : undefined;
      router.push({
        pathname: '/task/[taskId]',
        params: { taskId: baseId, ...(occurrenceDate ? { occurrenceDate } : {}) },
      } as any);
    },
    [router],
  );

  const handleTaskComplete = useCallback(
    (task: Task, targetCompleted?: boolean) => {
      const isCompleted = targetCompleted ?? !task.isCompleted;
      if (isExpandedRecurrenceId(task.id)) {
        const baseId = getBaseTaskId(task.id);
        const occurrenceDate = getOccurrenceDateFromId(task.id);
        if (!occurrenceDate) return;
        const tasksFromStore = store.getState().tasks.tasks;
        const baseTask =
          tasksFromStore.find((t) => t.id === baseId) ?? listTasks.find((t) => t.id === baseId);
        if (!baseTask) return;
        const completions = baseTask.metadata?.recurrence_completions ?? [];
        const newCompletions = isCompleted
          ? [...completions, occurrenceDate]
          : completions.filter((d) => d !== occurrenceDate);
        void (async () => {
          try {
            await dispatch(
              updateTask({
                id: baseId,
                updates: {
                  id: baseId,
                  metadata: { ...baseTask.metadata, recurrence_completions: newCompletions },
                },
              }),
            ).unwrap();
            void loadListTasks();
          } catch {
            void loadListTasks();
          }
        })();
      } else {
        void (async () => {
          try {
            await dispatch(
              updateTask({
                id: task.id,
                updates: { id: task.id, isCompleted },
              }),
            ).unwrap();
            void loadListTasks();
          } catch {
            void loadListTasks();
          }
        })();
      }
    },
    [dispatch, loadListTasks, listTasks],
  );

  const handleTaskEdit = useCallback(
    (task: Task) => {
      const baseId = isExpandedRecurrenceId(task.id) ? getBaseTaskId(task.id) : task.id;
      const occurrenceDate = isExpandedRecurrenceId(task.id)
        ? getOccurrenceDateFromId(task.id)
        : undefined;
      router.push({
        pathname: '/task/[taskId]',
        params: { taskId: baseId, ...(occurrenceDate ? { occurrenceDate } : {}) },
      } as any);
    },
    [router],
  );

  const handleTaskDelete = useCallback(
    (task: Task) => {
      const taskId = isExpandedRecurrenceId(task.id) ? getBaseTaskId(task.id) : task.id;
      void (async () => {
        try {
          await dispatch(deleteTask(taskId)).unwrap();
        } finally {
          void loadListTasks();
        }
      })();
    },
    [dispatch, loadListTasks],
  );

  const handleTaskTimeChange = useCallback(
    (taskId: string, newTime: string, newDuration?: number) => {
      void (async () => {
        try {
          await dispatch(
            updateTask({
              id: taskId,
              updates: {
                id: taskId,
                time: newTime,
                ...(newDuration !== undefined ? { duration: newDuration } : {}),
              },
            }),
          ).unwrap();
          void loadListTasks();
        } catch {
          void loadListTasks();
        }
      })();
    },
    [dispatch, loadListTasks],
  );

  const bigHeaderLabel = listSelectionMode
    ? `${selection.selectedItems.length} selected`
    : title;

  const styles = useMemo(
    () => createStyles(themeColors, semanticColors, typography),
    [themeColors, semanticColors, typography],
  );

  if (layoutView === 'list') {
    return (
      <View style={styles.root}>
        <DayListSegmentChrome
          dayKey={todayDateStr}
          habits={listDayHabits}
          habitsCount={listHabitsCount}
          habitsIsToday={listHabitsIsToday}
          habitsLoading={listHabitsLoading}
          onOpenHabitDetail={handleHabitDetailPress}
          habitListViewSections={{
            today: listTodayHabits,
            other: listOtherHabits,
          }}
          habitsEmptyMessage="No habits in this list yet."
          useBrowseStackHeader
          scrollYSharedValue={scrollY}
          bigHeaderLabel={bigHeaderLabel}
        >
          {(chrome) => (
            <ListCard
              key={`browse-list-${listId}-listcard`}
              tasks={listDisplayTasks}
              selectionMode={listSelectionMode}
              selectedTaskIds={selection.selectedItems}
              onToggleTaskSelection={listSelectionMode ? toggleItemSelection : undefined}
              hideCompletedTasks={listListDisplayProps.hideCompletedTasks}
              onTaskPress={handleTaskPress}
              onTaskComplete={handleTaskComplete}
              onTaskEdit={handleTaskEdit}
              onTaskDelete={handleTaskDelete}
              {...LIST_CARD_TASK_ROW_PRESET_TODAY}
              emptyMessage="No tasks in this list yet."
              loading={tasksLoading && listTasks.length === 0}
              groupBy="listDetail"
              sortBy={listListDisplayProps.sortBy}
              sortDirection={listListDisplayProps.sortDirection}
              bigTodayHeader
              bigHeaderLabel={bigHeaderLabel}
              prependListContent={chrome.scrollPills}
              onRefresh={handleRefresh}
              refreshing={tasksLoading}
              scrollYSharedValue={scrollY}
              showsVerticalScrollIndicator
              paddingTop={todayListScrollTopPadding()}
              paddingHorizontal={Paddings.screen}
              scrollPastTopInset
            />
          )}
        </DayListSegmentChrome>
      </View>
    );
  }

  return (
    <View style={styles.timelineRoot}>
      <DayTimelineWithAllDayFooter
        dayKey={todayDateStr}
        tasks={listTodayTasks}
        allDayListDisplayProps={listTimelineDisplayProps}
        hideCompletedOnTimeline={listTimelineDisplayProps.hideCompletedTasks}
        onTaskTimeChange={handleTaskTimeChange}
        onTaskPress={handleTaskPress}
        onTaskComplete={handleTaskComplete}
        onTaskEdit={handleTaskEdit}
        onTaskDelete={handleTaskDelete}
        selectionMode={listSelectionMode}
        selectedTaskIds={selection.selectedItems}
        onToggleTaskSelection={listSelectionMode ? toggleItemSelection : undefined}
        plannerScheduleAnchors={listScheduleAnchorsPayload}
        startHour={listTimelineStartHour}
        endHour={listTimelineEndHour}
        scrollContentPaddingTop={0}
        scrollPastTopInset
        scrollYSharedValue={scrollY}
        showTodayBigHeader
        todayHeaderLabel={bigHeaderLabel}
        emptyAllDayMessage="No tasks for today in this list."
        allDayFooterKeyPrefix={`list-${listId}-allday`}
        useAllDayPillBar
        habitsSegment={listHabitsSegment}
        useTodayStickyPillHeader
      />
    </View>
  );
}

const createStyles = (
  themeColors: ReturnType<typeof useThemeColors>,
  semanticColors: ReturnType<typeof useSemanticColors>,
  typography: ReturnType<typeof useTypography>,
) =>
  StyleSheet.create({
    root: {
      flex: 1,
    },
    timelineRoot: {
      flex: 1,
    },
  });
