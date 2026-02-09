
import React, { useEffect, useMemo, useState, useRef } from 'react';
import { StyleSheet, RefreshControl, View, Text, Alert, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter, useFocusEffect } from 'expo-router';

// import our custom layout components
import { ScreenContainer, SafeAreaWrapper } from '@/components';

// import our new task components
import { ListCard } from '@/components/ui/card';
import { TaskSummary } from '@/components/ui/message';
import { ModalContainer } from '@/components/layout/ModalLayout';
import { useCreateTaskDraft } from '@/app/task/CreateTaskDraftContext';

// import color palette system for consistent theming
import { useThemeColors, useSemanticColors } from '@/hooks/useColorPalette';

// import typography system for consistent text styling
import { useTypography } from '@/hooks/useTypography';

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

export default function TodayScreen() {
  // REFRESH STATE - Controls the pull-to-refresh indicator
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // TASK DETAIL MODAL STATE
  
  // task creation is the task Stack screen (presentation: 'modal'); opened via router

  // OVERDUE RESCHEDULE: we push modals/date-select and apply selected date when we return
  const overdueTaskIdsRef = useRef<string[]>([]);
  const { setDraft, draft } = useCreateTaskDraft();
  
  // get UI state from Redux to check if createTask modal should be opened
  const { modals, closeModal } = useUI();
  
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
  // This gives us access to predefined text styles and satoshi font family
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

  // Get authentication state from Redux
  // Only fetch tasks if user is authenticated
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  // filter tasks to show today's, overdue, and completed tasks
  // useMemo ensures this calculation only runs when tasks change
  const todaysTasks = useMemo(() => {
    const today = new Date();
    const todayString = today.toDateString(); // get date in "Mon Jan 15 2024" format
    
    const filtered = tasks.filter(task => {
      // include completed tasks (they'll be grouped separately)
      if (task.isCompleted) return true;
      
      // include tasks that are due today or overdue
      if (task.dueDate) {
        const taskDate = new Date(task.dueDate);
        const isToday = taskDate.toDateString() === todayString;
        // include overdue tasks (due before today)
        const isOverdue = taskDate < today;
        return isToday || isOverdue;
      }
      return false;
    });
    return filtered;
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
      router.push('/task');
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
  
  // handle task press - TODO: Implement task detail view
  const handleTaskPress = (task: Task) => {
    console.log('📱 Task pressed:', task.title);
    // TODO: Implement task detail view
  };
  
  // handle task completion toggle
  const handleTaskComplete = (task: Task) => {
    console.log('✅ Task completion toggled:', task.title);
    // STORE USAGE - Dispatching updateTask action to toggle completion status
    // dispatch(updateTask()): Sends the updateTask action to the Redux store
    // This triggers the async thunk defined in store/slices/tasks/tasksSlice.ts
    // The thunk will make an API call and update the store with the results
    dispatch(updateTask({ 
      id: task.id, 
      updates: { 
        id: task.id,
        isCompleted: !task.isCompleted
      } 
    }));
  };
  
  // handle task edit (for future task edit modal)
  const handleTaskEdit = (task: Task) => {
    console.log('✏️ Task edit requested:', task.title);
    // TODO: Open task edit modal
    // This will be implemented when we add task editing functionality
  };
  
  // handle task delete (for future confirmation modal)
  const handleTaskDelete = (task: Task) => {
    console.log('🗑️ Task delete requested:', task.title);
    // STORE USAGE - Dispatching deleteTask action to remove task
    // dispatch(deleteTask()): Sends the deleteTask action to the Redux store
    // This triggers the async thunk defined in store/slices/tasks/tasksSlice.ts
    // The thunk will make an API call and update the store by removing the task
    // TODO: Add confirmation modal before deletion
    dispatch(deleteTask(task.id));
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

  // when we return from modals/date-select after overdue reschedule, apply the selected date
  useFocusEffect(
    React.useCallback(() => {
      if (overdueTaskIdsRef.current.length === 0) return;
      const ids = [...overdueTaskIdsRef.current];
      overdueTaskIdsRef.current = [];
      const date = draft.dueDate;
      if (!date) return;
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
    }, [draft.dueDate, dispatch]),
  );

  // handle press on "Reschedule" in the Overdue group header: open date-select stack screen
  const handleOverdueReschedulePress = (overdueTasks: Task[]) => {
    const ids = overdueTasks.map((t) => t.id);
    overdueTaskIdsRef.current = ids;
    const initialDate =
      overdueTasks[0]?.dueDate ?? new Date().toISOString();
    setDraft({ dueDate: initialDate, time: undefined, duration: undefined, alerts: [] });
    router.push('/date-select/index');
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
      <ScreenContainer 
        scrollable={false}
        paddingHorizontal={0}
        safeAreaTop={false}
        safeAreaBottom={false}
        paddingVertical={0}
      >
      {/* dynamic today message - greeting/summary at top of screen */}
      <TaskSummary />
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
        hideTodayHeader={true} // hide the group header that shows today's date since we're already on the Today screen
        onRefresh={handleRefresh}
        refreshing={isLoading}
        onScroll={(event) => {
          // Notify the layout about scroll position changes
          if ((global as any).trackScrollToTodayLayout) {
            (global as any).trackScrollToTodayLayout(event.nativeEvent.contentOffset.y);
          }
        }}
        scrollEventThrottle={16}
        
        paddingTop={insets.top+ 64} // add top padding equal to safe area inset
        paddingHorizontal={20} // remove horizontal padding for full-width cards
      />
      </ScreenContainer>
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
  // title header styling (used by task detail modal)
  titleHeader: {
    ...typography.getTextStyle('heading-2'),
    color: themeColors.text.primary(),
    fontWeight: '600',
  },

  // loading text styling for initial load state
  // using typography system for consistent text styling
  loadingText: {
    // use the body-large text style from typography system (14px, regular, satoshi font)
    ...typography.getTextStyle('body-large'),
    // add top margin for spacing
    marginTop: 20,
    // center the text
    textAlign: 'center',
    // use theme-aware tertiary text color from color system
    color: themeColors.text.tertiary(),
  },
  
  // error text styling with semantic error color
  // using typography system for consistent text styling
  errorText: {
    // use the body-large text style from typography system (14px, regular, satoshi font)
    ...typography.getTextStyle('body-large'),
    // use semantic error color from color palette
    color: semanticColors.error(),
    // center the text
    textAlign: 'center',
    // add margins for spacing
    marginTop: 20,
    marginBottom: 8,
  },
  
  // hint text styling for helpful user instructions
  // using typography system for consistent text styling
  hint: {
    // use the body-large text style from typography system (14px, regular, satoshi font)
    ...typography.getTextStyle('body-large'),
    // add top margin for spacing
    marginTop: 8,
    // center the text
    textAlign: 'center',
    // use theme-aware tertiary text color from color system
    color: themeColors.text.tertiary(),
  },
  
  // empty state text styling when no tasks exist
  // using typography system for consistent text styling
  emptyText: {
    // use the heading-3 text style from typography system (18px, bold, satoshi font)
    ...typography.getTextStyle('heading-3'),
    // center the text
    textAlign: 'center',
    // add extra top margin for visual separation
    marginTop: 40,
    // add bottom margin for spacing
    marginBottom: 8,
    // use theme-aware primary text color from color system
    color: themeColors.text.primary(),
  },
  
  // TASK DETAIL MODAL STYLES
  taskDetailContent: {
    flex: 1,
    paddingVertical: 8,
  },
  
  taskDetailTitle: {
    ...typography.getTextStyle('heading-2'),
    color: themeColors.text.primary(),
    marginBottom: 24,
    textAlign: 'center',
  },
  
  taskDetailSection: {
    marginBottom: 20,
  },
  
  taskDetailSectionTitle: {
    ...typography.getTextStyle('body-large'),
    color: themeColors.text.secondary(),
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
