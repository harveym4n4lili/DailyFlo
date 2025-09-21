
import React, { useEffect, useMemo } from 'react';
import { StyleSheet, RefreshControl, View, Text } from 'react-native';

// import our custom layout components
import { ScreenContainer, SafeAreaWrapper } from '@/components';

// import color palette system for consistent theming
import { useThemeColors, useSemanticColors } from '@/hooks/useColorPalette';

// STORE FOLDER IMPORTS - Redux state management
// The store folder contains all Redux-related code for managing app state
import { useTasks } from '@/store/hooks';
// useTasks: Custom hook that provides easy access to task-related state and actions
// This hook wraps the Redux useSelector and useDispatch to give us typed access to tasks
import { useAppDispatch } from '@/store';
// useAppDispatch: Typed version of Redux's useDispatch hook
// This gives us the dispatch function to send actions to the Redux store
// It's typed to ensure we can only dispatch valid actions

import { fetchTasks } from '@/store/slices/tasks/tasksSlice';
// fetchTasks: Async thunk action creator for fetching tasks from the API
// This is an async action that handles the API call and updates the store
// It's defined in the tasks slice (store/slices/tasks/tasksSlice.ts)

// TYPES FOLDER IMPORTS - TypeScript type definitions
// The types folder contains all TypeScript interfaces and type definitions
import { Task } from '@/types';

export default function TodayScreen() {
  // COLOR PALETTE USAGE - Getting theme-aware colors
  // useThemeColors: Hook that provides theme-aware colors (background, text, borders, etc.)
  // useSemanticColors: Hook that provides semantic colors (success, error, warning, info)
  const themeColors = useThemeColors();
  const semanticColors = useSemanticColors();
  
  // create dynamic styles using the color palette system
  const styles = useMemo(() => createStyles(themeColors, semanticColors), [themeColors, semanticColors]);
  
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

  // Filter tasks to show only today's tasks
  // useMemo ensures this calculation only runs when tasks change
  const todaysTasks = useMemo(() => {
    const today = new Date();
    const todayString = today.toDateString(); // Get date in "Mon Jan 15 2024" format
    
    const filtered = tasks.filter(task => {
      // Include tasks that are due today
      if (task.dueDate) {
        const taskDate = new Date(task.dueDate);
        const isToday = taskDate.toDateString() === todayString;
        // Include overdue tasks (due before today and not completed)
        const isOverdue = !task.isCompleted && taskDate < today;
        return isToday || isOverdue;
      }
      return false;
    });
    return filtered;
  }, [tasks]);

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
  const handleRefresh = () => {
    // dispatch(fetchTasks()): Triggers a fresh fetch of tasks from the API
    // This is called when the user pulls down to refresh the screen
    dispatch(fetchTasks());
  };

  // render loading state when no tasks are loaded yet
  if (isLoading && tasks.length === 0) {
    return (
      <ScreenContainer scrollable={false}>
        {/* safe area wrapper for header to ensure proper spacing on devices with notches */}
        <Text style={styles.title}>Today</Text>
        <Text style={styles.subtitle}>Loading your tasks...</Text>
        
        {/* loading content with centered text */}
        <Text style={styles.loadingText}>Loading tasks...</Text>
      </ScreenContainer>
    );
  }

  // render error state when task loading fails
  if (error && tasks.length === 0) {
    return (
      <ScreenContainer scrollable={false}>
        {/* header section with title and error message */}
        <Text style={styles.title}>Today</Text>
        <Text style={styles.subtitle}>Error loading tasks</Text>
        
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
      scrollViewProps={{
        refreshControl: (
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor="#007AFF" // iOS blue color for pull-to-refresh indicator
          />
        )
      }}
    >
       {/* header section with title and dynamic task count */}
       <Text style={styles.title}>Today</Text>
        <Text style={styles.subtitle}>
          {todaysTasks.length === 0 
            ? "No tasks for today" 
            : `${todaysTasks.length} task${todaysTasks.length === 1 ? '' : 's'} for today`
          }
        </Text>
      
      {todaysTasks.length === 0 ? (
        // empty state when no tasks are scheduled for today
        <>
          <Text style={styles.emptyText}>No tasks for today yet.</Text>
          <Text style={styles.hint}>Tap the + button to add your first task!</Text>
        </>
      ) : (
        // task list section with today's scheduled tasks
        <>
          <Text style={styles.sectionTitle}>Today's Tasks</Text>
          
          {/* TODO: Implement proper TaskItem components here */}
          {/* temporary placeholder cards until we build the actual task components */}
          {todaysTasks.map((task: Task) => (
            // TYPES USAGE - Using Task interface for type safety
            // task: Task - Each task object conforms to the Task interface from types/common/Task.ts
            // This ensures we have access to all the properties defined in the Task type
            <View key={task.id} style={styles.taskPlaceholder}>
              {/* task title with bold styling */}
              <Text style={styles.taskTitle}>{task.title}</Text>
              {/* task description or placeholder if none exists */}
              <Text style={styles.taskDescription}>
                {task.description || 'No description'}
              </Text>
              {/* task metadata showing priority and due date */}
              <Text style={styles.taskMeta}>
                Priority: {task.priorityLevel} | Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
              </Text>
            </View>
          ))}
        </>
      )}
    </ScreenContainer>
  );
}

// create dynamic styles using the color palette system
const createStyles = (themeColors: ReturnType<typeof useThemeColors>, semanticColors: ReturnType<typeof useSemanticColors>) => StyleSheet.create({
  // title text styling for the main header
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 32,
    color: themeColors.text.primary(), // use theme-aware primary text color
  },
  
  // subtitle text styling for the main header section
  subtitle: {
    marginTop: 8,
    color: themeColors.text.secondary(), // use theme-aware secondary text color
    fontSize: 16,
  },
  
  // loading text styling for initial load state
  loadingText: {
    marginTop: 20,
    textAlign: 'center',
    color: themeColors.text.tertiary(), // use theme-aware tertiary text color
  },
  
  // error text styling with semantic error color
  errorText: {
    color: semanticColors.error(), // use semantic error color from palette
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 8,
  },
  
  // hint text styling for helpful user instructions
  hint: {
    marginTop: 8,
    color: themeColors.text.tertiary(), // use theme-aware tertiary text color
    textAlign: 'center',
    fontSize: 14,
  },
  
  // empty state text styling when no tasks exist
  emptyText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 40, // extra top margin for visual separation
    marginBottom: 8,
    color: themeColors.text.primary(), // use theme-aware primary text color
  },
  
  // section title styling for task list header
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600', // semi-bold weight for section headers
    marginTop: 30, // spacing from header section
    marginBottom: 16,
    color: themeColors.text.primary(), // use theme-aware primary text color
  },
  
  // temporary task placeholder card styling until we implement proper task components
  taskPlaceholder: {
    backgroundColor: themeColors.background.elevated(), // use theme-aware elevated background
    borderRadius: 12, // rounded corners for modern card appearance
    padding: 16,
    marginBottom: 16, // spacing between task cards
  },
  
  // task title text styling within placeholder cards
  taskTitle: {
    fontSize: 16,
    fontWeight: '600', // semi-bold for task titles
    marginBottom: 4,
    color: themeColors.text.primary(), // use theme-aware primary text color
  },
  
  // task description text styling within placeholder cards
  taskDescription: {
    fontSize: 14,
    marginBottom: 8,
    color: themeColors.text.secondary(), // use theme-aware secondary text color
  },
  
  // task metadata text styling (priority, due date, etc.)
  taskMeta: {
    fontSize: 12,
    fontStyle: 'italic', // italic style for metadata information
    color: themeColors.text.tertiary(), // use theme-aware tertiary text color
  },
});
