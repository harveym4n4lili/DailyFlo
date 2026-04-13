
import React, { useCallback, useMemo, useState, useEffect, useTransition, useRef } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import AnimatedReanimated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
// import our custom layout components
import { ScreenContainer } from '@/components';
import { FloatingActionButton, SelectAllButton } from '@/components/ui/button';
import { USE_CUSTOM_LIQUID_TAB_BAR, fabChromeZoneStyle } from '@/components/navigation/tabBarChrome';
import { useTabFabOverlay } from '@/contexts/TabFabOverlayContext';
import { ScreenHeaderActions } from '@/components/ui';
import { ClockIcon } from '@/components/ui/icon';
import { WeekView } from '@/components/features/calendar/sections';
import { ListCard } from '@/components/ui/card';
import { TimelineView } from '@/components/features/timeline';

// import color palette system for consistent theming
import { useThemeColors } from '@/hooks/useColorPalette';

// import typography system for consistent text styling
import { useTypography } from '@/hooks/useTypography';
import { Paddings } from '@/constants/Paddings';

// safe area context for handling devices with notches/home indicators
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// redux store hooks for task management
import { useTasks, useUI } from '@/store/hooks';
import { useAppDispatch, useAppSelector, store } from '@/store';
import { fetchTasks, updateTask, deleteTask } from '@/store/slices/tasks/tasksSlice';
import { usePlannerMonthSelect } from '@/app/PlannerMonthSelectContext';

// types for tasks
import { Task, TaskColor } from '@/types';
import { flushAllPendingCheckboxSyncs } from '@/utils/pendingCheckboxSyncRegistry';
import {
  expandTasksForDates,
  isExpandedRecurrenceId,
  getBaseTaskId,
  getOccurrenceDateFromId,
} from '@/utils/recurrenceUtils';

export default function PlannerScreen() {
  // the week selector ui should always feel instant.
  // we keep its selected state fully local to this screen and
  // trigger heavier timeline/task work separately so backend/redux
  // never block the visual highlight.
  // CALENDAR MODAL STATE - Replaced by stack screen (month-select); we open via router + context
  // SELECTED DATE STATE (UI) - drives week selector highlight only
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // default to today's date as ISO string
    return new Date().toISOString();
  });
  // timeline date state is used for heavier task expansion so the week selector ui can update instantly first
  const [timelineDate, setTimelineDate] = useState<string>(() => {
    return new Date().toISOString();
  });
  // transition lets react schedule the timeline/task updates at lower priority so taps and header animations stay smooth
  const [isTimelinePending, startTimelineTransition] = useTransition();
  
  // TASK DETAIL MODAL STATE - Controls the visibility of task detail modal
  
  // router: open task Stack screen from FAB (with optional dueDate from selected date)
  const router = useRouter();

  // COLOR PALETTE USAGE - Getting theme-aware colors
  const themeColors = useThemeColors();
  
  // TYPOGRAPHY USAGE - Getting typography system for consistent text styling
  const typography = useTypography();
  
  // SAFE AREA INSETS - Get safe area insets for proper positioning
  const insets = useSafeAreaInsets();
  
  // REDUX STORE - Accessing task state from Redux store
  const dispatch = useAppDispatch();
  const { tasks, isLoading } = useTasks();
  const { enterSelectionMode, selection, toggleItemSelection, exitSelectionMode, selectAllItems, clearSelection } = useUI();

  // FAB fade: opacity 0 in selection mode, 1 otherwise
  const fabOpacity = useSharedValue(1);
  useEffect(() => {
    const isSelectionMode = selection.isSelectionMode && selection.selectionType === 'tasks';
    fabOpacity.value = withTiming(isSelectionMode ? 0 : 1, { duration: 200 });
  }, [selection.isSelectionMode, selection.selectionType, fabOpacity]);
  const fabAnimatedStyle = useAnimatedStyle(() => ({ opacity: fabOpacity.value }));
  const fabStyleRef = useRef(fabAnimatedStyle);
  fabStyleRef.current = fabAnimatedStyle;

  const { setTabFabRegistration } = useTabFabOverlay();
  useFocusEffect(
    useCallback(() => {
      if (!USE_CUSTOM_LIQUID_TAB_BAR) return undefined;
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
      router,
      selectedDate,
      setTabFabRegistration,
      selection.isSelectionMode,
      selection.selectionType,
    ]),
  );

  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const { openMonthSelect } = usePlannerMonthSelect();
  
  // calculate border radius based on iOS version to match modal styling
  // iOS 15+ (liquid glass UI): uses 26px border radius for liquid glass UI design
  // iOS < 15 (pre-glass UI): uses smaller border radius (20px)
  // Android/web: uses default border radius (12px)
  const getModalBorderRadius = (): number => {
    if (Platform.OS !== 'ios') return 12; // Android/web default
    const version = Platform.Version as string;
    const majorVersion = typeof version === 'string' 
      ? parseInt(version.split('.')[0], 10) 
      : Math.floor(version as number);
    if (majorVersion >= 15) {
      return 50; // iOS 15+ liquid glass UI - 26px border radius
    } else if (majorVersion > 0) {
      return 20; // iOS < 15
    }
    return 12; // fallback
  };
  
  const modalBorderRadius = getModalBorderRadius();
  
  // create dynamic styles using the color palette system and typography system
  const styles = useMemo(() => createStyles(themeColors, typography, insets, modalBorderRadius), [themeColors, typography, insets, modalBorderRadius]);

  // flush pending checkbox syncs when leaving (tab switch)
  useFocusEffect(React.useCallback(() => () => flushAllPendingCheckboxSyncs(), []));

  // CALENDAR HANDLERS
  // open month-select stack screen – same pattern as task: set payload in context then router.push (like handleTaskPress -> router.push('/task/[taskId]'))
  const handleOpenMonthSelect = () => {
    openMonthSelect(selectedDate, (date) => setSelectedDate(date));
    router.push('/(tabs)/planner/month-select');
  };

  // handle date selection from week view (when not using month-select modal)
  const handleDateSelect = (date: string) => {
    // update selectedDate immediately so the header + week view highlight respond with no perceived delay
    setSelectedDate(date);
  };

  // when the ui-selected date changes, schedule timeline/task updates
  // in a low-priority transition so backend/redux work never blocks
  // the feel of tapping on the week selector
  useEffect(() => {
    startTimelineTransition(() => {
      setTimelineDate(selectedDate);
    });
  }, [selectedDate, startTimelineTransition]);
  
  // derive the current week (monday→sunday) from the active planner date
  // we only recompute this when the base date (timelineDate/selectedDate) changes
  const weekDateStrings = useMemo(() => {
    const sourceDate = timelineDate || selectedDate;
    if (!sourceDate) return [];
    const base = new Date(sourceDate);
    // normalise to local midnight before shifting to avoid time-of-day drift
    const baseMidnight = new Date(base.getFullYear(), base.getMonth(), base.getDate());
    // getDay(): 0 = Sunday, 1 = Monday, ...; we want Monday as week start
    const dayOfWeek = baseMidnight.getDay(); // 0–6
    const mondayOffset = (dayOfWeek + 6) % 7; // days to subtract to reach Monday
    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(baseMidnight);
      d.setDate(d.getDate() - mondayOffset + i);
      dates.push(d.toISOString().slice(0, 10));
    }
    return dates;
  }, [timelineDate, selectedDate]);

  // expand tasks once for the whole visible week (monday→sunday)
  // this preloads all recurring occurrences for the week so tapping a day
  // only filters the already-expanded array instead of recomputing expansions
  const weekExpandedTasks = useMemo(() => {
    if (weekDateStrings.length === 0 || tasks.length === 0) {
      return [];
    }
    return expandTasksForDates(tasks, weekDateStrings);
  }, [tasks, weekDateStrings]);

  // expand tasks for selected date by filtering the pre-expanded week
  // one-off + recurring occurrences that fall on the selectedDate only
  const selectedDateTasks = useMemo(() => {
    const sourceDate = timelineDate || selectedDate;
    if (!sourceDate) return [];
    const selectedDateStr = new Date(sourceDate).toISOString().slice(0, 10);
    return weekExpandedTasks.filter((task) => task.dueDate?.slice(0, 10) === selectedDateStr);
  }, [weekExpandedTasks, selectedDate, timelineDate]);

  // all-day tasks: selected day's tasks with no time set (not shown on timeline)
  // these are displayed in the "All day tasks" list below the timeline
  const allDayTasks = useMemo(() => {
    return selectedDateTasks.filter((task) => !task.time || task.time === '');
  }, [selectedDateTasks]);
  
  // fetch tasks when component mounts or when authentication state changes
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchTasks());
    }
  }, [isAuthenticated, dispatch]);
  
  // TASK HANDLERS - Functions to handle task interactions
  // handle when user taps on a task card - opens task screen in edit mode
  // for recurring occurrences, pass occurrenceDate so save can offer "this instance" vs "all"
  const handleTaskPress = (task: Task) => {
    const baseId = isExpandedRecurrenceId(task.id) ? getBaseTaskId(task.id) : task.id;
    const occurrenceDate = isExpandedRecurrenceId(task.id) ? getOccurrenceDateFromId(task.id) : undefined;
    router.push({ pathname: '/task/[taskId]', params: { taskId: baseId, ...(occurrenceDate ? { occurrenceDate } : {}) } });
  };
  
  // handle task completion - stable ref so memoized TimelineItem can skip re-renders
  const handleTaskComplete = useCallback(async (task: Task, targetCompleted?: boolean) => {
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
        await dispatch(updateTask({
          id: baseId,
          updates: {
            id: baseId,
            metadata: { ...baseTask.metadata, recurrence_completions: newCompletions },
          },
        })).unwrap();
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
  }, [dispatch]);
  
  // handle editing a task - opens task screen in edit mode (same as task press)
  const handleTaskEdit = (task: Task) => {
    const baseId = isExpandedRecurrenceId(task.id) ? getBaseTaskId(task.id) : task.id;
    const occurrenceDate = isExpandedRecurrenceId(task.id) ? getOccurrenceDateFromId(task.id) : undefined;
    router.push({ pathname: '/task/[taskId]', params: { taskId: baseId, ...(occurrenceDate ? { occurrenceDate } : {}) } });
  };
  
  // handle deleting a task (for expanded recurring, delete base task)
  const handleTaskDelete = async (task: Task) => {
    const taskId = isExpandedRecurrenceId(task.id) ? getBaseTaskId(task.id) : task.id;
    try {
      await dispatch(deleteTask(taskId)).unwrap();
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };
  
  // handle refresh - reload tasks from server
  const handleRefresh = async () => {
    if (isAuthenticated) {
      await dispatch(fetchTasks());
    }
  };

  // eligible for select all: non-completed, non-deleted, on current selected day (timeline + all-day)
  const eligiblePlannerTaskIds = useMemo(() => {
    const combined = [...selectedDateTasks, ...allDayTasks];
    const uniqueById = Array.from(new Map(combined.map((t) => [t.id, t])).values());
    return uniqueById
      .filter((t) => !t.isCompleted && !t.softDeleted)
      .map((t) => t.id);
  }, [selectedDateTasks, allDayTasks]);

  // if every eligible task is selected, show "Deselect all" and pressing will clear selection
  const allEligiblePlannerSelected = eligiblePlannerTaskIds.length > 0 && eligiblePlannerTaskIds.every((id) => selection.selectedItems.includes(id));
  const selectAllPlannerLabel = allEligiblePlannerSelected ? 'Deselect all' : 'Select all';

  const handleSelectAllPlanner = useCallback(() => {
    if (!(selection.isSelectionMode && selection.selectionType === 'tasks')) return;
    if (allEligiblePlannerSelected) {
      clearSelection();
    } else {
      selectAllItems(eligiblePlannerTaskIds);
    }
  }, [selection.isSelectionMode, selection.selectionType, allEligiblePlannerSelected, eligiblePlannerTaskIds, selectAllItems, clearSelection]);

  // handle when a task's time is changed via dragging on the timeline
  // for expanded recurring tasks, update the base task
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

  // render main content
  return (
    <View style={{ flex: 1 }}>
      {/* top section - 48px row for context ellipse button; pointerEvents box-none so taps pass through to WeekView header */}
      <View style={[styles.topSectionAnchor, { height: insets.top + 48 }]} pointerEvents="box-none">
        <View style={styles.topSectionRow} pointerEvents="box-none">
          {/* planner: no main close button in selection mode; use placeholder for layout */}
          <View style={styles.topSectionCloseButton} pointerEvents="none" />
          {selection.isSelectionMode && selection.selectionType === 'tasks' ? (
            <SelectAllButton
              onPress={handleSelectAllPlanner}
              label={selectAllPlannerLabel}
              style={styles.topSectionSelectAllButton}
            />
          ) : (
            <ScreenHeaderActions
              variant="dashboard"
              contextMenuItems={[
                { id: 'activity-log', label: 'Activity log', iconComponent: (color: string) => <ClockIcon size={20} color={color} isSolid />, systemImage: 'clock.arrow.circlepath', onPress: () => router.push('/activity-log' as any) },
                { id: 'select-tasks', label: 'Select Tasks', systemImage: 'square.and.pencil', onPress: () => enterSelectionMode('tasks') },
              ]}
              dropdownAnchorTopOffset={insets.top + 48}
              dropdownAnchorRightOffset={24}
              style={styles.topSectionContextButton}
              tint="primary"
            />
          )}
        </View>
      </View>
      <ScreenContainer 
        scrollable={false}
        paddingHorizontal={0}
        safeAreaTop={false}
        safeAreaBottom={false}
        paddingVertical={0}
      >
        {/* Week View - weekly calendar navigation */}
        <View style={styles.weekViewContainer}>
          <WeekView
            selectedDate={selectedDate}
            onSelectDate={handleDateSelect}
            onOpenMonthSelect={handleOpenMonthSelect}
          />
        </View>
        
        {/* Content area - TimelineView + all-day footer */}
        <View style={styles.contentContainer}>
          <>
          {/* fade opacity overlay - starts 48px below date selection border, matches Today screen */}
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
              // key by timelineDate so each planner day gets a fresh timeline instance
              // this resets layout state per day so the timeline + all-day footer
              // appear directly in their correct positions instead of sliding from
              // the previous day's layout
              key={timelineDate ? new Date(timelineDate).toISOString().slice(0, 10) : 'planner-timeline'}
              tasks={selectedDateTasks}
              onTaskTimeChange={handleTaskTimeChange}
              onTaskPress={handleTaskPress}
              onTaskComplete={handleTaskComplete}
              selectionMode={selection.isSelectionMode && selection.selectionType === 'tasks'}
              selectedTaskIds={selection.selectedItems}
              onToggleTaskSelection={selection.isSelectionMode ? toggleItemSelection : undefined}
              startHour={6}
              endHour={23}
              timeInterval={60}
              scrollContentPaddingTop={16}
              footerComponent={
                <View style={styles.allDayFooter}>
                  <ListCard
                    key="planner-allday-listcard"
                    tasks={allDayTasks}
                    selectionMode={selection.isSelectionMode && selection.selectionType === 'tasks'}
                    selectedTaskIds={selection.selectedItems}
                    onToggleTaskSelection={selection.isSelectionMode ? toggleItemSelection : undefined}
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

        {!USE_CUSTOM_LIQUID_TAB_BAR ? (
          <AnimatedReanimated.View
            style={[
              fabAnimatedStyle,
              fabChromeZoneStyle,
              selection.isSelectionMode && selection.selectionType === 'tasks' ? { pointerEvents: 'none' } : null,
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
  );
}

const createStyles = (
  themeColors: ReturnType<typeof useThemeColors>, 
  typography: ReturnType<typeof useTypography>,
  insets: ReturnType<typeof useSafeAreaInsets>,
  modalBorderRadius: number // border radius value that matches modal styling
) => StyleSheet.create({
  // top section anchor - fixed row for context button, matches Today screen (insets.top + 48)
  topSectionAnchor: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: 'transparent',
  },

  // row container for context button - matches Today screen topSectionRow
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
  // close button on left - appears in selection mode only; placeholder keeps layout when hidden
  topSectionCloseButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 'auto', // push to left so context menu stays on right
  },
  // matches task screen ActionContextMenu (transparent bg, liquid glass)
  topSectionContextButton: {
    backgroundColor: 'primary',
  },
  topSectionSelectAllButton: {
    alignSelf: 'center',
  },

  // week view container - starts at inset top; top section overlays with context button (zIndex 10)
  weekViewContainer: {
    paddingTop: insets.top,
    backgroundColor: themeColors.background.primary(),
  },

  // content container - styled with top border radius matching modal styling
  // uses conditional border radius based on iOS version to match DraggableModal appearance
  // has 8px spacing from screen edges on all sides
  // uses 1px border with primary border color matching task creation styling
  // uses primary secondary blend background color for subtle visual distinction
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

  // all-day tasks footer - inside timeline ScrollView
  allDayFooter: {},

  // fade overlay - 48px below date selection border, same gradient as Today screen (locations 0.4-1 = solid to transparent)
  fadeOverlay: {
    position: 'absolute',
    top: 0, // 48px below the border of the date selection
    left: 0,
    right: 0,
    height: 32, // matches Today screen fade height
    zIndex: 5,
    overflow: 'hidden',
  },
});