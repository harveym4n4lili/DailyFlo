
import React, { useCallback, useMemo, useState, useEffect, useLayoutEffect, useTransition, useRef } from 'react';
import { StyleSheet, View, Platform, Text, TouchableOpacity } from 'react-native';
import AnimatedReanimated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect, useNavigation } from 'expo-router';
import { useHeaderHeight } from '@react-navigation/elements';
import { getTextStyle } from '@/constants/Typography';
import { ScreenContainer } from '@/components';
import { FloatingActionButton, SelectAllButton } from '@/components/ui/button';
import { USE_CUSTOM_LIQUID_TAB_BAR, fabChromeZoneStyle } from '@/components/navigation/tabBarChrome';
import { useTabFabOverlay } from '@/contexts/TabFabOverlayContext';
import { ScreenHeaderActions } from '@/components/ui';
import { IosDashboardOverflowToolbar } from '@/components/navigation/IosDashboardOverflowToolbar';
import { IosPlannerBulkSelectionToolbar } from '@/components/navigation/IosPlannerBulkSelectionToolbar';
import { IosTaskSelectionCloseStackToolbar } from '@/components/navigation/IosTaskSelectionCloseStackToolbar';
import { WeekView } from '@/components/features/calendar/sections';
import { ListCard } from '@/components/ui/card';
import { TimelineView } from '@/components/features/timeline';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { Paddings } from '@/constants/Paddings';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTasks, useUI } from '@/store/hooks';
import { useAppDispatch, useAppSelector, store } from '@/store';
import { fetchTasks, updateTask, deleteTask } from '@/store/slices/tasks/tasksSlice';
import { fetchLists } from '@/store/slices/lists/listsSlice';
import { usePlannerMonthSelect } from '@/app/PlannerMonthSelectContext';
import { Task } from '@/types';
import { flushAllPendingCheckboxSyncs } from '@/utils/pendingCheckboxSyncRegistry';
import {
  expandTasksForDates,
  isExpandedRecurrenceId,
  getBaseTaskId,
  getOccurrenceDateFromId,
  toLocalCalendarDayString,
} from '@/utils/recurrenceUtils';

type PlannerIosNavMonthTitleProps = {
  label: string;
  onPress: () => void;
  color: string;
};

function PlannerIosNavMonthTitle({ label, onPress, color }: PlannerIosNavMonthTitleProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      style={{ flexDirection: 'row', alignItems: 'center', maxWidth: 280 }}
      accessibilityRole="button"
      accessibilityLabel={`${label}. Opens monthly calendar`}
    >
      <Text style={[getTextStyle('heading-2'), { color }]} numberOfLines={1}>
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={22} color={color} style={{ marginLeft: 6 }} />
    </TouchableOpacity>
  );
}

export type PlannerTabContentProps = {
  /** index = main planner tab; select = ios pushed route for native toolbar transitions */
  mode: 'index' | 'select';
};

export function PlannerTabContent({ mode }: PlannerTabContentProps) {
  const plannerAnchorFromStore = useAppSelector((s) => s.ui.plannerSelectionAnchorDate);

  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString());
  const [timelineDate, setTimelineDate] = useState<string>(() => new Date().toISOString());
  const [, startTimelineTransition] = useTransition();

  const router = useRouter();
  const navigation = useNavigation();

  const themeColors = useThemeColors();
  const typography = useTypography();
  const insets = useSafeAreaInsets();
  const nativeStackHeaderHeight = useHeaderHeight();
  const weekViewPaddingTop = Platform.OS === 'ios' ? nativeStackHeaderHeight : insets.top;

  const dispatch = useAppDispatch();
  const { tasks } = useTasks();
  const { selection, toggleItemSelection, selectAllItems, clearSelection, setPlannerSelectionAnchorDate } = useUI();

  // when opening ios select route, match the week/day the user had on the planner index (stored in redux for overflow push)
  useEffect(() => {
    if (mode !== 'select') return;
    if (plannerAnchorFromStore) {
      setSelectedDate(plannerAnchorFromStore);
      setTimelineDate(plannerAnchorFromStore);
    }
  }, [mode, plannerAnchorFromStore]);

  // index only: keep redux anchor fresh so overflow → push select uses the visible day
  useEffect(() => {
    if (mode !== 'index') return;
    setPlannerSelectionAnchorDate(selectedDate);
  }, [mode, selectedDate, setPlannerSelectionAnchorDate]);

  const fabOpacity = useSharedValue(1);
  useEffect(() => {
    const isSelectionMode = selection.isSelectionMode && selection.selectionType === 'tasks';
    const hideFab = mode === 'select' || isSelectionMode;
    fabOpacity.value = withTiming(hideFab ? 0 : 1, { duration: 200 });
  }, [selection.isSelectionMode, selection.selectionType, fabOpacity, mode]);
  const fabAnimatedStyle = useAnimatedStyle(() => ({ opacity: fabOpacity.value }));
  const fabStyleRef = useRef(fabAnimatedStyle);
  fabStyleRef.current = fabAnimatedStyle;

  const { setTabFabRegistration } = useTabFabOverlay();
  useFocusEffect(
    useCallback(() => {
      if (mode !== 'index' || !USE_CUSTOM_LIQUID_TAB_BAR) return undefined;
      setTabFabRegistration({
        onPress: () => {
          router.push({ pathname: '/task-create' as any, params: { dueDate: selectedDate } });
        },
        accessibilityLabel: 'Add new task',
        accessibilityHint: 'Double tap to create a new task',
        wrapperStyle: fabStyleRef.current,
        pointerEventsBlocked: selection.isSelectionMode && selection.selectionType === 'tasks',
      });
      return () => setTabFabRegistration(null);
    }, [
      mode,
      router,
      selectedDate,
      setTabFabRegistration,
      selection.isSelectionMode,
      selection.selectionType,
    ]),
  );

  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const { openMonthSelect } = usePlannerMonthSelect();

  const plannerNavMonthLabel = useMemo(() => {
    if (selectedDate) {
      return new Date(selectedDate).toLocaleDateString('en-UK', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }
    return new Date().toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, [selectedDate]);

  const styles = useMemo(
    () => createStyles(themeColors, typography, insets, weekViewPaddingTop),
    [themeColors, typography, insets, weekViewPaddingTop],
  );

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        void dispatch(fetchTasks());
        const { lastFetched, isLoading, error } = store.getState().lists;
        if (lastFetched === null && !isLoading && !error) {
          void dispatch(fetchLists());
        }
      }
      return () => flushAllPendingCheckboxSyncs();
    }, [isAuthenticated, dispatch]),
  );

  const handleOpenMonthSelect = useCallback(() => {
    openMonthSelect(selectedDate, (date) => setSelectedDate(date));
    router.push('/(tabs)/planner/month-select');
  }, [openMonthSelect, selectedDate, router]);

  useLayoutEffect(() => {
    if (mode !== 'index' || Platform.OS !== 'ios') return;
    const primary = themeColors.text.primary();
    navigation.setOptions({
      headerTitle: () => (
        <PlannerIosNavMonthTitle label={plannerNavMonthLabel} onPress={handleOpenMonthSelect} color={primary} />
      ),
    });
  }, [mode, navigation, plannerNavMonthLabel, handleOpenMonthSelect, themeColors]);

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };

  useEffect(() => {
    startTimelineTransition(() => {
      setTimelineDate(selectedDate);
    });
  }, [selectedDate, startTimelineTransition]);

  const weekDateStrings = useMemo(() => {
    const sourceDate = timelineDate || selectedDate;
    if (!sourceDate) return [];
    const base = new Date(sourceDate);
    const baseMidnight = new Date(base.getFullYear(), base.getMonth(), base.getDate());
    const dayOfWeek = baseMidnight.getDay();
    const mondayOffset = (dayOfWeek + 6) % 7;
    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(baseMidnight);
      d.setDate(d.getDate() - mondayOffset + i);
      dates.push(toLocalCalendarDayString(d));
    }
    return dates;
  }, [timelineDate, selectedDate]);

  const weekExpandedTasks = useMemo(() => {
    if (weekDateStrings.length === 0 || tasks.length === 0) {
      return [];
    }
    return expandTasksForDates(tasks, weekDateStrings);
  }, [tasks, weekDateStrings]);

  const selectedDateTasks = useMemo(() => {
    const sourceDate = timelineDate || selectedDate;
    if (!sourceDate) return [];
    const selectedDay = toLocalCalendarDayString(new Date(sourceDate));
    return weekExpandedTasks.filter((task) => {
      if (isExpandedRecurrenceId(task.id)) {
        return getOccurrenceDateFromId(task.id) === selectedDay;
      }
      if (!task.dueDate) return false;
      return toLocalCalendarDayString(new Date(task.dueDate)) === selectedDay;
    });
  }, [weekExpandedTasks, selectedDate, timelineDate]);

  const allDayTasks = useMemo(() => {
    return selectedDateTasks.filter((task) => !task.time || task.time === '');
  }, [selectedDateTasks]);

  const handleTaskPress = (task: Task) => {
    const baseId = isExpandedRecurrenceId(task.id) ? getBaseTaskId(task.id) : task.id;
    const occurrenceDate = isExpandedRecurrenceId(task.id) ? getOccurrenceDateFromId(task.id) : undefined;
    router.push({ pathname: '/task/[taskId]', params: { taskId: baseId, ...(occurrenceDate ? { occurrenceDate } : {}) } });
  };

  const handleTaskComplete = useCallback(
    async (task: Task, targetCompleted?: boolean) => {
      try {
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
          await dispatch(
            updateTask({
              id: baseId,
              updates: {
                id: baseId,
                metadata: { ...baseTask.metadata, recurrence_completions: newCompletions },
              },
            }),
          ).unwrap();
        } else {
          const updates: any = { id: task.id, isCompleted };
          if (task.metadata?.subtasks?.length) {
            updates.metadata = {
              ...task.metadata,
              subtasks: task.metadata.subtasks.map((s) => ({ ...s, isCompleted })),
            };
          }
          await dispatch(updateTask({ id: task.id, updates })).unwrap();
        }
      } catch (error) {
        console.error('Failed to update task:', error);
      }
    },
    [dispatch],
  );

  const handleTaskEdit = (task: Task) => {
    const baseId = isExpandedRecurrenceId(task.id) ? getBaseTaskId(task.id) : task.id;
    const occurrenceDate = isExpandedRecurrenceId(task.id) ? getOccurrenceDateFromId(task.id) : undefined;
    router.push({ pathname: '/task/[taskId]', params: { taskId: baseId, ...(occurrenceDate ? { occurrenceDate } : {}) } });
  };

  const handleTaskDelete = async (task: Task) => {
    const taskId = isExpandedRecurrenceId(task.id) ? getBaseTaskId(task.id) : task.id;
    try {
      await dispatch(deleteTask(taskId)).unwrap();
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const eligiblePlannerTaskIds = useMemo(() => {
    const combined = [...selectedDateTasks, ...allDayTasks];
    const uniqueById = Array.from(new Map(combined.map((t) => [t.id, t])).values());
    return uniqueById.filter((t) => !t.isCompleted && !t.softDeleted).map((t) => t.id);
  }, [selectedDateTasks, allDayTasks]);

  const allEligiblePlannerSelected =
    eligiblePlannerTaskIds.length > 0 && eligiblePlannerTaskIds.every((id) => selection.selectedItems.includes(id));
  const selectAllPlannerLabel = allEligiblePlannerSelected ? 'Deselect all' : 'Select all';

  const handleSelectAllPlanner = useCallback(() => {
    if (!(selection.isSelectionMode && selection.selectionType === 'tasks')) return;
    if (allEligiblePlannerSelected) {
      clearSelection();
    } else {
      selectAllItems(eligiblePlannerTaskIds);
    }
  }, [
    selection.isSelectionMode,
    selection.selectionType,
    allEligiblePlannerSelected,
    eligiblePlannerTaskIds,
    selectAllItems,
    clearSelection,
  ]);

  const handleTaskTimeChange = async (taskId: string, newTime: string, newDuration?: number) => {
    try {
      const baseId = isExpandedRecurrenceId(taskId) ? getBaseTaskId(taskId) : taskId;
      const task = tasks.find((t) => t.id === baseId);
      if (!task) return;

      const updates: any = { id: baseId, time: newTime };
      if (newDuration !== undefined) updates.duration = newDuration;
      await dispatch(updateTask({ id: baseId, updates })).unwrap();
    } catch (error) {
      console.error('Failed to update task time:', error);
    }
  };

  // ios index: never show row selection (handled on select route). android index: in-place redux selection.
  const timelineListSelection =
    mode === 'select'
      ? selection.isSelectionMode && selection.selectionType === 'tasks'
      : Platform.OS === 'android' && selection.isSelectionMode && selection.selectionType === 'tasks';

  const androidPlannerInPlaceSelection =
    mode === 'index' && Platform.OS === 'android' && selection.isSelectionMode && selection.selectionType === 'tasks';

  return (
    <>
      {mode === 'select' && Platform.OS === 'ios' ? (
        <>
          <IosTaskSelectionCloseStackToolbar dismissWithRouterBack />
          <IosPlannerBulkSelectionToolbar
            plannerSelectAll={{
              onPress: handleSelectAllPlanner,
              allEligibleSelected: allEligiblePlannerSelected,
            }}
          />
        </>
      ) : null}
      {mode === 'index' ? (
        <>
          <IosDashboardOverflowToolbar
            hidden={androidPlannerInPlaceSelection}
          />
        </>
      ) : null}
      <View style={{ flex: 1 }}>
        <View
          style={[
            styles.topSectionAnchor,
            { height: Platform.OS === 'ios' ? nativeStackHeaderHeight : insets.top + 48 },
          ]}
          pointerEvents="box-none"
        >
          <View style={styles.topSectionRow} pointerEvents="box-none">
            <View style={styles.topSectionCloseButton} pointerEvents="none" />
            {androidPlannerInPlaceSelection ? (
              <SelectAllButton
                onPress={handleSelectAllPlanner}
                label={selectAllPlannerLabel}
                style={styles.topSectionSelectAllButton}
              />
            ) : Platform.OS === 'android' && mode === 'index' ? (
              <ScreenHeaderActions variant="dashboard" style={styles.topSectionContextButton} tint="primary" />
            ) : null}
          </View>
        </View>
        <ScreenContainer
          scrollable={false}
          paddingHorizontal={0}
          safeAreaTop={false}
          safeAreaBottom={false}
          paddingVertical={0}
        >
          <View style={styles.weekViewContainer}>
            <WeekView
              selectedDate={selectedDate}
              onSelectDate={handleDateSelect}
              onOpenMonthSelect={Platform.OS === 'ios' ? undefined : handleOpenMonthSelect}
              hideMonthHeader={Platform.OS === 'ios'}
            />
          </View>

          <View style={styles.contentContainer}>
            <>
              <View style={styles.fadeOverlay} pointerEvents="none">
                <LinearGradient
                  colors={[
                    themeColors.background.primary(),
                    themeColors.withOpacity(themeColors.background.primary(), 0),
                  ]}
                  locations={[0.0, 1]}
                  style={StyleSheet.absoluteFill}
                />
              </View>
              <TimelineView
                key={timelineDate ? toLocalCalendarDayString(new Date(timelineDate)) : 'planner-timeline'}
                tasks={selectedDateTasks}
                onTaskTimeChange={handleTaskTimeChange}
                onTaskPress={handleTaskPress}
                onTaskComplete={handleTaskComplete}
                selectionMode={timelineListSelection}
                selectedTaskIds={selection.selectedItems}
                onToggleTaskSelection={timelineListSelection ? toggleItemSelection : undefined}
                startHour={6}
                endHour={23}
                timeInterval={60}
                scrollContentPaddingTop={16}
                scrollContentPaddingBottom={
                  mode === 'select' && Platform.OS === 'ios' ? 56 + 28 + insets.bottom : undefined
                }
                footerComponent={
                  <View style={styles.allDayFooter}>
                    <ListCard
                      key="planner-allday-listcard"
                      tasks={allDayTasks}
                      selectionMode={timelineListSelection}
                      selectedTaskIds={selection.selectedItems}
                      onToggleTaskSelection={timelineListSelection ? toggleItemSelection : undefined}
                      hideCompletedTasks={true}
                      onTaskPress={handleTaskPress}
                      onTaskComplete={handleTaskComplete}
                      onTaskEdit={handleTaskEdit}
                      onTaskDelete={handleTaskDelete}
                      showCategory={false}
                      compact={false}
                      showIcon={false}
                      showIndicators={false}
                      showMetadata={false}
                      metadataVariant="today"
                      cardSpacing={0}
                      showDashedSeparator={true}
                      taskRowSeparatorVariant="dashed"
                      hideBackground={true}
                      removeInnerPadding={true}
                      emptyMessage="No all-day tasks for this date."
                      loading={false}
                      groupBy="allDay"
                      sortBy="createdAt"
                      sortDirection="desc"
                      paddingHorizontal={Paddings.screen}
                      paddingBottom={8}
                      scrollEnabled={false}
                      delayHeightChangeOnTaskComplete={false}
                      disableInitialLayoutTransition={true}
                    />
                  </View>
                }
              />
            </>
          </View>

          {mode === 'index' && !USE_CUSTOM_LIQUID_TAB_BAR ? (
            <AnimatedReanimated.View
              style={[
                fabAnimatedStyle,
                fabChromeZoneStyle,
                androidPlannerInPlaceSelection ? { pointerEvents: 'none' } : null,
              ]}
            >
              <FloatingActionButton
                onPress={() => {
                  router.push({ pathname: '/task-create' as any, params: { dueDate: selectedDate } });
                }}
                accessibilityLabel="Add new task"
                accessibilityHint="Double tap to create a new task"
              />
            </AnimatedReanimated.View>
          ) : null}
        </ScreenContainer>
      </View>
    </>
  );
}

const createStyles = (
  themeColors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useTypography>,
  insets: ReturnType<typeof useSafeAreaInsets>,
  weekViewPaddingTop: number,
) =>
  StyleSheet.create({
    topSectionAnchor: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10,
      backgroundColor: 'transparent',
    },

    topSectionRow: {
      position: 'absolute',
      top: insets.top,
      left: 0,
      right: 0,
      height: 48,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingHorizontal: Paddings.screen,
    },
    topSectionCloseButton: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 'auto',
    },
    topSectionContextButton: {
      backgroundColor: 'primary',
    },
    topSectionSelectAllButton: {
      alignSelf: 'center',
    },

    weekViewContainer: {
      paddingTop: weekViewPaddingTop,
      backgroundColor: themeColors.background.primary(),
    },

    contentContainer: {
      flex: 1,
      flexDirection: 'column',
      position: 'relative',
      backgroundColor: themeColors.background.primarySecondaryBlend(),
      margin: 0,
      paddingHorizontal: Paddings.none,
      paddingTop: Paddings.none,
      overflow: 'hidden',
    },

    allDayFooter: {},

    fadeOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 32,
      zIndex: 5,
      overflow: 'hidden',
    },
  });
