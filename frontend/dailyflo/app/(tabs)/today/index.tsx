
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, RefreshControl, View, Text, Alert } from 'react-native';

// import our custom layout components
import { ScreenContainer, SafeAreaWrapper } from '@/components';

// import our new task components
import { ListCard } from '@/components/ui/Card';

// import color palette system for consistent theming
import { useThemeColors, useSemanticColors } from '@/hooks/useColorPalette';

// import typography system for consistent text styling
import { useTypography } from '@/hooks/useTypography';

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
import { Task } from '@/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TodayScreen() {
  // REFRESH STATE - Controls the pull-to-refresh indicator
  const [isRefreshing, setIsRefreshing] = useState(false);
  
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

  // filter tasks to show only today's and overdue tasks (including completed tasks)
  // useMemo ensures this calculation only runs when tasks change
  const todaysTasks = useMemo(() => {
    const today = new Date();
    const todayString = today.toDateString(); // get date in "Mon Jan 15 2024" format
    
    const filtered = tasks.filter(task => {
      // include tasks that are due today or overdue (including completed tasks)
      if (task.dueDate) {
        const taskDate = new Date(task.dueDate);
        const isToday = taskDate.toDateString() === todayString;
        // include overdue tasks (due before today, including completed ones)
        const isOverdue = taskDate < today;
        return isToday || isOverdue;
      }
      return false;
    });
    return filtered;
  }, [tasks]);

  // calculate total task count for header display
  const totalTaskCount = todaysTasks.length;

  // grouping explanation:
  // the listcard component will automatically group tasks by due date when groupBy="dueDate" is set
  // this creates separate sections for:
  // - "overdue" tasks (due before today and not completed)
  // - "today" tasks (due today and not completed)
  // - specific dates if any tasks are due on future dates (and not completed)
  // completed tasks are filtered out and will not appear in any group
  // the grouping logic is handled internally by the listcard component

  // STORE USAGE - Dispatching actions to fetch data
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
  
  // handle task press (for future task detail modal)
  const handleTaskPress = (task: Task) => {
    console.log('📱 Task pressed:', task.title);
    // TODO: Navigate to task detail modal or show task details
    // This will be implemented when we add task detail functionality
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
  
  // handle swipe left gesture - shows confirmation dialog before editing task
  const handleTaskSwipeLeft = (task: Task) => {
    console.log('Swiped left on task:', task.title);
    
    // show confirmation dialog before editing task
    Alert.alert(
      'Edit Task', // dialog title
      `Do you want to edit "${task.title}"?`, // dialog message with task title
      [
        {
          text: 'Cancel', // cancel button
          style: 'cancel', // styled as cancel button (appears on left on iOS)
        },
        {
          text: 'Edit', // confirm button
          style: 'default', // styled as default action
          onPress: () => {
            // actually edit the task when user confirms
            console.log('✏️ User confirmed editing of task:', task.title);
            handleTaskEdit(task);
          },
        },
      ],
      { cancelable: true } // allow dismissing dialog by tapping outside
    );
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

  // render loading state when no tasks are loaded yet
  if (isLoading && tasks.length === 0) {
    return (
      <ScreenContainer scrollable={false} paddingHorizontal={0}>
        {/* safe area wrapper for header to ensure proper spacing on devices with notches */}
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Today</Text>
          <Text style={styles.subtitle}>Loading your tasks...</Text>
        </View>
        
        {/* loading content with centered text */}
        <Text style={styles.loadingText}>Loading tasks...</Text>
      </ScreenContainer>
    );
  }

  // render error state when task loading fails
  if (error && tasks.length === 0) {
    return (
      <ScreenContainer scrollable={false} paddingHorizontal={0}>
        {/* header section with title and error message */}
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Today</Text>
          <Text style={styles.subtitle}>Error loading tasks</Text>
        </View>
        
        {/* error content with retry instructions */}
        <Text style={styles.errorText}>Failed to load tasks</Text>
        <Text style={styles.hint}>Pull down to try again</Text>
      </ScreenContainer>
    );
  }

  // render main content with today's tasks
  return (
    <ScreenContainer 
      scrollable={true}
      paddingHorizontal={0}
      scrollViewProps={{
        refreshControl: (
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor="#007AFF" // iOS blue color for pull-to-refresh indicator
          />
        ),
        contentInsetAdjustmentBehavior: 'automatic',
        contentInset: { top: insets.top  }, // reduced extra top spacing to pull header closer
        contentOffset: { x: 0, y: -(insets.top) }, // keep offset in sync with inset
      }}
     >
        {/* header section with title and dynamic task count */}
       <View style={styles.headerContainer}>
         <Text style={styles.title}>Today</Text>
         <Text style={styles.subtitle}>
           {totalTaskCount === 0 
             ? "No tasks for today" 
             : `${totalTaskCount} task${totalTaskCount === 1 ? '' : 's'} for today`
           }
         </Text>
       </View>
      
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
      />
    </ScreenContainer>
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

  // header container for proper spacing
  headerContainer: {
    paddingHorizontal: 20, // add horizontal padding back for header text
    paddingTop: 8, // reduced padding since we're handling spacing in scrollViewProps
  },
  
  // title text styling for the main header
  // using typography system for consistent text styling
  title: {
    // use the heading-1 text style from typography system (36px, bold, satoshi font)
    ...typography.getTextStyle('heading-1'),
    // use theme-aware primary text color from color system
    color: themeColors.text.primary(),
  },
  
  // subtitle text styling for the main header section
  // using typography system for consistent text styling
  subtitle: {
    // use the heading-4 text style from typography system (16px, bold, satoshi font)
    ...typography.getTextStyle('heading-4'),
    // add top margin for spacing from title
    marginTop: 8,
    // use theme-aware secondary text color from color system
    color: themeColors.text.secondary(),
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
  
});
