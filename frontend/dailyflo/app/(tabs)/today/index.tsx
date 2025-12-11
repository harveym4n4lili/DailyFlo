
import React, { useEffect, useMemo, useState, useRef } from 'react';
import { StyleSheet, RefreshControl, View, Text, Alert, TouchableOpacity, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

// import our custom layout components
import { ScreenContainer, SafeAreaWrapper } from '@/components';

// import our new task components
import { ListCard } from '@/components/ui/Card';
import { FloatingActionButton } from '@/components/ui/Button';
import { DropdownList } from '@/components/ui/List';
import { ModalContainer, ModalBackdrop } from '@/components/layout/ModalLayout';
import { TaskViewModal } from '@/components/features/tasks';

// import color palette system for consistent theming
import { useThemeColors, useSemanticColors } from '@/hooks/useColorPalette';

// import typography system for consistent text styling
import { useTypography } from '@/hooks/useTypography';

// useThemeColor: hook that provides the global theme color selected by the user
import { useThemeColor } from '@/hooks/useThemeColor';

// STORE FOLDER IMPORTS - Redux state management
// The store folder contains all Redux-related code for managing app state
import { useTasks } from '@/store/hooks';
// useTasks: Custom hook that provides easy access to task-related state and actions
// This hook wraps the Redux useSelector and useDispatch to give us typed access to tasks
import { useAppDispatch } from '@/store';
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
  const [isTaskDetailModalVisible, setIsTaskDetailModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  // Store task color separately to maintain it during modal close animation
  const [selectedTaskColor, setSelectedTaskColor] = useState<TaskColor>('blue');
  
  // DROPDOWN STATE - Controls the visibility of the dropdown menu
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  
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
  
  // THEME COLOR USAGE
  // get the global theme color selected by the user (default: red)
  // this is used for interactive elements like the ellipse button
  const { getThemeColorValue } = useThemeColor();
  const themeColor = getThemeColorValue(500); // use shade 500 for ellipse button color
  
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
  } = useTasks();
  // useTasks: Custom hook that provides typed access to the tasks slice state
  // This is defined in store/hooks.ts and wraps Redux's useSelector

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
  // - "overdue" tasks (due before today and not completed)
  // - "today" tasks (due today and not completed)
  // - specific dates if any tasks are due on future dates (and not completed)
  // completed tasks are filtered out and will not appear in any group
  // the grouping logic is handled internally by the listcard component

  // STORE USAGE - Dispatching actions to fetch data
  // SCROLL DETECTION EFFECT
  // Monitor scroll position and show title when screen title is covered
  useEffect(() => {
    const handleScrollChange = (scrollY: number) => {
      const titleThreshold = insets.top - 30;
      
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
    // Only fetch if we don't have tasks yet or if there was an error
    if (tasks.length === 0 && !isLoading && !error) {
      console.log('📡 Dispatching fetchTasks...');
      // dispatch(fetchTasks()): Sends the fetchTasks action to the Redux store
      // This triggers the async thunk defined in store/slices/tasks/tasksSlice.ts
      // The thunk will make an API call and update the store with the results
      dispatch(fetchTasks());
    }
  }, [tasks.length, isLoading, error, dispatch]);

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
  
  // handle task press - shows task detail modal with haptic feedback
  const handleTaskPress = (task: Task) => {
    console.log('📱 Task pressed:', task.title);
    
    // provide medium haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // show task detail modal
    // store both task and color separately to maintain color during close animation
    setSelectedTask(task);
    setSelectedTaskColor(task.color);
    setIsTaskDetailModalVisible(true);
  };
  
  // handle task detail modal close
  const handleTaskDetailModalClose = () => {
    setIsTaskDetailModalVisible(false);
    // delay clearing task to allow modal animation to complete
    // this ensures task color persists during slide-down animation
    setTimeout(() => {
      setSelectedTask(null);
    }, 350); // slightly longer than modal animation duration (300ms)
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

  // DROPDOWN HANDLERS
  // handle ellipse button press - toggles dropdown menu visibility
  const handleEllipsePress = () => {
    setIsDropdownVisible(!isDropdownVisible);
  };

  // handle select all menu item press
  const handleSelectAll = () => {
    console.log('📋 Select all tasks requested');
    // TODO: Implement select all functionality
    setIsDropdownVisible(false);
  };

  // create dropdown menu items array
  // each item defines a menu option with label, icon, and action
  const dropdownMenuItems = [
    {
      id: 'select-all',
      label: 'Select All',
      icon: 'checkmark-circle-outline',
      onPress: handleSelectAll,
    },
  ];

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
      {/* Fixed top section with title and ellipse button - stays at top */}
      {/* background and border fade in with title animation */}
      <View style={styles.fixedTopSection}>
        {/* animated background that fades in */}
        <Animated.View 
          style={[
            styles.fixedTopSectionBackground,
            {
              opacity: titleOpacity,
              backgroundColor: themeColors.background.elevated(),
            }
          ]}
        />
        {/* animated border that fades in */}
        {/* border matches navbar styling: same color and width, but at bottom of section */}
        <Animated.View 
          style={[
            styles.fixedTopSectionBorder,
            {
              opacity: titleOpacity,
              borderBottomColor: themeColors.border.primary(), // same color as navbar borderTopColor
              borderBottomWidth: 1, // match navbar border width
            }
          ]}
        />
        <View style={styles.titleContainer}>
          {showTitle && (
            <Animated.View style={{ opacity: titleOpacity }}>
              <Text style={styles.titleHeader}>Today</Text>
            </Animated.View>
          )}
        </View>
        <TouchableOpacity
          style={styles.ellipseButton}
          onPress={handleEllipsePress}
          activeOpacity={0.7}
        >
          <Ionicons 
            name="ellipsis-horizontal" 
            size={32} 
            color={themeColor} 
          />
        </TouchableOpacity>
      </View>

      {/* dropdown list - using reusable DropdownList component */}
      <DropdownList
        visible={isDropdownVisible}
        onClose={() => setIsDropdownVisible(false)}
        items={dropdownMenuItems}
        anchorPosition="top-right"
        topOffset={72}
        rightOffset={20}
      />

      <ScreenContainer 
        scrollable={false}
        paddingHorizontal={0}
        safeAreaBottom={false}
        paddingVertical={0}
      >
      {/* component usage - using listcard with grouping to separate overdue and today's tasks */}
      {/* this demonstrates the flow: redux store → today screen → listcard → taskcard → user interaction */}
      <ListCard
        tasks={todaysTasks}
        onTaskPress={handleTaskPress}
        onTaskComplete={handleTaskComplete}
        onTaskEdit={handleTaskEdit}
        onTaskDelete={handleTaskDelete}
        onTaskSwipeLeft={handleTaskSwipeLeft}
        onTaskSwipeRight={handleTaskSwipeRight}
        showCategory={false}
        compact={false}
        emptyMessage="No tasks for today yet. Tap the + button to add your first task!"
        loading={isLoading && todaysTasks.length === 0}
        groupBy="dueDate" // group tasks by due date to separate overdue and today's tasks
        sortBy="dueDate" // sort tasks by due date within each group
        sortDirection="asc" // show overdue tasks first, then today's tasks (ascending = oldest first)
        onRefresh={handleRefresh}
        refreshing={isLoading}
        onScroll={(event) => {
          // Notify the layout about scroll position changes
          if ((global as any).trackScrollToTodayLayout) {
            (global as any).trackScrollToTodayLayout(event.nativeEvent.contentOffset.y);
          }
        }}
        scrollEventThrottle={16}
        headerTitle="Today"
      />
      {/* Floating Action Button for quick task creation */}
      <FloatingActionButton
        onPress={() => {
          console.log('FAB Pressed - Ready to create new task!');
          // TODO: Navigate to task creation modal
        }}
        accessibilityLabel="Add new task"
        accessibilityHint="Double tap to create a new task"
      />
      
      {/* separate backdrop that fades in independently behind the modal */}
      {/* rendered at screen level, behind the modal in z-index */}
      <ModalBackdrop
        isVisible={isTaskDetailModalVisible}
        onPress={handleTaskDetailModalClose}
        zIndex={10000}
      />
      
      {/* Task Detail Modal - displays task details using TaskViewModal */}
      <TaskViewModal
        visible={isTaskDetailModalVisible}
        onClose={handleTaskDetailModalClose}
        taskColor={selectedTaskColor}
        taskId={selectedTask?.id}
        task={selectedTask || undefined}
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
  // fixed top section with ellipse button - stays at top of screen
  // background and border are animated (start transparent, fade in with title)
  fixedTopSection: {
    position: 'absolute',
    top: insets.top,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingHorizontal: 20,
    height: insets.top + 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    // overflow removed to allow background to extend upward to cover insets
  },
  
  // animated background layer that fades in
  // extends upward to cover safe area insets
  fixedTopSectionBackground: {
    position: 'absolute',
    top: -insets.top, // extend upward to cover safe area insets
    left: 0,
    right: 0,
    bottom: 0,
    height: insets.top + insets.top + 10, // cover insets + section height
    zIndex: -1, // behind content
  },
  
  // animated border layer that fades in
  // matches navbar border styling: borderTopColor with borderTopWidth
  fixedTopSectionBorder: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    // borderTopWidth and borderTopColor are set dynamically in component
    zIndex: -1, // behind content
  },

  // title container - ensures consistent layout structure
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // title header styling
  titleHeader: {
    ...typography.getTextStyle('heading-2'),
    color: themeColors.text.primary(),
    fontWeight: '600',
  },

  // ellipse button styling
  ellipseButton: {
    position: 'absolute',
    right: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
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
