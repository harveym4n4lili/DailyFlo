
import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { StyleSheet, RefreshControl, View, Text, Animated, Platform } from 'react-native';
import AnimatedReanimated, { useSharedValue, useAnimatedStyle, useAnimatedReaction, withTiming, withSpring, runOnJS } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useRouter, useFocusEffect } from 'expo-router';

// import our custom layout components
import { ScreenContainer, SafeAreaWrapper } from '@/components';

// import our new task components
import { ListCard } from '@/components/ui/card';
import { FloatingActionButton, SelectionCloseButton, SelectAllButton } from '@/components/ui/button';
import { USE_CUSTOM_LIQUID_TAB_BAR, fabChromeZoneStyle } from '@/components/navigation/tabBarChrome';
import { useTabFabOverlay } from '@/contexts/TabFabOverlayContext';
import { ScreenHeaderActions } from '@/components/ui';
import { IosDashboardOverflowToolbar } from '@/components/navigation/IosDashboardOverflowToolbar';
import { ModalContainer } from '@/components/layout/ModalLayout';
import { useCreateTaskDraft } from '@/app/task/CreateTaskDraftContext';

// import color palette system for consistent theming
import { useThemeColors, useSemanticColors } from '@/hooks/useColorPalette';

// import typography system for consistent text styling
import { useTypography } from '@/hooks/useTypography';
import { Paddings } from '@/constants/Paddings';
import { LIST_CARD_TASK_ROW_PRESET_TODAY } from '@/constants/listCardTaskRowPreset';

// STORE FOLDER IMPORTS - Redux state management
// The store folder contains all Redux-related code for managing app state
import { useTasks, useUI } from '@/store/hooks';
// useTasks: Custom hook that provides easy access to task-related state and actions
// This hook wraps the Redux useSelector and useDispatch to give us typed access to tasks
// useUI: Custom hook that provides easy access to UI-related state and actions (like modal visibility)
import { useAppDispatch, useAppSelector, store } from '@/store';
// useAppDispatch: Typed version of Redux's useDispatch hook
// This gives us the dispatch function to send actions to the Redux store
// It's typed to ensure we can only dispatch valid actions

import { fetchTasks, updateTask, deleteTask } from '@/store/slices/tasks/tasksSlice';
import { fetchLists } from '@/store/slices/lists/listsSlice';
// fetchTasks: Async thunk action creator for fetching tasks from the API
// This is an async action that handles the API call and updates the store
// It's defined in the tasks slice (store/slices/tasks/tasksSlice.ts)

// TYPES FOLDER IMPORTS - TypeScript type definitions
// The types folder contains all TypeScript interfaces and type definitions
import { Task, TaskColor } from '@/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { flushAllPendingCheckboxSyncs } from '@/utils/pendingCheckboxSyncRegistry';
import {
  expandTasksForDates,
  getTargetDatesForTodayScreen,
  isExpandedRecurrenceId,
  getBaseTaskId,
  getOccurrenceDateFromId,
} from '@/utils/recurrenceUtils';

export default function TodayScreen() {
  // REFRESH STATE - Controls the pull-to-refresh indicator
  const [isRefreshing, setIsRefreshing] = useState(false);

  const router = useRouter();

  // scroll offset for Today header fade - updated on scroll, drives reanimated opacity (0→48px = fade out)
  const scrollY = useSharedValue(0);

  // mini Today header opacity - animates in/out based on scroll threshold (not tied to scroll position)
  // withTiming allows interruption: fade out can interrupt fade in and vice versa
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
  
  // TASK DETAIL MODAL STATE
  
  // task creation is the task Stack screen (presentation: 'modal'); opened via router

  // OVERDUE RESCHEDULE: we push date-select and apply selected date via callback (avoids race with draft state)
  const { setDraft, registerOverdueReschedule, clearOverdueReschedule } = useCreateTaskDraft();
  
  // get UI state from Redux to check if createTask modal should be opened
  const { modals, closeModal, selection, toggleItemSelection, exitSelectionMode, selectAllItems, clearSelection } = useUI();

  // FAB fade: opacity 0 in selection mode, 1 otherwise
  const fabOpacity = useSharedValue(1);
  useEffect(() => {
    const isSelectionMode = selection.isSelectionMode && selection.selectionType === 'tasks';
    fabOpacity.value = withTiming(isSelectionMode ? 0 : 1, { duration: 400 });
  }, [selection.isSelectionMode, selection.selectionType, fabOpacity]);
  const fabAnimatedStyle = useAnimatedStyle(() => ({ opacity: fabOpacity.value }));
  // ref keeps the latest animated style without putting it in useFocusEffect deps (unstable refs were clearing registration every render)
  const fabStyleRef = useRef(fabAnimatedStyle);
  fabStyleRef.current = fabAnimatedStyle;

  const { setTabFabRegistration } = useTabFabOverlay();
  // useFocusEffect: NativeTabs + expo-router often don’t report useIsFocused() true on first paint; this matches tab focus reliably
  useFocusEffect(
    useCallback(() => {
      if (!USE_CUSTOM_LIQUID_TAB_BAR) return undefined;
      setTabFabRegistration({
        onPress: () => router.push('/task-create' as any),
        accessibilityLabel: 'Add new task',
        accessibilityHint: 'Double tap to create a new task',
        wrapperStyle: fabStyleRef.current,
        pointerEventsBlocked: selection.isSelectionMode && selection.selectionType === 'tasks',
      });
      return () => setTabFabRegistration(null);
    }, [router, setTabFabRegistration, selection.isSelectionMode, selection.selectionType]),
  );

  // close button: scale animation with Reanimated spring (works with glass; opacity can break it)
  const closeButtonScale = useSharedValue(0);
  useEffect(() => {
    const isSel = selection.isSelectionMode && selection.selectionType === 'tasks';
    closeButtonScale.value = withSpring(isSel ? 1 : 0, {
      damping: 45,
      stiffness: 600,
    });
  }, [selection.isSelectionMode, selection.selectionType, closeButtonScale]);
  const handleCloseButtonPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    closeButtonScale.value = withTiming(0, { duration: 150 });
    setTimeout(exitSelectionMode, 90);
  }, [closeButtonScale, exitSelectionMode]);
  const closeButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: closeButtonScale.value }],
  }));
  const isSelectionMode = selection.isSelectionMode && selection.selectionType === 'tasks';

  // TITLE STATE - Controls the visibility of the title header
  const [showTitle, setShowTitle] = useState(false);
  
  // Animated value for title fade effect
  const titleOpacity = useRef(new Animated.Value(0)).current;
  
  // Ref to track if animation is currently running
  const isAnimatingRef = useRef(false);
  
  // COLOR PALETTE USAGE - Getting theme-aware colors
  // useThemeColors: Hook that provides theme-aware colors (background, text, borders, etc.)
  // useSemanticColors: Hook that provides semantic colors (success, error, warning, info)
  const themeColors = useThemeColors();
  const semanticColors = useSemanticColors();
  
  // TYPOGRAPHY USAGE - Getting typography system for consistent text styling
  // useTypography: Hook that provides typography styles, font families, and text utilities
  // This gives us access to predefined text styles and Inter font family
  const typography = useTypography();
  
  // SAFE AREA INSETS - Get safe area insets for proper positioning
  const insets = useSafeAreaInsets();

  // create dynamic styles using the color palette system and typography system
  // we pass typography and insets to the createStyles function so it can use typography styles and safe area
  const styles = useMemo(() => createStyles(themeColors, semanticColors, typography, insets), [themeColors, semanticColors, typography, insets]);
  
  // STORE USAGE - Getting Redux dispatch function
  // Get dispatch function to send actions to Redux store
  const dispatch = useAppDispatch();
  // dispatch: Function that sends actions to the Redux store to update state
  // We'll use this to trigger the fetchTasks action to load data from the API
  
  // STORE USAGE - Accessing task state from Redux store
  // Connect to Redux store using our custom hook
  // This gives us access to all task-related state
  const {
    tasks,           // All tasks from the store (from store/slices/tasks/tasksSlice.ts)
    filteredTasks,   // Tasks after filtering is applied (computed in the slice)
    isLoading,       // Whether we're currently loading tasks (managed by Redux)
    error,           // Any error that occurred while loading (managed by Redux)
    lastFetched,     // Timestamp of last successful fetch (prevents infinite loops)
  } = useTasks();
  // useTasks: Custom hook that provides typed access to the tasks slice state
  // This is defined in store/hooks.ts and wraps Redux's useSelector

  // reset scrollY when refresh completes so Today header fades back in
  useEffect(() => {
    if (!isLoading) scrollY.value = 0;
  }, [isLoading, scrollY]);

  // Get authentication state from Redux
  // Only fetch tasks if user is authenticated
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  // lists must be loaded for TaskCardListRecurrenceRow (getListDisplayName); browse used to load them first — fetch with tasks on cold start
  const listsLastFetched = useAppSelector((state) => state.lists.lastFetched);
  const listsLoading = useAppSelector((state) => state.lists.isLoading);
  const listsError = useAppSelector((state) => state.lists.error);

  // expand and filter tasks: one-off + recurring occurrences for today and overdue (last 14 days)
  // recurring tasks generate virtual occurrences per date; completion tracked per-occurrence in metadata.recurrence_completions
  const todaysTasks = useMemo(() => {
    const targetDates = getTargetDatesForTodayScreen();
    const expanded = expandTasksForDates(tasks, targetDates, {
      includeOneOffBeforeRange: true, // include one-off tasks overdue before our 14-day window
    });
    return expanded;
  }, [tasks]);

  // eligible for select all: non-completed, non-deleted, due TODAY only
  const todayDateStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const eligibleTodayTaskIds = useMemo(() => {
    return todaysTasks
      .filter((t) => !t.isCompleted && !t.softDeleted && t.dueDate?.slice(0, 10) === todayDateStr)
      .map((t) => t.id);
  }, [todaysTasks, todayDateStr]);

  // if every eligible task is already selected, show "Deselect all" and pressing will clear selection
  const allEligibleSelected = eligibleTodayTaskIds.length > 0 && eligibleTodayTaskIds.every((id) => selection.selectedItems.includes(id));
  const selectAllLabel = allEligibleSelected ? 'Deselect all' : 'Select all';

  const handleSelectAllToday = useCallback(() => {
    if (!(selection.isSelectionMode && selection.selectionType === 'tasks')) return;
    if (allEligibleSelected) {
      clearSelection();
    } else {
      selectAllItems(eligibleTodayTaskIds);
    }
  }, [selection.isSelectionMode, selection.selectionType, allEligibleSelected, eligibleTodayTaskIds, selectAllItems, clearSelection]);

  // calculate total task count for header display (only incomplete tasks)
  const totalTaskCount = useMemo(() => {
    return todaysTasks.filter(task => !task.isCompleted).length;
  }, [todaysTasks]);

  // grouping explanation:
  // the listcard component will automatically group tasks by due date when groupBy="dueDate" is set
  // this creates separate sections for:
  // - "overdue" tasks (due before today, including completed ones)
  // - "today" tasks (due today, including completed ones)
  // - specific dates if any tasks are due on future dates (including completed ones)
  // completed tasks remain in their date groups and are not filtered out
  // the grouping logic is handled internally by the listcard component

  // title threshold: show title when scrolled past this (runs on UI thread, only bridges to JS when crossing)
  const titleThreshold = insets.top + 12;
  const onTitleThresholdCrossed = useCallback((pastThreshold: boolean) => {
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
  }, [showTitle, titleOpacity]);
  useAnimatedReaction(
    () => scrollY.value >= titleThreshold,
    (pastThreshold, previousPastThreshold) => {
      if (previousPastThreshold !== null && pastThreshold !== previousPastThreshold) {
        runOnJS(onTitleThresholdCrossed)(pastThreshold);
      }
    }
  );

  // Fetch tasks when component mounts
  // useEffect runs after the component renders for the first time
  useEffect(() => {
    // Only fetch if:
    // 1. User is authenticated (has valid tokens)
    // 2. We haven't fetched yet (lastFetched is null)
    // 3. AND we're not currently loading
    // 4. AND there's no error
    // Using lastFetched prevents infinite loops when API returns empty array
    if (isAuthenticated && lastFetched === null && !isLoading && !error) {
      console.log('📡 Dispatching fetchTasks...');
      // dispatch(fetchTasks()): Sends the fetchTasks action to the Redux store
      // This triggers the async thunk defined in store/slices/tasks/tasksSlice.ts
      // The thunk will make an API call and update the store with the results
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
  
  // when Redux says open createTask (e.g. onboarding completion), push task Stack screen
  useEffect(() => {
    if (modals.createTask) {
      closeModal('createTask');
      router.push('/task-create' as any);
    }
  }, [modals.createTask, closeModal, router]);

  // STORE USAGE - Dispatching actions for user interactions
  // Handle pull-to-refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    // dispatch(fetchTasks()): Triggers a fresh fetch of tasks from the API
    // This is called when the user pulls down to refresh the screen
    await Promise.all([dispatch(fetchTasks()), dispatch(fetchLists())]);
    setIsRefreshing(false);
  };

  // TASK INTERACTION HANDLERS - Functions that handle user interactions with tasks
  // These functions demonstrate the flow: User interaction → Redux action → State update → UI re-render
  
  const handleTaskPress = useCallback((task: Task) => {
    const baseId = isExpandedRecurrenceId(task.id) ? getBaseTaskId(task.id) : task.id;
    const occurrenceDate = isExpandedRecurrenceId(task.id) ? getOccurrenceDateFromId(task.id) : undefined;
    router.push({ pathname: '/task/[taskId]', params: { taskId: baseId, ...(occurrenceDate ? { occurrenceDate } : {}) } });
  }, [router]);
  
  // handle task completion - stable ref (dispatch only) so TaskCard/React.memo can skip re-renders
  // uses store.getState() for recurring logic instead of tasks in deps
  const handleTaskComplete = useCallback((task: Task, targetCompleted?: boolean) => {
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
      dispatch(updateTask({
        id: baseId,
        updates: {
          id: baseId,
          metadata: { ...baseTask.metadata, recurrence_completions: newCompletions },
        },
      }));
    } else {
      dispatch(updateTask({
        id: task.id,
        updates: { id: task.id, isCompleted },
      }));
    }
  }, [dispatch]);
  
  const handleTaskEdit = useCallback((task: Task) => {
    const baseId = isExpandedRecurrenceId(task.id) ? getBaseTaskId(task.id) : task.id;
    const occurrenceDate = isExpandedRecurrenceId(task.id) ? getOccurrenceDateFromId(task.id) : undefined;
    router.push({ pathname: '/task/[taskId]', params: { taskId: baseId, ...(occurrenceDate ? { occurrenceDate } : {}) } });
  }, [router]);

  const handleTaskDelete = useCallback((task: Task) => {
    const taskId = isExpandedRecurrenceId(task.id) ? getBaseTaskId(task.id) : task.id;
    dispatch(deleteTask(taskId));
  }, [dispatch]);


  // clear overdue reschedule callback when screen gains focus; flush pending checkbox syncs when leaving (tab switch)
  useFocusEffect(
    React.useCallback(() => {
      clearOverdueReschedule();
      return () => flushAllPendingCheckboxSyncs();
    }, [clearOverdueReschedule]),
  );

  // handle press on "Reschedule" in the Overdue group header: open date-select, apply date via callback
  const handleOverdueReschedulePress = (overdueTasks: Task[]) => {
    // use base task ids (recurring occurrences share same base; reschedule updates the template)
    const ids = [...new Set(overdueTasks.map((t) => (isExpandedRecurrenceId(t.id) ? getBaseTaskId(t.id) : t.id)))];
    const initialDate =
      overdueTasks[0]?.dueDate ?? new Date().toISOString();
    setDraft({ dueDate: initialDate, time: undefined, duration: undefined, alerts: [] });

    registerOverdueReschedule((date) => {
      (async () => {
        try {
          await Promise.all(
            ids.map((taskId) =>
              dispatch(updateTask({ id: taskId, updates: { id: taskId, dueDate: date } })),
            ),
          );
        } catch (err) {
          console.error('Failed to bulk reschedule overdue tasks:', err);
        }
      })();
    });

    router.push('/date-select');
  };

  // full-screen wash behind content (same solid surface in light and dark)
  // zIndex -1 when not the first sibling: keeps it behind the list (see main return order below)
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
    [themeColors.theme],
  );

  // render loading state when no tasks are loaded yet
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

  // render error state when task loading fails
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

  // render main content with today's tasks
  return (
    <>
      <IosDashboardOverflowToolbar hidden={selection.isSelectionMode && selection.selectionType === 'tasks'} />
      <View style={{ flex: 1 }}>
      {/* list before backdrop so the main scroll surface stays the first subview under the screen (layout / scroll coordination) */}
      <ScreenContainer
        scrollable={false}
        paddingHorizontal={0}
        paddingVertical={0}
        safeAreaTop={false}
        safeAreaBottom={false}
        backgroundColor="transparent"
      >
      <ListCard
        key="today-screen-listcard"
        tasks={todaysTasks}
        selectionMode={selection.isSelectionMode && selection.selectionType === 'tasks'}
        selectedTaskIds={selection.selectedItems}
        onToggleTaskSelection={selection.isSelectionMode ? toggleItemSelection : undefined}
        hideCompletedTasks={true}
        onTaskPress={handleTaskPress}
        onTaskComplete={handleTaskComplete}
        onTaskEdit={handleTaskEdit}
        onTaskDelete={handleTaskDelete}
        {...LIST_CARD_TASK_ROW_PRESET_TODAY}
        showListRecurrenceRow
        emptyMessage="No tasks for today yet. Tap the + button to add your first task!"
        loading={isLoading && todaysTasks.length === 0}
        groupBy="dueDate" // group tasks by due date to separate overdue and today's tasks
        lockTodayGroupExpanded // today's date section stays open; no collapse chevron on that group
        sortBy="dueDate" // sort tasks by due date within each group
        sortDirection="asc" // show overdue tasks first, then today's tasks (ascending = oldest first)
        // enable bulk reschedule action specifically for the "Overdue" group on the Today screen
        // when the user taps "Reschedule", we open the date picker and then update all overdue tasks
        onOverdueReschedule={handleOverdueReschedulePress}
        hideTodayHeader={false} // show today's date as group header in the task list
        bigTodayHeader={true} // show big "Today" title at top of list
        onRefresh={handleRefresh}
        refreshing={isLoading}
        scrollYSharedValue={scrollY}
        showsVerticalScrollIndicator={true}
        paddingTop={64}
        paddingHorizontal={Paddings.screen}
        scrollPastTopInset={true} // let content scroll up into status bar area without cutoff
      />
      </ScreenContainer>
      {screenBackdrop}
      {/* top section anchor - blur + opacity gradient + mini Today header that fades in on scroll */}
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
          {/* close button - scale spring (works with glass) */}
          <AnimatedReanimated.View style={[styles.topSectionCloseButton, closeButtonAnimatedStyle]} pointerEvents={isSelectionMode ? 'auto' : 'none'}>
            <SelectionCloseButton onPress={handleCloseButtonPress} />
          </AnimatedReanimated.View>
          <AnimatedReanimated.View style={[styles.miniTodayHeader, miniTodayHeaderStyle]} pointerEvents="none">
            <Text style={[styles.miniTodayHeaderText, { color: themeColors.text.primary() }]}>
              {selection.isSelectionMode && selection.selectionType === 'tasks'
                ? `${selection.selectedItems.length} selected`
                : 'Today'}
            </Text>
          </AnimatedReanimated.View>
          {selection.isSelectionMode && selection.selectionType === 'tasks' ? (
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
      {!USE_CUSTOM_LIQUID_TAB_BAR ? (
        <AnimatedReanimated.View
          style={[
            fabAnimatedStyle,
            fabChromeZoneStyle,
            selection.isSelectionMode && selection.selectionType === 'tasks' ? { pointerEvents: 'none' } : null,
          ]}
        >
          <FloatingActionButton
            onPress={() => router.push('/task-create' as any)}
            accessibilityLabel="Add new task"
            accessibilityHint="Double tap to create a new task"
          />
        </AnimatedReanimated.View>
      ) : null}
    </View>
    </>
  );
}

// create dynamic styles using the color palette system and typography system
// this function combines colors, typography, and safe area insets to create consistent styling
const createStyles = (
  themeColors: ReturnType<typeof useThemeColors>, 
  semanticColors: ReturnType<typeof useSemanticColors>,
  typography: ReturnType<typeof useTypography>,
  insets: ReturnType<typeof useSafeAreaInsets>
) => StyleSheet.create({
  // --- LAYOUT STYLES ---
  // top section anchor - fixed blur + gradient at top, list content scrolls under it
  topSectionAnchor: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    overflow: 'hidden',
  },

  // mini Today header in top section - h and v centered in full width, fades in on scroll
  miniTodayHeader: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // close button on left - appears in selection mode only; placeholder keeps layout when hidden
  topSectionCloseButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // context menu button on right side - matches task screen ActionContextMenu (transparent bg, liquid glass)
  topSectionContextButton: {
    marginLeft: 'auto',
    alignSelf: 'center',
    backgroundColor: 'transparent',
  },
  topSectionSelectAllButton: {
    marginLeft: 'auto',
    alignSelf: 'center',
  },

  // TASK DETAIL MODAL STYLES
  taskDetailSection: {
    marginBottom: 20,
  },

  // --- PADDING STYLES ---
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
  taskDetailContent: {
    flex: 1,
    paddingVertical: Paddings.touchTarget,
  },

  // --- TYPOGRAPHY STYLES ---
  titleHeader: {
    ...typography.getTextStyle('heading-2'),
    color: themeColors.text.primary(),
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
  emptyText: {
    ...typography.getTextStyle('heading-3'),
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 8,
    color: themeColors.text.primary(),
  },
  taskDetailTitle: {
    ...typography.getTextStyle('heading-2'),
    color: themeColors.text.primary(),
    marginBottom: 24,
    textAlign: 'center',
  },
  taskDetailSectionTitle: {
    ...typography.getTextStyle('body-large'),
    color: themeColors.text.secondary(),
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  taskDetailValue: {
    ...typography.getTextStyle('body-large'),
    color: themeColors.text.primary(),
    lineHeight: 20,
  },
  taskDetailDescription: {
    ...typography.getTextStyle('body-large'),
    color: themeColors.text.primary(),
    lineHeight: 22,
  },
});
