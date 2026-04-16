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
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useRouter, useFocusEffect } from 'expo-router';

import { ScreenContainer } from '@/components';
import { ListCard } from '@/components/ui/card';
import { SelectionCloseButton, SelectAllButton } from '@/components/ui/button';
import { ScreenHeaderActions } from '@/components/ui';
import { IosTaskSelectionCloseStackToolbar } from '@/components/navigation/IosTaskSelectionCloseStackToolbar';
import { IosTaskSelectionSelectAllStackToolbar } from '@/components/navigation/IosTaskSelectionSelectAllStackToolbar';
import { useCreateTaskDraft } from '@/app/task/CreateTaskDraftContext';

import { useThemeColors, useSemanticColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { Paddings } from '@/constants/Paddings';
import { LIST_CARD_TASK_ROW_PRESET_TODAY } from '@/constants/listCardTaskRowPreset';

import { useTasks, useUI } from '@/store/hooks';
import { useAppDispatch, useAppSelector, store } from '@/store';
import { fetchTasks, updateTask, deleteTask } from '@/store/slices/tasks/tasksSlice';
import { fetchLists } from '@/store/slices/lists/listsSlice';

import { Task } from '@/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { flushAllPendingCheckboxSyncs } from '@/utils/pendingCheckboxSyncRegistry';
import {
  expandTasksForDates,
  getTargetDatesForTodayScreen,
  isExpandedRecurrenceId,
  getBaseTaskId,
  getOccurrenceDateFromId,
} from '@/utils/recurrenceUtils';

export type TodayScreenContentMode = 'index' | 'select';

export type TodayScreenContentProps = {
  mode: TodayScreenContentMode;
};

export function TodayScreenContent({ mode }: TodayScreenContentProps) {
  const isSelectRoute = mode === 'select';
  const router = useRouter();
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
  const {
    tasks,
    isLoading,
    error,
    lastFetched,
  } = useTasks();

  useEffect(() => {
    if (!isLoading) scrollY.value = 0;
  }, [isLoading, scrollY]);

  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const listsLastFetched = useAppSelector((state) => state.lists.lastFetched);
  const listsLoading = useAppSelector((state) => state.lists.isLoading);
  const listsError = useAppSelector((state) => state.lists.error);

  const todaysTasks = useMemo(() => {
    const targetDates = getTargetDatesForTodayScreen();
    return expandTasksForDates(tasks, targetDates, {
      includeOneOffBeforeRange: true,
    });
  }, [tasks]);

  const todayDateStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
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
    if (isAuthenticated && lastFetched === null && !isLoading && !error) {
      dispatch(fetchTasks());
    }
    if (isAuthenticated && listsLastFetched === null && !listsLoading && !listsError) {
      dispatch(fetchLists());
    }
  }, [
    isAuthenticated,
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

  useFocusEffect(
    React.useCallback(() => {
      clearOverdueReschedule();
      return () => flushAllPendingCheckboxSyncs();
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

  const screenBackdrop = useMemo(
    () => (
      <View
        style={[
          StyleSheet.absoluteFillObject,
          { backgroundColor: themeColors.background.primary(), zIndex: -1 },
        ]}
        pointerEvents="none"
      />
    ),
    [themeColors.theme]
  );

  const handleRefresh = async () => {
    await Promise.all([dispatch(fetchTasks()), dispatch(fetchLists())]);
  };

  const miniHeaderLabel =
    isSelectRoute || androidInPlaceSelection
      ? `${selection.selectedItems.length} selected`
      : 'Today';

  if (isLoading && tasks.length === 0) {
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
          <ListCard
            key={isSelectRoute ? 'today-select-listcard' : 'today-screen-listcard'}
            tasks={todaysTasks}
            selectionMode={listSelectionMode}
            selectedTaskIds={selection.selectedItems}
            onToggleTaskSelection={listSelectionMode ? toggleItemSelection : undefined}
            hideCompletedTasks={true}
            onTaskPress={handleTaskPress}
            onTaskComplete={handleTaskComplete}
            onTaskEdit={handleTaskEdit}
            onTaskDelete={handleTaskDelete}
            {...LIST_CARD_TASK_ROW_PRESET_TODAY}
            showListRecurrenceRow
            emptyMessage="No tasks for today yet. Tap the + button to add your first task!"
            loading={isLoading && todaysTasks.length === 0}
            groupBy="dueDate"
            lockTodayGroupExpanded
            sortBy="dueDate"
            sortDirection="asc"
            onOverdueReschedule={handleOverdueReschedulePress}
            hideTodayHeader={false}
            bigTodayHeader={true}
            onRefresh={handleRefresh}
            refreshing={isLoading}
            scrollYSharedValue={scrollY}
            showsVerticalScrollIndicator={true}
            paddingTop={64}
            paddingHorizontal={Paddings.screen}
            scrollPastTopInset={true}
          />
        </ScreenContainer>
        {screenBackdrop}
        <View style={[styles.topSectionAnchor, { height: insets.top + 64 }]}>
          <BlurView
            tint={themeColors.isDark ? 'dark' : 'light'}
            intensity={1}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={
              themeColors.isDark
                ? [
                    themeColors.withOpacity(themeColors.background.primary(), 0.55),
                    themeColors.withOpacity(themeColors.background.primary(), 0),
                  ]
                : [
                    themeColors.background.primary(),
                    themeColors.withOpacity(themeColors.background.primary(), 0),
                  ]
            }
            locations={[0.4, 1]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <View style={styles.topSectionRow}>
            {Platform.OS === 'android' ? (
              <AnimatedReanimated.View
                style={[styles.topSectionCloseButton, closeButtonAnimatedStyle]}
                pointerEvents={androidInPlaceSelection ? 'auto' : 'none'}
              >
                <SelectionCloseButton onPress={handleCloseButtonPress} />
              </AnimatedReanimated.View>
            ) : (
              <View style={styles.topSectionCloseButton} pointerEvents="none" />
            )}
            <AnimatedReanimated.View
              style={[styles.miniTodayHeader, miniTodayHeaderStyle]}
              pointerEvents="none"
            >
              <Text style={[styles.miniTodayHeaderText, { color: themeColors.text.primary() }]}>
                {miniHeaderLabel}
              </Text>
            </AnimatedReanimated.View>
            {androidInPlaceSelection ? (
              <SelectAllButton
                onPress={handleSelectAllToday}
                label={selectAllLabel}
                style={styles.topSectionSelectAllButton}
              />
            ) : Platform.OS === 'android' ? (
              <ScreenHeaderActions variant="dashboard" style={styles.topSectionContextButton} tint="primary" />
            ) : null}
          </View>
        </View>
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
    topSectionAnchor: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10,
      overflow: 'hidden',
    },
    miniTodayHeader: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
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
    topSectionRow: {
      position: 'absolute',
      top: insets.top,
      left: 0,
      right: 0,
      height: 48,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Paddings.screen,
    },
    miniTodayHeaderText: {
      ...typography.getTextStyle('heading-3'),
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
  });
