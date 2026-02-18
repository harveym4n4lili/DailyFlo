
import React, { useEffect, useMemo, useState, useRef } from 'react';
import { StyleSheet, RefreshControl, View, Text, Alert, Animated } from 'react-native';
import AnimatedReanimated, { useSharedValue, useAnimatedStyle, useAnimatedReaction, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useRouter, useFocusEffect } from 'expo-router';

// import our custom layout components
import { ScreenContainer, SafeAreaWrapper } from '@/components';

// import our new task components
import { ListCard } from '@/components/ui/card';
import { FloatingActionButton } from '@/components/ui/button';
import { ActionContextMenu } from '@/components/ui';
import { ClockIcon } from '@/components/ui/icon';
import { ModalContainer } from '@/components/layout/ModalLayout';
import { useCreateTaskDraft } from '@/app/task/CreateTaskDraftContext';

// import color palette system for consistent theming
import { useThemeColors, useSemanticColors } from '@/hooks/useColorPalette';

// import typography system for consistent text styling
import { useTypography } from '@/hooks/useTypography';
import { Paddings } from '@/constants/Paddings';

// STORE FOLDER IMPORTS - Redux state management
// The store folder contains all Redux-related code for managing app state
import { useTasks, useUI } from '@/store/hooks';
// useTasks: Custom hook that provides easy access to task-related state and actions
// This hook wraps the Redux useSelector and useDispatch to give us typed access to tasks
// useUI: Custom hook that provides easy access to UI-related state and actions (like modal visibility)
import { useAppDispatch, useAppSelector } from '@/store';
// useAppDispatch: Typed version of Redux's useDispatch hook
// This gives us the dispatch function to send actions to the Redux store
// It's typed to ensure we can only dispatch valid actions

import { fetchTasks, updateTask, deleteTask } from '@/store/slices/tasks/tasksSlice';
// fetchTasks: Async thunk action creator for fetching tasks from the API
// This is an async action that handles the API call and updates the store
// It's defined in the tasks slice (store/slices/tasks/tasksSlice.ts)

// TYPES FOLDER IMPORTS - TypeScript type definitions
// The types folder contains all TypeScript interfaces and type definitions
import { Task, TaskColor } from '@/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const { modals, closeModal, enterSelectionMode } = useUI();
  
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
  // router: used to open test modal (liquid glass) from main FAB for testing
  const router = useRouter();
  
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

  // expand and filter tasks: one-off + recurring occurrences for today and overdue (last 14 days)
  // recurring tasks generate virtual occurrences per date; completion tracked per-occurrence in metadata.recurrence_completions
  const todaysTasks = useMemo(() => {
    const targetDates = getTargetDatesForTodayScreen();
    const expanded = expandTasksForDates(tasks, targetDates, {
      includeOneOffBeforeRange: true, // include one-off tasks overdue before our 14-day window
    });
    return expanded;
  }, [tasks]);

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

  // STORE USAGE - Dispatching actions to fetch data
  // SCROLL DETECTION EFFECT
  // Monitor scroll position and show title when screen title is covered
  useEffect(() => {
    const handleScrollChange = (scrollY: number) => {
      // lower threshold (more negative) makes the title appear earlier when scrolling up
      // changed from -30 to -50 to activate the top section sooner
      const titleThreshold = insets.top + 12;
      
      if (scrollY >= titleThreshold && !showTitle && !isAnimatingRef.current) {
        setShowTitle(true);
        isAnimatingRef.current = true;
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          isAnimatingRef.current = false;
        });
      } else if (scrollY < titleThreshold && showTitle && !isAnimatingRef.current) {
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
    };

    (global as any).trackScrollToTodayLayout = handleScrollChange;

    return () => {
      delete (global as any).trackScrollToTodayLayout;
    };
  }, [insets.top, showTitle, titleOpacity]);

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
  }, [isAuthenticated, lastFetched, isLoading, error, dispatch]);
  
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
    await dispatch(fetchTasks());
    setIsRefreshing(false);
  };

  // TASK INTERACTION HANDLERS - Functions that handle user interactions with tasks
  // These functions demonstrate the flow: User interaction → Redux action → State update → UI re-render
  
  // handle task press - opens task screen in edit mode
  // for recurring occurrences, pass occurrenceDate so save can offer "this instance" vs "all"
  const handleTaskPress = (task: Task) => {
    const baseId = isExpandedRecurrenceId(task.id) ? getBaseTaskId(task.id) : task.id;
    const occurrenceDate = isExpandedRecurrenceId(task.id) ? getOccurrenceDateFromId(task.id) : undefined;
    router.push({ pathname: '/task/[taskId]', params: { taskId: baseId, ...(occurrenceDate ? { occurrenceDate } : {}) } });
  };
  
  // handle task completion toggle
  // for recurring occurrences (id format: baseId__dateStr), update metadata.recurrence_completions instead of isCompleted
  const handleTaskComplete = (task: Task) => {
    if (isExpandedRecurrenceId(task.id)) {
      // recurring occurrence: add/remove date from recurrence_completions on the base task
      const baseId = getBaseTaskId(task.id);
      const occurrenceDate = getOccurrenceDateFromId(task.id);
      if (!occurrenceDate) return;
      const baseTask = tasks.find((t) => t.id === baseId);
      if (!baseTask) return;
      const completions = baseTask.metadata?.recurrence_completions ?? [];
      const newCompletions = task.isCompleted
        ? completions.filter((d) => d !== occurrenceDate)
        : [...completions, occurrenceDate];
      dispatch(updateTask({
        id: baseId,
        updates: {
          id: baseId,
          metadata: { ...baseTask.metadata, recurrence_completions: newCompletions },
        },
      }));
    } else {
      // one-off task: toggle isCompleted as usual
      dispatch(updateTask({
        id: task.id,
        updates: { id: task.id, isCompleted: !task.isCompleted },
      }));
    }
  };
  
  // handle task edit - opens task screen in edit mode (same as task press)
  const handleTaskEdit = (task: Task) => {
    const baseId = isExpandedRecurrenceId(task.id) ? getBaseTaskId(task.id) : task.id;
    const occurrenceDate = isExpandedRecurrenceId(task.id) ? getOccurrenceDateFromId(task.id) : undefined;
    router.push({ pathname: '/task/[taskId]', params: { taskId: baseId, ...(occurrenceDate ? { occurrenceDate } : {}) } });
  };
  
  // handle task delete (for future confirmation modal)
  const handleTaskDelete = (task: Task) => {
    const taskId = isExpandedRecurrenceId(task.id) ? getBaseTaskId(task.id) : task.id;
    dispatch(deleteTask(taskId));
  };


  // SWIPE GESTURE HANDLERS - Functions that handle swipe gestures on task cards
  // these demonstrate how to use the new swipe functionality in TaskCard
  
  // handle swipe left gesture - completes task directly (no confirmation)
  const handleTaskSwipeLeft = (task: Task) => {
    console.log('Swiped left on task to complete:', task.title);
    // complete the task directly without confirmation
    handleTaskComplete(task);
  };
  
  // handle swipe right gesture - shows confirmation dialog before deleting task
  const handleTaskSwipeRight = (task: Task) => {
    console.log('Swiped right on task:', task.title);
    
    // show confirmation dialog before deleting task
    Alert.alert(
      'Delete Task', // dialog title
      `Are you sure you want to delete "${task.title}"? This action cannot be undone.`, // dialog message with task title
      [
        {
          text: 'Cancel', // cancel button
          style: 'cancel', // styled as cancel button (appears on left on iOS)
        },
        {
          text: 'Delete', // confirm button
          style: 'destructive', // styled as destructive action (red color on iOS)
          onPress: () => {
            // actually delete the task when user confirms
            console.log('🗑️ User confirmed deletion of task:', task.title);
            handleTaskDelete(task);
          },
        },
      ],
      { cancelable: true } // allow dismissing dialog by tapping outside
    );
  };

  // clear overdue reschedule callback when screen gains focus (e.g. user backed out without selecting)
  useFocusEffect(
    React.useCallback(() => {
      clearOverdueReschedule();
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

  // render loading state when no tasks are loaded yet
  if (isLoading && tasks.length === 0) {
    return (
      <ScreenContainer scrollable={false} paddingHorizontal={0}>
        {/* loading content with centered text */}
        <Text style={styles.loadingText}>Loading tasks...</Text>
      </ScreenContainer>
    );
  }

  // render error state when task loading fails
  if (error && tasks.length === 0) {
    return (
      <ScreenContainer scrollable={false} paddingHorizontal={0}>
        {/* error content with retry instructions */}
        <Text style={styles.errorText}>Failed to load tasks</Text>
        <Text style={styles.hint}>Pull down to try again</Text>
      </ScreenContainer>
    );
  }

  // render main content with today's tasks
  return (
    <View style={{ flex: 1 }}>
      {/* top section anchor - blur + opacity gradient + mini Today header that fades in on scroll */}
      <View style={[styles.topSectionAnchor, { height: insets.top + 64 }]}>
        <BlurView
          tint={themeColors.isDark ? 'dark' : 'light'}
          intensity={2}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={[
            themeColors.background.primary(),
            themeColors.withOpacity(themeColors.background.primary(), 0),
          ]}
          locations={[0.4, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={styles.topSectionRow}>
          <AnimatedReanimated.View style={[styles.miniTodayHeader, miniTodayHeaderStyle]} pointerEvents="none">
            <Text style={[styles.miniTodayHeaderText, { color: themeColors.text.primary() }]}>Today</Text>
          </AnimatedReanimated.View>
          <ActionContextMenu
            items={[
              { id: 'activity-log', label: 'Activity log', iconComponent: (color: string) => <ClockIcon size={20} color={color} isSolid />, systemImage: 'clock.arrow.circlepath', onPress: () => { /* TODO: open activity log */ } },
              { id: 'select-tasks', label: 'Select Tasks', systemImage: 'square.and.pencil', onPress: () => enterSelectionMode('tasks') },
            
            ]}
            style={styles.topSectionContextButton}
            accessibilityLabel="Open menu"
            dropdownAnchorTopOffset={insets.top + 48}
            dropdownAnchorRightOffset={24}
            tint="primary"
          />
        </View>
      </View>
      <ScreenContainer
        scrollable={false}
        paddingHorizontal={0}
        paddingVertical={0}
        safeAreaTop={false}
        safeAreaBottom={false}
      >
      {/* component usage - using listcard with grouping to separate overdue and today's tasks */}
      {/* this demonstrates the flow: redux store → today screen → listcard → taskcard → user interaction */}
      {/* key prop ensures this ListCard instance is completely independent from planner screen */}
      <ListCard
        key="today-screen-listcard"
        tasks={todaysTasks}
        onTaskPress={handleTaskPress}
        onTaskComplete={handleTaskComplete}
        onTaskEdit={handleTaskEdit}
        onTaskDelete={handleTaskDelete}
        onTaskSwipeLeft={handleTaskSwipeLeft}
        onTaskSwipeRight={handleTaskSwipeRight}
        showCategory={false}
        compact={false}
        showIcon={false}
        showIndicators={false}
        showMetadata={false}
        metadataVariant="today"
        cardSpacing={0}
        showDashedSeparator={true}
        hideBackground={true}
        removeInnerPadding={true}
        emptyMessage="No tasks for today yet. Tap the + button to add your first task!"
        loading={isLoading && todaysTasks.length === 0}
        groupBy="dueDate" // group tasks by due date to separate overdue and today's tasks
        sortBy="dueDate" // sort tasks by due date within each group
        sortDirection="asc" // show overdue tasks first, then today's tasks (ascending = oldest first)
        // enable bulk reschedule action specifically for the "Overdue" group on the Today screen
        // when the user taps "Reschedule", we open the date picker and then update all overdue tasks
        onOverdueReschedule={handleOverdueReschedulePress}
        hideTodayHeader={false} // show today's date as group header in the task list
        bigTodayHeader={true} // show big "Today" title at top of list
        onRefresh={handleRefresh}
        refreshing={isLoading}
        onScroll={(event) => {
          const offsetY = event.nativeEvent.contentOffset.y;
          scrollY.value = offsetY;
          if ((global as any).trackScrollToTodayLayout) {
            (global as any).trackScrollToTodayLayout(offsetY);
          }
        }}
        scrollEventThrottle={16}
        scrollYSharedValue={scrollY}
        paddingTop={64}
        paddingHorizontal={Paddings.screen}
        scrollPastTopInset={true} // let content scroll up into status bar area without cutoff
      />
      </ScreenContainer>
      <FloatingActionButton
        onPress={() => router.push('/task-create' as any)}
        backgroundColor={themeColors.background.invertedPrimary()}
        iconColor={themeColors.text.invertedPrimary()}
        accessibilityLabel="Add new task"
        accessibilityHint="Double tap to create a new task"
      />
    </View>
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
  // context menu button on right side - matches task screen ActionContextMenu (transparent bg, liquid glass)
  topSectionContextButton: {
    marginLeft: 'auto',
    backgroundColor: 'transparent',
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
