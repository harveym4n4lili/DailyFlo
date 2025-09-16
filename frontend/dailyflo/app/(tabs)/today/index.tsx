
import React, { useEffect, useMemo } from 'react';
import { StyleSheet, ScrollView, RefreshControl } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

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

  // Render loading state
  if (isLoading && tasks.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <ThemedText type="title">Today</ThemedText>
          <ThemedText style={styles.subtitle}>Loading your tasks...</ThemedText>
        </ThemedView>
        
        <ThemedView style={styles.content}>
          <ThemedText>Loading tasks...</ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  // Render error state
  if (error && tasks.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <ThemedText type="title">Today</ThemedText>
          <ThemedText style={styles.subtitle}>Error loading tasks</ThemedText>
        </ThemedView>
        
        <ThemedView style={styles.content}>
          <ThemedText style={styles.errorText}>Failed to load tasks</ThemedText>
          <ThemedText style={styles.hint}>Pull down to try again</ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Header section with title and task count */}
      <ThemedView style={styles.header}>
        <ThemedText type="title">Today</ThemedText>
        <ThemedText style={styles.subtitle}>
          {todaysTasks.length === 0 
            ? "No tasks for today" 
            : `${todaysTasks.length} task${todaysTasks.length === 1 ? '' : 's'} for today`
          }
        </ThemedText>
      </ThemedView>
      
      {/* Scrollable content area */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor="#007AFF" // iOS blue color
          />
        }
      >
        {todaysTasks.length === 0 ? (
          // Empty state - no tasks for today
          <ThemedView style={styles.emptyState}>
            <ThemedText style={styles.emptyText}>No tasks for today yet.</ThemedText>
            <ThemedText style={styles.hint}>Tap the + button to add your first task!</ThemedText>
          </ThemedView>
        ) : (
          // Task list - we'll implement task components here later
          <ThemedView style={styles.taskList}>
            <ThemedText style={styles.sectionTitle}>Today's Tasks</ThemedText>
            
            {/* TODO: Implement TaskItem components here */}
            {/* For now, we'll show a placeholder */}
            {todaysTasks.map((task: Task) => (
              // TYPES USAGE - Using Task interface for type safety
              // task: Task - Each task object conforms to the Task interface from types/common/Task.ts
              // This ensures we have access to all the properties defined in the Task type
              <ThemedView key={task.id} style={styles.taskPlaceholder}>
                <ThemedText style={styles.taskTitle}>{task.title}</ThemedText>
                <ThemedText style={styles.taskDescription}>
                  {task.description || 'No description'}
                </ThemedText>
                <ThemedText style={styles.taskMeta}>
                  Priority: {task.priorityLevel} | Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                </ThemedText>
              </ThemedView>
            ))}
          </ThemedView>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  // Main container that takes up the full screen
  container: {
    flex: 1,
    padding: 20,
  },
  
  // Header section with title and subtitle
  header: {
    marginBottom: 20,
    paddingTop: 10, // Add some top padding for better spacing
  },
  subtitle: {
    marginTop: 8,
    opacity: 0.7,
    fontSize: 16,
  },
  
  // Content area for loading and error states
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Error text styling
  errorText: {
    color: '#FF3B30', // iOS red color
    textAlign: 'center',
    marginBottom: 8,
  },
  
  // Hint text styling
  hint: {
    marginTop: 8,
    opacity: 0.6,
    textAlign: 'center',
    fontSize: 14,
  },
  
  // Scroll view styling
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20, // Add bottom padding for better scrolling
  },
  
  // Empty state styling
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 8,
  },
  
  // Task list styling
  taskList: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    opacity: 0.9,
  },
  
  // Task placeholder styling (temporary until we implement proper task components)
  taskPlaceholder: {
    backgroundColor: 'rgba(32, 32, 32, 0.37)', // Light gray background
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  taskDescription: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 8,
  },
  taskMeta: {
    fontSize: 12,
    opacity: 0.6,
    fontStyle: 'italic',
  },
});
