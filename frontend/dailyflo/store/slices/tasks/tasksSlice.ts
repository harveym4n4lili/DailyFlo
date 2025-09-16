/**
 * Tasks Slice - Redux State Management for Tasks
 * 
 * This file defines the Redux slice for managing task-related state.
 * A "slice" is a collection of Redux reducer logic and actions for a specific
 * feature. It contains the initial state, reducers (functions that update state),
 * and action creators (functions that create actions to update state).
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Task, CreateTaskInput, UpdateTaskInput, TaskFilters, TaskSortOptions } from '../../../types';

/**
 * Define the shape of the tasks state
 * 
 * This interface describes what the tasks state looks like.
 * It includes all the data we need to manage tasks in our app.
 */
interface TasksState {
  // Data arrays
  tasks: Task[];                    // Array of all tasks
  filteredTasks: Task[];            // Array of tasks after filtering
  
  // Loading states - track if async operations are in progress
  isLoading: boolean;               // True when loading tasks
  isCreating: boolean;              // True when creating a new task
  isUpdating: boolean;              // True when updating a task
  isDeleting: boolean;              // True when deleting a task
  
  // Error states - store error messages if operations fail
  error: string | null;             // Error message if something goes wrong
  createError: string | null;       // Error message when creating fails
  updateError: string | null;       // Error message when updating fails
  deleteError: string | null;       // Error message when deleting fails
  
  // Filtering and sorting
  filters: TaskFilters;             // Current filters applied to tasks
  sortOptions: TaskSortOptions;     // Current sorting options
  
  // UI state
  selectedTaskIds: string[];        // Array of selected task IDs (for bulk operations)
  editingTaskId: string | null;     // ID of task currently being edited
  
  // Pagination (for when we have many tasks)
  currentPage: number;              // Current page number
  pageSize: number;                 // Number of tasks per page
  totalTasks: number;               // Total number of tasks
  hasNextPage: boolean;             // Whether there are more pages
  hasPreviousPage: boolean;         // Whether there are previous pages
  
  // Cache management
  lastFetched: number | null;       // Timestamp of last successful fetch
  cacheExpiry: number;              // How long cache is valid (in milliseconds)
}

/**
 * Initial state - the default state when the app starts
 * 
 * This defines what the state looks like before any actions are dispatched.
 */
const initialState: TasksState = {
  // Start with empty arrays
  tasks: [],
  filteredTasks: [],
  
  // Start with no loading states
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  
  // Start with no errors
  error: null,
  createError: null,
  updateError: null,
  deleteError: null,
  
  // Default filters and sorting
  filters: {},
  sortOptions: {
    field: 'createdAt',
    direction: 'desc',
  },
  
  // Start with no selections
  selectedTaskIds: [],
  editingTaskId: null,
  
  // Default pagination
  currentPage: 1,
  pageSize: 20,
  totalTasks: 0,
  hasNextPage: false,
  hasPreviousPage: false,
  
  // Cache settings
  lastFetched: null,
  cacheExpiry: 5 * 60 * 1000, // 5 minutes
};

/**
 * Async Thunks - Functions that handle async operations
 * 
 * Thunks are functions that can dispatch actions and perform async operations
 * like API calls. They're the modern way to handle async logic in Redux.
 */

// Fetch all tasks from the API
export const fetchTasks = createAsyncThunk(
  'tasks/fetchTasks',
  async (_, { rejectWithValue }) => {
    try {
      // TODO: Replace with actual API call
      // const response = await api.getTasks();
      // return response.data;
      
      // For now, return mock data
      const mockTasks: Task[] = [
        {
          id: '1',
          userId: 'user1',
          listId: null,
          title: 'Complete project proposal',
          description: 'Write and submit the project proposal by Friday',
          dueDate: new Date('2024-01-15'),
          isCompleted: false,
          completedAt: null,
          priorityLevel: 4,
          color: 'blue',
          routineType: 'once',
          sortOrder: 0,
          metadata: {
            subtasks: [],
            reminders: [],
          },
          softDeleted: false,
          createdAt: new Date('2024-01-10'),
          updatedAt: new Date('2024-01-10'),
        },
      ];
      
      return mockTasks;
    } catch (error) {
      // If the API call fails, return the error
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch tasks');
    }
  }
);

// Create a new task
export const createTask = createAsyncThunk(
  'tasks/createTask',
  async (taskData: CreateTaskInput, { rejectWithValue }) => {
    try {
      // TODO: Replace with actual API call
      // const response = await api.createTask(taskData);
      // return response.data;
      
      // For now, create a mock task
      const newTask: Task = {
        id: Date.now().toString(), // Simple ID generation
        userId: 'user1',
        listId: taskData.listId || null,
        title: taskData.title,
        description: taskData.description || '',
        dueDate: taskData.dueDate || null,
        isCompleted: false,
        completedAt: null,
        priorityLevel: taskData.priorityLevel || 3,
        color: taskData.color || 'blue',
        routineType: taskData.routineType || 'once',
        sortOrder: taskData.sortOrder || 0,
        metadata: {
          subtasks: taskData.metadata?.subtasks || [],
          reminders: taskData.metadata?.reminders || [],
          notes: taskData.metadata?.notes,
          tags: taskData.metadata?.tags,
        },
        softDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      return newTask;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to create task');
    }
  }
);

// Update an existing task
export const updateTask = createAsyncThunk(
  'tasks/updateTask',
  async ({ id, updates }: { id: string; updates: UpdateTaskInput }, { rejectWithValue }) => {
    try {
      // TODO: Replace with actual API call
      // const response = await api.updateTask(id, updates);
      // return response.data;
      
      // For now, return the updated task data
      return { id, updates };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update task');
    }
  }
);

// Delete a task
export const deleteTask = createAsyncThunk(
  'tasks/deleteTask',
  async (taskId: string, { rejectWithValue }) => {
    try {
      // TODO: Replace with actual API call
      // await api.deleteTask(taskId);
      
      // For now, just return the task ID
      return taskId;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to delete task');
    }
  }
);

/**
 * Create the tasks slice
 * 
 * This creates the slice with reducers (functions that update state)
 * and automatically generates action creators.
 */
const tasksSlice = createSlice({
  name: 'tasks', // Name of the slice (used in action types)
  initialState,  // Initial state
  reducers: {
    /**
     * Reducers are functions that specify how the state changes
     * in response to actions. They must be pure functions (no side effects).
     */
    
    // Clear all errors
    clearErrors: (state) => {
      state.error = null;
      state.createError = null;
      state.updateError = null;
      state.deleteError = null;
    },
    
    // Set filters for task filtering
    setFilters: (state, action: PayloadAction<TaskFilters>) => {
      state.filters = action.payload;
      // Apply filters to tasks
      state.filteredTasks = applyFilters(state.tasks, action.payload);
    },
    
    // Set sorting options
    setSortOptions: (state, action: PayloadAction<TaskSortOptions>) => {
      state.sortOptions = action.payload;
      // Apply sorting to filtered tasks
      state.filteredTasks = applySorting(state.filteredTasks, action.payload);
    },
    
    // Toggle task selection (for bulk operations)
    toggleTaskSelection: (state, action: PayloadAction<string>) => {
      const taskId = action.payload;
      const index = state.selectedTaskIds.indexOf(taskId);
      
      if (index === -1) {
        // Add to selection
        state.selectedTaskIds.push(taskId);
      } else {
        // Remove from selection
        state.selectedTaskIds.splice(index, 1);
      }
    },
    
    // Clear all task selections
    clearTaskSelection: (state) => {
      state.selectedTaskIds = [];
    },
    
    // Set editing task ID
    setEditingTaskId: (state, action: PayloadAction<string | null>) => {
      state.editingTaskId = action.payload;
    },
    
    // Update pagination
    setPagination: (state, action: PayloadAction<{ page: number; pageSize: number }>) => {
      state.currentPage = action.payload.page;
      state.pageSize = action.payload.pageSize;
    },
    
    // Optimistically update a task (for immediate UI feedback)
    optimisticUpdateTask: (state, action: PayloadAction<{ id: string; updates: Partial<Task> }>) => {
      const { id, updates } = action.payload;
      const taskIndex = state.tasks.findIndex(task => task.id === id);
      
      if (taskIndex !== -1) {
        // Update the task in the array
        state.tasks[taskIndex] = { ...state.tasks[taskIndex], ...updates };
        
        // Also update in filtered tasks if it exists there
        const filteredIndex = state.filteredTasks.findIndex(task => task.id === id);
        if (filteredIndex !== -1) {
          state.filteredTasks[filteredIndex] = { ...state.filteredTasks[filteredIndex], ...updates };
        }
      }
    },
  },
  
  /**
   * Extra reducers handle actions created by async thunks
   * 
   * These reducers respond to the different states of async operations:
   * - pending: Operation started
   * - fulfilled: Operation succeeded
   * - rejected: Operation failed
   */
  extraReducers: (builder) => {
    builder
      // Handle fetchTasks actions
      .addCase(fetchTasks.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tasks = action.payload;
        state.filteredTasks = applyFilters(action.payload, state.filters);
        state.lastFetched = Date.now();
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Handle createTask actions
      .addCase(createTask.pending, (state) => {
        state.isCreating = true;
        state.createError = null;
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.isCreating = false;
        state.tasks.push(action.payload);
        state.filteredTasks = applyFilters(state.tasks, state.filters);
      })
      .addCase(createTask.rejected, (state, action) => {
        state.isCreating = false;
        state.createError = action.payload as string;
      })
      
      // Handle updateTask actions
      .addCase(updateTask.pending, (state) => {
        state.isUpdating = true;
        state.updateError = null;
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        state.isUpdating = false;
        const { id, updates } = action.payload;
        const taskIndex = state.tasks.findIndex(task => task.id === id);
        
        if (taskIndex !== -1) {
          state.tasks[taskIndex] = { 
            ...state.tasks[taskIndex], 
            ...updates,
            metadata: {
              ...state.tasks[taskIndex].metadata,
              ...updates.metadata,
              subtasks: updates.metadata?.subtasks || state.tasks[taskIndex].metadata.subtasks || []
            }
          };
          state.filteredTasks = applyFilters(state.tasks, state.filters);
        }
      })
      .addCase(updateTask.rejected, (state, action) => {
        state.isUpdating = false;
        state.updateError = action.payload as string;
      })
      
      // Handle deleteTask actions
      .addCase(deleteTask.pending, (state) => {
        state.isDeleting = true;
        state.deleteError = null;
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.isDeleting = false;
        const taskId = action.payload;
        state.tasks = state.tasks.filter(task => task.id !== taskId);
        state.filteredTasks = state.filteredTasks.filter(task => task.id !== taskId);
        state.selectedTaskIds = state.selectedTaskIds.filter(id => id !== taskId);
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.isDeleting = false;
        state.deleteError = action.payload as string;
      });
  },
});

/**
 * Helper functions for filtering and sorting
 * 
 * These are pure functions that help process the task data.
 */

// Apply filters to tasks
function applyFilters(tasks: Task[], filters: TaskFilters): Task[] {
  return tasks.filter(task => {
    // Filter by completion status
    if (filters.isCompleted !== undefined && task.isCompleted !== filters.isCompleted) {
      return false;
    }
    
    // Filter by list ID
    if (filters.listId !== undefined && task.listId !== filters.listId) {
      return false;
    }
    
    // Filter by priority
    if (filters.priorityLevel !== undefined && task.priorityLevel !== filters.priorityLevel) {
      return false;
    }
    
    // Filter by color
    if (filters.color !== undefined && task.color !== filters.color) {
      return false;
    }
    
    // Filter by routine type
    if (filters.routineType !== undefined && task.routineType !== filters.routineType) {
      return false;
    }
    
    // Filter by search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const matchesTitle = task.title.toLowerCase().includes(query);
      const matchesDescription = task.description.toLowerCase().includes(query);
      if (!matchesTitle && !matchesDescription) {
        return false;
      }
    }
    
    // Filter by due date range
    if (filters.dueDateFrom && task.dueDate && task.dueDate < filters.dueDateFrom) {
      return false;
    }
    
    if (filters.dueDateTo && task.dueDate && task.dueDate > filters.dueDateTo) {
      return false;
    }
    
    return true;
  });
}

// Apply sorting to tasks
function applySorting(tasks: Task[], sortOptions: TaskSortOptions): Task[] {
  return [...tasks].sort((a, b) => {
    let aValue: any;
    let bValue: any;
    
    // Get the values to compare based on the sort field
    switch (sortOptions.field) {
      case 'title':
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
        break;
      case 'dueDate':
        aValue = a.dueDate?.getTime() || 0;
        bValue = b.dueDate?.getTime() || 0;
        break;
      case 'priorityLevel':
        aValue = a.priorityLevel;
        bValue = b.priorityLevel;
        break;
      case 'createdAt':
        aValue = a.createdAt.getTime();
        bValue = b.createdAt.getTime();
        break;
      case 'updatedAt':
        aValue = a.updatedAt.getTime();
        bValue = b.updatedAt.getTime();
        break;
      case 'sortOrder':
        aValue = a.sortOrder;
        bValue = b.sortOrder;
        break;
      default:
        return 0;
    }
    
    // Compare values
    if (aValue < bValue) {
      return sortOptions.direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortOptions.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });
}

/**
 * Export actions and reducer
 * 
 * Redux Toolkit automatically creates action creators for each reducer.
 * We can also export the reducer to be used in the store configuration.
 */
export const {
  clearErrors,
  setFilters,
  setSortOptions,
  toggleTaskSelection,
  clearTaskSelection,
  setEditingTaskId,
  setPagination,
  optimisticUpdateTask,
} = tasksSlice.actions;

export default tasksSlice.reducer;
