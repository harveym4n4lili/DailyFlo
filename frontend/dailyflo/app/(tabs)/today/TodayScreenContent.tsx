/**
 * shared today list + blur header — used by index (normal / android in-place selection)
 * and by select (ios pushed route; list always in selection mode).
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, Text, Animated, Platform } from 'react-native';
import AnimatedReanimated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedReaction,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from 'expo-router';

import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { useAuthSessionReady } from '@/hooks/useAuthSessionReady';

import { ScreenContainer } from '@/components/index';
import { ListCard } from '@/components/ui/Card';
import { DayTimelineWithAllDayFooter, DayListSegmentChrome } from '@/components/features/timeline';
import { useHabitsForCalendarDay } from '@/components/features/habits/day';
import {
  TabRootTopSectionChrome,
  TabRootScreenBackdrop,
} from '@/components/navigation/TabRootTopSectionChrome';
import { SelectionCloseButton, SelectAllButton } from '@/components/ui/Button';
import { ScreenHeaderActions } from '@/components/ui';
import { IosTaskSelectionCloseStackToolbar } from '@/components/navigation/IosTaskSelectionCloseStackToolbar';
import { IosTaskSelectionSelectAllStackToolbar } from '@/components/navigation/IosTaskSelectionSelectAllStackToolbar';
import { useCreateTaskDraft } from '@/app/task/CreateTaskDraftContext';

import { useThemeColors, useSemanticColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { Paddings } from '@/constants/Paddings';
import { todayListScrollTopPadding } from '@/constants/todayScreenChrome';
import { LIST_CARD_TASK_ROW_PRESET_TODAY } from '@/constants/listCardTaskRowPreset';
import { DEFAULT_DISPLAY_LAYOUT_VIEW_TODAY } from '@/components/features/display/displayLayoutOptions';
import {
  mapTodayDisplayPrefsToListCard,
  mapTimelineAllDayListDisplayProps,
} from '@/components/features/display/displayPreferenceMappers';

import { useTasks, useUI } from '@/store/hooks';
import { useAppDispatch, useAppSelector, store } from '@/store';
import { fetchTasks, updateTask, deleteTask } from '@/store/slices/tasks/tasksSlice';
import { fetchLists } from '@/store/slices/lists/listsSlice';

import { Task } from '@/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { flushAllPendingCheckboxSyncs } from '@/utils/pendingCheckboxSyncRegistry';
import { flushAllPendingHabitIncrementSyncs } from '@/utils/pendingHabitIncrementSyncRegistry';
import {
  expandTasksForDates,
  filterTasksForCalendarDay,
  getTargetDatesForTodayScreen,
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

export type TodayScreenContentMode = 'index' | 'select';

export type TodayScreenContentProps = {
  mode: TodayScreenContentMode;
};

export function TodayScreenContent({ mode }: TodayScreenContentProps) {
  const isSelectRoute = mode === 'select';
  const router = useGuardedRouter();
  const openDisplaySettings = useCallback(() => {
    router.push('/(tabs)/today/display' as any);
  }, [router]);
  const scrollY = useSharedValue(0);

  const miniHeaderOpacity = useSharedValue(0);
  useAnimatedReaction(
    () => scrollY.value > 48,
    (shouldShow) => {
      miniHeaderOpacity.value = withTiming(shouldShow ? 1 : 0, { duration: 200 });
    }
  );

  const miniTodayHeaderStyle = useAnimatedStyle(() => ({
    opacity: miniHeaderOpacity.value,
  }));

  const { setDraft, registerOverdueReschedule, clearOverdueReschedule } = useCreateTaskDraft();
  const { selection, toggleItemSelection, exitSelectionMode, selectAllItems, clearSelection } = useUI();

  const closeButtonScale = useSharedValue(0);
  const androidInPlaceSelection =
    Platform.OS === 'android' && selection.isSelectionMode && selection.selectionType === 'tasks';

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    closeButtonScale.value = withSpring(androidInPlaceSelection ? 1 : 0, {
      damping: 45,
      stiffness: 600,
    });
  }, [androidInPlaceSelection, closeButtonScale]);

  const handleCloseButtonPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    closeButtonScale.value = withTiming(0, { duration: 150 });
    setTimeout(exitSelectionMode, 90);
  }, [closeButtonScale, exitSelectionMode]);

  const closeButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: closeButtonScale.value }],
  }));

  const listSelectionMode = isSelectRoute || androidInPlaceSelection;

  const [showTitle, setShowTitle] = useState(false);
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const isAnimatingRef = useRef(false);

  const themeColors = useThemeColors();
  const semanticColors = useSemanticColors();
  const typography = useTypography();
  const insets = useSafeAreaInsets();
  const styles = useMemo(
    () => createStyles(themeColors, semanticColors, typography, insets),
    [themeColors, semanticColors, typography, insets]
  );

  const dispatch = useAppDispatch();
  const authSessionReady = useAuthSessionReady();
  const {
    tasks,
    isLoading,
    error,
    lastFetched,
  } = useTasks();

  useEffect(() => {
    if (!isLoading) {
      scrollY.value = 0;
      miniHeaderOpacity.value = 0;
    }
  }, [isLoading, scrollY, miniHeaderOpacity]);

  useEffect(() => {
    if (!isSelectRoute) return;
    scrollY.value = 0;
    miniHeaderOpacity.value = 0;
  }, [isSelectRoute, scrollY, miniHeaderOpacity]);

  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const todayDisplayPrefs = useAppSelector(
    (state) => state.auth.user?.preferences?.displayPreferences?.today
  );
  const todayListDisplayProps = useMemo(
    () => mapTodayDisplayPrefsToListCard(todayDisplayPrefs),
    [todayDisplayPrefs]
  );
  const layoutView = todayDisplayPrefs?.layoutView ?? DEFAULT_DISPLAY_LAYOUT_VIEW_TODAY;
  const todayTimelineDisplayProps = useMemo(
    () => mapTimelineAllDayListDisplayProps(todayDisplayPrefs),
    [todayDisplayPrefs]
  );

  // reset scroll offset when switching list ↔ timeline so header + mini title state match
  useEffect(() => {
    scrollY.value = 0;
  }, [layoutView, scrollY]);

  const wakeHHMMFromProfile = useAppSelector((s) =>
    coerceWakeSleepHHMM(s.auth.user?.preferences.wakeTime, DEFAULT_WAKE_HHMM)
  );
  const sleepHHMMFromProfile = useAppSelector((s) =>
    coerceWakeSleepHHMM(s.auth.user?.preferences.sleepTime, DEFAULT_SLEEP_HHMM)
  );
  const { startHour: todayTimelineStartHour, endHour: todayTimelineEndHour } = useMemo(
    () => timelinePlannerHoursFromWakeSleepHHMM(wakeHHMMFromProfile, sleepHHMMFromProfile),
    [wakeHHMMFromProfile, sleepHHMMFromProfile]
  );
  const listsLastFetched = useAppSelector((state) => state.lists.lastFetched);
  const listsLoading = useAppSelector((state) => state.lists.isLoading);
  const listsError = useAppSelector((state) => state.lists.error);

  const todaysTasks = useMemo(() => {
    const targetDates = getTargetDatesForTodayScreen();
    return expandTasksForDates(tasks, targetDates, {
      includeOneOffBeforeRange: true,
    });
  }, [tasks]);

  const todayDateStr = useMemo(() => toLocalCalendarDayString(new Date()), []);

  const {
    habits: todayDayHabits,
    count: todayHabitsCount,
    isToday: todayHabitsIsToday,
    isLoading: todayHabitsLoading,
    refresh: refreshTodayHabits,
  } = useHabitsForCalendarDay(todayDateStr);

  const handleHabitDetailPress = useCallback(
    (habitId: string) => {
      router.push({ pathname: '/habit/[habitId]', params: { habitId } });
    },
    [router],
  );

  const todayHabitsSegment = useMemo(
    () => ({
      dayKey: todayDateStr,
      habits: todayDayHabits,
      count: todayHabitsCount,
      isToday: todayHabitsIsToday,
      isLoading: todayHabitsLoading,
      onOpenDetail: handleHabitDetailPress,
    }),
    [
      todayDateStr,
      todayDayHabits,
      todayHabitsCount,
      todayHabitsIsToday,
      todayHabitsLoading,
      handleHabitDetailPress,
    ],
  );

  // timeline layout: calendar today only — no overdue section
  const todayCalendarTasks = useMemo(
    () => filterTasksForCalendarDay(todaysTasks, todayDateStr),
    [todaysTasks, todayDateStr]
  );

  const todayScheduleAnchorsPayload = useMemo(
    () => ({
      wakeHHMM: wakeHHMMFromProfile,
      sleepHHMM: sleepHHMMFromProfile,
      dueDateIso: `${todayDateStr}T12:00:00`,
    }),
    [wakeHHMMFromProfile, sleepHHMMFromProfile, todayDateStr]
  );
  const eligibleTodayTaskIds = useMemo(() => {
    return todaysTasks
      .filter((t) => !t.isCompleted && !t.softDeleted && t.dueDate?.slice(0, 10) === todayDateStr)
      .map((t) => t.id);
  }, [todaysTasks, todayDateStr]);

  const allEligibleSelected =
    eligibleTodayTaskIds.length > 0 &&
    eligibleTodayTaskIds.every((id) => selection.selectedItems.includes(id));
  const selectAllLabel = allEligibleSelected ? 'Deselect all' : 'Select all';

  const handleSelectAllToday = useCallback(() => {
    if (!listSelectionMode) return;
    if (allEligibleSelected) {
      clearSelection();
    } else {
      selectAllItems(eligibleTodayTaskIds);
    }
  }, [listSelectionMode, allEligibleSelected, eligibleTodayTaskIds, selectAllItems, clearSelection]);

  const titleThreshold = insets.top + 12;
  const onTitleThresholdCrossed = useCallback(
    (pastThreshold: boolean) => {
      if (pastThreshold && !showTitle && !isAnimatingRef.current) {
        setShowTitle(true);
        isAnimatingRef.current = true;
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          isAnimatingRef.current = false;
        });
      } else if (!pastThreshold && showTitle && !isAnimatingRef.current) {
        isAnimatingRef.current = true;
        Animated.timing(titleOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setShowTitle(false);
          isAnimatingRef.current = false;
        });
      }
    },
    [showTitle, titleOpacity]
  );
  useAnimatedReaction(
    () => scrollY.value >= titleThreshold,
    (pastThreshold, previousPastThreshold) => {
      if (previousPastThreshold !== null && pastThreshold !== previousPastThreshold) {
        runOnJS(onTitleThresholdCrossed)(pastThreshold);
      }
    }
  );

  useEffect(() => {
    if (authSessionReady && lastFetched === null && !isLoading && !error) {
      dispatch(fetchTasks());
    }
    if (authSessionReady && listsLastFetched === null && !listsLoading && !listsError) {
      dispatch(fetchLists());
    }
  }, [
    authSessionReady,
    lastFetched,
    isLoading,
    error,
    listsLastFetched,
    listsLoading,
    listsError,
    dispatch,
  ]);

  const handleTaskPress = useCallback(
    (task: Task) => {
      const baseId = isExpandedRecurrenceId(task.id) ? getBaseTaskId(task.id) : task.id;
      const occurrenceDate = isExpandedRecurrenceId(task.id)
        ? getOccurrenceDateFromId(task.id)
        : undefined;
      router.push({
        pathname: '/task/[taskId]',
        params: { taskId: baseId, ...(occurrenceDate ? { occurrenceDate } : {}) },
      });
    },
    [router]
  );

  const handleTaskComplete = useCallback(
    (task: Task, targetCompleted?: boolean) => {
      const isCompleted = targetCompleted ?? !task.isCompleted;
      if (isExpandedRecurrenceId(task.id)) {
        const baseId = getBaseTaskId(task.id);
        const occurrenceDate = getOccurrenceDateFromId(task.id);
        if (!occurrenceDate) return;
        const tasksFromStore = store.getState().tasks.tasks;
        const baseTask = tasksFromStore.find((t) => t.id === baseId);
        if (!baseTask) return;
        const completions = baseTask.metadata?.recurrence_completions ?? [];
        const newCompletions = isCompleted
          ? [...completions, occurrenceDate]
          : completions.filter((d) => d !== occurrenceDate);
        dispatch(
          updateTask({
            id: baseId,
            updates: {
              id: baseId,
              metadata: { ...baseTask.metadata, recurrence_completions: newCompletions },
            },
          })
        );
      } else {
        dispatch(
          updateTask({
            id: task.id,
            updates: { id: task.id, isCompleted },
          })
        );
      }
    },
    [dispatch]
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
      });
    },
    [router]
  );

  const handleTaskDelete = useCallback(
    (task: Task) => {
      const taskId = isExpandedRecurrenceId(task.id) ? getBaseTaskId(task.id) : task.id;
      dispatch(deleteTask(taskId));
    },
    [dispatch]
  );

  const handleTaskTimeChange = useCallback(
    async (taskId: string, newTime: string, newDuration?: number) => {
      try {
        const baseId = isExpandedRecurrenceId(taskId) ? getBaseTaskId(taskId) : taskId;
        const task = tasks.find((t) => t.id === baseId);
        if (!task) return;

        const updates: { id: string; time: string; duration?: number } = {
          id: baseId,
          time: newTime,
        };
        if (newDuration !== undefined) updates.duration = newDuration;
        await dispatch(updateTask({ id: baseId, updates })).unwrap();
      } catch (err) {
        console.error('Failed to update task time:', err);
      }
    },
    [dispatch, tasks]
  );

  useFocusEffect(
    React.useCallback(() => {
      clearOverdueReschedule();
      return () => {
        flushAllPendingCheckboxSyncs();
        flushAllPendingHabitIncrementSyncs();
      };
    }, [clearOverdueReschedule])
  );

  const handleOverdueReschedulePress = (overdueTasks: Task[]) => {
    const ids = [
      ...new Set(overdueTasks.map((t) => (isExpandedRecurrenceId(t.id) ? getBaseTaskId(t.id) : t.id))),
    ];
    const initialDate = overdueTasks[0]?.dueDate ?? new Date().toISOString();
    setDraft({ dueDate: initialDate, time: undefined, duration: undefined, alerts: [] });

    registerOverdueReschedule((date) => {
      void (async () => {
        try {
          await Promise.all(
            ids.map((taskId) =>
              dispatch(updateTask({ id: taskId, updates: { id: taskId, dueDate: date } }))
            )
          );
        } catch (err) {
          console.error('Failed to bulk reschedule overdue tasks:', err);
        }
      })();
    });

    router.push('/date-select');
  };

  const screenBackdrop = <TabRootScreenBackdrop />;

  const handleRefresh = async () => {
    if (!authSessionReady) return;
    await Promise.all([
      dispatch(fetchTasks()),
      dispatch(fetchLists()),
      refreshTodayHabits(),
    ]);
  };

  const miniHeaderLabel =
    isSelectRoute || androidInPlaceSelection
      ? `${selection.selectedItems.length} selected`
      : 'Today';

  const todayBigHeaderLabel =
    listSelectionMode ? `${selection.selectedItems.length} selected` : 'Today';

  // authed user but fetch not dispatched/pending yet (one frame gap) — avoids flashing empty copy before loading UI
  const awaitingFirstTaskFetch =
    isAuthenticated && lastFetched === null && !error;

  if ((isLoading || awaitingFirstTaskFetch) && tasks.length === 0) {
    return (
      <View style={{ flex: 1 }}>
        <ScreenContainer scrollable={false} paddingHorizontal={0} backgroundColor="transparent">
          <Text style={styles.loadingText}>Loading tasks...</Text>
        </ScreenContainer>
        {screenBackdrop}
      </View>
    );
  }

  if (error && tasks.length === 0) {
    return (
      <View style={{ flex: 1 }}>
        <ScreenContainer scrollable={false} paddingHorizontal={0} backgroundColor="transparent">
          <Text style={styles.errorText}>Failed to load tasks</Text>
          <Text style={styles.hint}>Pull down to try again</Text>
        </ScreenContainer>
        {screenBackdrop}
      </View>
    );
  }

  return (
    <>
      {isSelectRoute && Platform.OS === 'ios' ? (
        <>
          <IosTaskSelectionCloseStackToolbar dismissWithRouterBack />
          <IosTaskSelectionSelectAllStackToolbar
            onPress={handleSelectAllToday}
            allEligibleSelected={allEligibleSelected}
          />
        </>
      ) : null}
      <View style={{ flex: 1 }}>
        <ScreenContainer
          scrollable={false}
          paddingHorizontal={0}
          paddingVertical={0}
          safeAreaTop={false}
          safeAreaBottom={false}
          backgroundColor="transparent"
        >
          {layoutView === 'list' ? (
            <DayListSegmentChrome
              dayKey={todayDateStr}
              habits={todayDayHabits}
              habitsCount={todayHabitsCount}
              habitsIsToday={todayHabitsIsToday}
              habitsLoading={todayHabitsLoading}
              onOpenHabitDetail={handleHabitDetailPress}
              useInboxTabHeader
              scrollYSharedValue={scrollY}
              bigHeaderLabel={todayBigHeaderLabel}
            >
              {(chrome) => (
                <ListCard
                  key={isSelectRoute ? 'today-select-listcard' : 'today-screen-listcard'}
                  tasks={todaysTasks}
                  selectionMode={listSelectionMode}
                  selectedTaskIds={selection.selectedItems}
                  onToggleTaskSelection={listSelectionMode ? toggleItemSelection : undefined}
                  hideCompletedTasks={todayListDisplayProps.hideCompletedTasks}
                  onTaskPress={handleTaskPress}
                  onTaskComplete={handleTaskComplete}
                  onTaskEdit={handleTaskEdit}
                  onTaskDelete={handleTaskDelete}
                  {...LIST_CARD_TASK_ROW_PRESET_TODAY}
                  emptyMessage="No tasks for today yet. Tap the + button to add your first task!"
                  loading={isLoading && todaysTasks.length === 0}
                  groupBy="dueDate"
                  lockTodayGroupExpanded
                  sortBy={todayListDisplayProps.sortBy}
                  sortDirection={todayListDisplayProps.sortDirection}
                  onOverdueReschedule={handleOverdueReschedulePress}
                  hideTodayHeader
                  bigTodayHeader
                  bigHeaderLabel={todayBigHeaderLabel}
                  prependListContent={chrome.scrollPills}
                  onRefresh={handleRefresh}
                  refreshing={isLoading}
                  scrollYSharedValue={scrollY}
                  showsVerticalScrollIndicator
                  paddingTop={todayListScrollTopPadding()}
                  paddingHorizontal={Paddings.screen}
                  scrollPastTopInset
                  paddingBottom={
                    isSelectRoute && Platform.OS === 'ios' ? 56 + 28 + insets.bottom : undefined
                  }
                />
              )}
            </DayListSegmentChrome>
          ) : (
            <View style={styles.todayTimelineContainer}>
              <DayTimelineWithAllDayFooter
              dayKey={todayDateStr}
              tasks={todayCalendarTasks}
              allDayListDisplayProps={todayTimelineDisplayProps}
              hideCompletedOnTimeline={todayTimelineDisplayProps.hideCompletedTasks}
              onTaskTimeChange={handleTaskTimeChange}
              onTaskPress={handleTaskPress}
              onTaskComplete={handleTaskComplete}
              onTaskEdit={handleTaskEdit}
              onTaskDelete={handleTaskDelete}
              selectionMode={listSelectionMode}
              selectedTaskIds={selection.selectedItems}
              onToggleTaskSelection={listSelectionMode ? toggleItemSelection : undefined}
              plannerScheduleAnchors={todayScheduleAnchorsPayload}
              startHour={todayTimelineStartHour}
              endHour={todayTimelineEndHour}
              scrollContentPaddingTop={0}
              scrollPastTopInset={true}
              scrollYSharedValue={scrollY}
              showTodayBigHeader
              todayHeaderLabel={todayBigHeaderLabel}
              scrollContentPaddingBottom={
                isSelectRoute && Platform.OS === 'ios' ? 56 + 28 + insets.bottom : undefined
              }
              emptyAllDayMessage="No all-day tasks for today."
              allDayFooterKeyPrefix="today-allday"
              useAllDayPillBar
              habitsSegment={todayHabitsSegment}
              useTodayStickyPillHeader
            />
            </View>
          )}
        </ScreenContainer>
        {screenBackdrop}
        <TabRootTopSectionChrome
          miniHeaderLabel={miniHeaderLabel}
          miniHeaderStyle={miniTodayHeaderStyle}
          leftSlot={
            Platform.OS === 'android' ? (
              <AnimatedReanimated.View
                style={[styles.topSectionCloseButton, closeButtonAnimatedStyle]}
                pointerEvents={androidInPlaceSelection ? 'auto' : 'none'}
              >
                <SelectionCloseButton onPress={handleCloseButtonPress} />
              </AnimatedReanimated.View>
            ) : (
              <View style={styles.topSectionCloseButton} pointerEvents="none" />
            )
          }
          rightSlot={
            androidInPlaceSelection ? (
              <SelectAllButton
                onPress={handleSelectAllToday}
                label={selectAllLabel}
                style={styles.topSectionSelectAllButton}
              />
            ) : Platform.OS === 'android' ? (
              <ScreenHeaderActions
                variant="dashboard"
                onDashboardPress={openDisplaySettings}
                style={styles.topSectionContextButton}
                tint="primary"
              />
            ) : null
          }
        />
      </View>
    </>
  );
}

const createStyles = (
  themeColors: ReturnType<typeof useThemeColors>,
  semanticColors: ReturnType<typeof useSemanticColors>,
  typography: ReturnType<typeof useTypography>,
  insets: ReturnType<typeof useSafeAreaInsets>
) =>
  StyleSheet.create({
    topSectionCloseButton: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    topSectionContextButton: {
      marginLeft: 'auto',
      alignSelf: 'center',
      backgroundColor: 'transparent',
    },
    topSectionSelectAllButton: {
      marginLeft: 'auto',
      alignSelf: 'center',
    },
    loadingText: {
      ...typography.getTextStyle('body-large'),
      marginTop: 20,
      textAlign: 'center',
      color: themeColors.text.tertiary(),
    },
    errorText: {
      ...typography.getTextStyle('body-large'),
      color: semanticColors.error(),
      textAlign: 'center',
      marginTop: 20,
      marginBottom: 8,
    },
    hint: {
      ...typography.getTextStyle('body-large'),
      marginTop: 8,
      textAlign: 'center',
      color: themeColors.text.tertiary(),
    },
    todayTimelineContainer: {
      flex: 1,
      overflow: 'hidden',
    },
  });
