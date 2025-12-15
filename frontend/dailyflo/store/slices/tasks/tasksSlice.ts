/**
 * Tasks Slice - Redux State Management for Tasks
 * 
 * This file defines the Redux slice for managing task-related state.
 * A "slice" is a collection of Redux reducer logic and actions for a specific
 * feature. It contains the initial state, reducers (functions that update state),
 * and action creators (functions that create actions to update state).
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
// TYPES FOLDER IMPORTS - TypeScript type definitions
// The types folder contains all TypeScript interfaces and type definitions
import { Task, CreateTaskInput, UpdateTaskInput, TaskFilters, TaskSortOptions } from '../../../types';
// Task: Main interface for task objects (from types/common/Task.ts)
// CreateTaskInput: Interface for creating new tasks (from types/common/Task.ts)
// UpdateTaskInput: Interface for updating existing tasks (from types/common/Task.ts)
// TaskFilters: Interface for filtering tasks (from types/common/Task.ts)
// TaskSortOptions: Interface for sorting tasks (from types/common/Task.ts)

// ASYNC STORAGE IMPORTS
// AsyncStorage: React Native's local storage for storing data offline
// this is used temporarily to store tasks locally without API calls
import AsyncStorage from '@react-native-async-storage/async-storage';

// API SERVICE IMPORTS
// tasksApiService: service that handles all task-related API calls to Django backend
// this service makes HTTP requests and returns formatted responses
import tasksApiService from '../../../services/api/tasks';

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

/**
 * Transform API task response to Task interface format
 * This function converts API response (which may use snake_case) to our Task interface (camelCase)
 * It handles both formats for compatibility - if API returns camelCase, it works; if snake_case, it converts
 * 
 * @param apiTask - Task data from API (may be snake_case or camelCase)
 * @returns Task object in the format expected by our app
 */
function transformApiTaskToTask(apiTask: any): Task {
  // Handle both snake_case (from Django) and camelCase (if already converted)
  // This makes the function flexible and works with different API response formats
  return {
    id: apiTask.id || '',
    userId: apiTask.user_id || apiTask.userId || '',
    listId: apiTask.list_id !== undefined ? apiTask.list_id : (apiTask.listId !== undefined ? apiTask.listId : null),
    title: apiTask.title || '',
    description: apiTask.description || '',
    icon: apiTask.icon,
    time: apiTask.time,
    duration: apiTask.duration || 0,
    dueDate: apiTask.due_date || apiTask.dueDate || null,
    isCompleted: apiTask.is_completed !== undefined ? apiTask.is_completed : (apiTask.isCompleted !== undefined ? apiTask.isCompleted : false),
    completedAt: apiTask.completed_at || apiTask.completedAt || null,
    priorityLevel: apiTask.priority_level || apiTask.priorityLevel || 3,
    color: apiTask.color || 'blue',
    routineType: apiTask.routine_type || apiTask.routineType || 'once',
    sortOrder: apiTask.sort_order || apiTask.sortOrder || 0,
    metadata: {
      subtasks: apiTask.metadata?.subtasks || [],
      reminders: apiTask.metadata?.reminders || [],
      notes: apiTask.metadata?.notes,
      tags: apiTask.metadata?.tags,
    },
    softDeleted: apiTask.soft_deleted !== undefined ? apiTask.soft_deleted : (apiTask.softDeleted !== undefined ? apiTask.softDeleted : false),
    createdAt: apiTask.created_at || apiTask.createdAt || new Date().toISOString(),
    updatedAt: apiTask.updated_at || apiTask.updatedAt || new Date().toISOString(),
  };
}

// Fetch all tasks from the API
export const fetchTasks = createAsyncThunk(
  'tasks/fetchTasks',
  async (_, { rejectWithValue }) => {
    try {
      console.log('🔄 fetchTasks thunk started - calling API');
      
      // Call the API service to fetch tasks from Django backend
      // tasksApiService.fetchTasks() makes a GET request to /tasks/ endpoint
      const response = await tasksApiService.fetchTasks();
      
      // DEBUG: Log the actual response structure to understand what Django returns
      console.log('📦 API Response structure:', {
        responseType: typeof response,
        isArray: Array.isArray(response),
        hasData: !!response.data,
        hasTasks: !!response.tasks,
        responseKeys: response && typeof response === 'object' ? Object.keys(response) : 'not an object',
        responseSample: JSON.stringify(response).substring(0, 200), // First 200 chars
      });
      
      // Handle different response formats
      // Django REST Framework typically returns arrays directly or wrapped in objects
      // Try multiple possible formats to be flexible
      let tasksArray: any[] = [];
      
      if (Array.isArray(response)) {
        // Case 1: Response is directly an array of tasks
        tasksArray = response;
      } else if (response?.data && Array.isArray(response.data)) {
        // Case 2: Response has a data property with array
        tasksArray = response.data;
      } else if (response?.tasks && Array.isArray(response.tasks)) {
        // Case 3: Response has a tasks property with array
        tasksArray = response.tasks;
      } else if (response?.results && Array.isArray(response.results)) {
        // Case 4: Django REST Framework pagination format
        tasksArray = response.results;
      } else {
        // Case 5: Fallback - log warning and use empty array
        console.warn('⚠️ Unexpected API response format:', response);
        tasksArray = [];
      }
      
      // Transform each API task to our Task interface format
      // This ensures all tasks match our expected structure (camelCase, proper types)
      const transformedTasks = tasksArray.map((apiTask: any) => transformApiTaskToTask(apiTask));
      
      console.log('✅ fetchTasks completed:', transformedTasks.length, 'tasks fetched from API');
      return transformedTasks;
    } catch (error) {
      // Handle API errors - log the error and return a user-friendly message
      console.error('❌ fetchTasks failed:', error);
      
      // Extract error message from API response or use default message
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error as any)?.response?.data?.message || 'Failed to fetch tasks';
      
      // Return error using rejectWithValue so Redux can handle it
      return rejectWithValue(errorMessage);
    }
  }
);

// OLD CODE - Mock data (commented out, kept for reference during development)
// This mock data was used before API integration
// Can be removed once API integration is fully tested
/*
      // For now, return mock data
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      // TYPES USAGE - Creating mock data that conforms to Task interface
      // mockTasks: Task[] - Array of Task objects that match the Task interface from types/common/Task.ts
      // This ensures our mock data has the same structure as real API data
      const mockTasks: Task[] = [
        {
          id: '1',
          userId: 'user1',
          listId: null,
          title: 'Complete project proposal',
          description: 'Write and submit the project proposal by Friday',
          icon: 'briefcase',              // icon field - represents work/business task
          time: '14:00',                  // time field - specific time in HH:MM format
          duration: 120,                  // duration field - 120 minutes (2 hours) estimated time
          dueDate: today.toISOString(), // Due today - convert to string for Redux serialization
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
          createdAt: new Date('2024-01-10').toISOString(),
          updatedAt: new Date('2024-01-10').toISOString(),
        },
        {
          id: '2',
          userId: 'user1',
          listId: null,
          title: 'Buy groceries',
          description: 'Get milk, bread, and eggs from the store',
          icon: 'cart',                   // icon field - shopping cart icon for grocery task
          time: '10:00',                  // time field - morning shopping time
          duration: 45,                   // duration field - 45 minutes for grocery shopping
          dueDate: today.toISOString(), // Due today - convert to string for Redux serialization
          isCompleted: false,
          completedAt: null,
          priorityLevel: 3,
          color: 'green',
          routineType: 'once',
          sortOrder: 1,
          metadata: {
            subtasks: [],
            reminders: [],
          },
          softDeleted: false,
          createdAt: new Date('2024-01-11').toISOString(),
          updatedAt: new Date('2024-01-11').toISOString(),
        },
        {
          id: '3',
          userId: 'user1',
          listId: null,
          title: 'Call dentist',
          description: 'Schedule annual checkup appointment',
          icon: 'medical',                // icon field - medical/health related icon
          time: '09:00',                  // time field - morning call time
          duration: 15,                   // duration field - 15 minutes for phone call
          dueDate: yesterday.toISOString(), // Overdue task - convert to string for Redux serialization
          isCompleted: false,
          completedAt: null,
          priorityLevel: 2,
          color: 'red',
          routineType: 'once',
          sortOrder: 2,
          metadata: {
            subtasks: [],
            reminders: [],
          },
          softDeleted: false,
          createdAt: new Date('2024-01-09').toISOString(),
          updatedAt: new Date('2024-01-09').toISOString(),
        },
        {
          id: '4',
          userId: 'user1',
          listId: null,
          title: 'Plan weekend trip',
          description: 'Research destinations and book accommodation',
          icon: 'airplane',               // icon field - travel/trip icon
          time: '15:30',                  // time field - afternoon planning time
          duration: 60,                   // duration field - 60 minutes (1 hour) for planning
          dueDate: tomorrow.toISOString(), // Due tomorrow (won't show in today's view) - convert to string for Redux serialization
          isCompleted: false,
          completedAt: null,
          priorityLevel: 3,
          color: 'purple',
          routineType: 'once',
          sortOrder: 3,
          metadata: {
            subtasks: [],
            reminders: [],
          },
          softDeleted: false,
          createdAt: new Date('2024-01-12').toISOString(),
          updatedAt: new Date('2024-01-12').toISOString(),
        },
        {
          id: '9',
          userId: 'user1',
          listId: null,
          title: 'Review quarterly budget',
          description: 'Analyze Q1 spending and prepare Q2 budget proposal',
          icon: 'calculator',             // icon field - finance/budget icon
          time: '11:00',                  // time field - late morning review time
          duration: 90,                   // duration field - 90 minutes for budget review
          dueDate: tomorrow.toISOString(),
          isCompleted: false,
          completedAt: null,
          priorityLevel: 3,
          color: 'blue',
          routineType: 'once',
          sortOrder: 4,
          metadata: {
            subtasks: [],
            reminders: [],
          },
          softDeleted: false,
          createdAt: new Date('2024-09-19').toISOString(),
          updatedAt: new Date('2024-09-19').toISOString(),
        },
        {
          id: '10',
          userId: 'user1',
          listId: null,
          title: 'Organize home office',
          description: 'Clean desk, organize files, and set up better workspace',
          icon: 'home',                   // icon field - home icon
          time: '13:00',                  // time field - afternoon organizing time
          duration: 0,                    // duration field - 0 minutes (not specified/open-ended task)
          dueDate: today.toISOString(),
          isCompleted: false,
          completedAt: null,
          priorityLevel: 1,
          color: 'teal',
          routineType: 'once',
          sortOrder: 5,
          metadata: {
            subtasks: [],
            reminders: [],
          },
          softDeleted: false,
          createdAt: new Date('2024-01-14').toISOString(),
          updatedAt: new Date('2024-01-14').toISOString(),
        },
        {
          id: '11',
          userId: 'user1',
          listId: null,
          title: 'Book vacation flights',
          description: 'Research and book flights for summer vacation',
          icon: 'airplane',               // icon field - flight/travel icon
          time: '16:00',                  // time field - afternoon booking time
          duration: 30,                   // duration field - 30 minutes for flight booking
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
          isCompleted: false,
          completedAt: null,
          priorityLevel: 4,
          color: 'orange',
          routineType: 'once',
          sortOrder: 6,
          metadata: {
            subtasks: [],
            reminders: [],
          },
          softDeleted: false,
          createdAt: new Date('2024-01-15').toISOString(),
          updatedAt: new Date('2024-01-15').toISOString(),
        },
        {
          id: '12',
          userId: 'user1',
          listId: null,
          title: 'Update LinkedIn profile',
          description: 'Add recent projects and update professional summary',
          icon: 'person',                 // icon field - profile/person icon
          time: '12:00',                  // time field - lunch time update
          duration: 25,                   // duration field - 25 minutes for profile update
          dueDate: yesterday.toISOString(), // Overdue
          isCompleted: false,
          completedAt: null,
          priorityLevel: 3,
          color: 'purple',
          routineType: 'once',
          sortOrder: 7,
          metadata: {
            subtasks: [],
            reminders: [],
          },
          softDeleted: false,
          createdAt: new Date('2024-01-08').toISOString(),
          updatedAt: new Date('2024-01-08').toISOString(),
        },
        {
          id: '13',
          userId: 'user1',
          listId: null,
          title: 'Read new book chapter',
          description: 'Continue reading "Atomic Habits" - chapters 5-6',
          icon: 'book',                   // icon field - book icon for reading task
          time: '20:00',                  // time field - evening reading time
          duration: 40,                   // duration field - 40 minutes for reading
          dueDate: today.toISOString(),
          isCompleted: true, // Completed task
          completedAt: new Date('2024-01-19T10:30:00Z').toISOString(),
          priorityLevel: 1,
          color: 'green',
          routineType: 'daily',
          sortOrder: 8,
          metadata: {
            subtasks: [],
            reminders: [],
          },
          softDeleted: false,
          createdAt: new Date('2024-01-16').toISOString(),
          updatedAt: new Date('2024-01-19T10:30:00Z').toISOString(),
        },
        {
          id: '14',
          userId: 'user1',
          listId: null,
          title: 'Prepare presentation slides',
          description: 'Create slides for team meeting next week',
          icon: 'document',               // icon field - document/presentation icon
          time: '14:30',                  // time field - afternoon work time
          duration: 180,                  // duration field - 180 minutes (3 hours) for presentation prep
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
          isCompleted: false,
          completedAt: null,
          priorityLevel: 4,
          color: 'red',
          routineType: 'once',
          sortOrder: 9,
          metadata: {
            subtasks: [],
            reminders: [],
          },
          softDeleted: false,
          createdAt: new Date('2024-01-17').toISOString(),
          updatedAt: new Date('2024-01-17').toISOString(),
        },
        {
          id: '15',
          userId: 'user1',
          listId: null,
          title: 'Schedule car maintenance',
          description: 'Book oil change and tire rotation appointment',
          icon: 'car',                    // icon field - car icon for vehicle maintenance
          time: '08:30',                  // time field - early morning appointment
          duration: 10,                   // duration field - 10 minutes to make appointment
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
          isCompleted: false,
          completedAt: null,
          priorityLevel: 3,
          color: 'yellow',
          routineType: 'monthly',
          sortOrder: 10,
          metadata: {
            subtasks: [],
            reminders: [],
          },
          softDeleted: false,
          createdAt: new Date('2024-01-18').toISOString(),
          updatedAt: new Date('2024-01-18').toISOString(),
        },
        {
          id: '16',
          userId: 'user1',
          listId: null,
          title: 'Learn new React hooks',
          description: 'Study useCallback, useMemo, and custom hooks patterns',
          icon: 'code',                   // icon field - code icon for programming task
          time: '19:00',                  // time field - evening learning time
          duration: 50,                   // duration field - 50 minutes for learning session
          dueDate: today.toISOString(),
          isCompleted: false,
          completedAt: null,
          priorityLevel: 3,
          color: 'blue',
          routineType: 'weekly',
          sortOrder: 11,
          metadata: {
            subtasks: [],
            reminders: [],
          },
          softDeleted: false,
          createdAt: new Date('2024-01-19').toISOString(),
          updatedAt: new Date('2024-01-19').toISOString(),
        },
        
      ];
      
      console.log('📦 Returning mock tasks:', mockTasks.length, 'tasks');
      return mockTasks;
*/

// TEMPORARY LOCAL STORAGE KEY
// This key is used to store tasks in AsyncStorage
// This is a temporary solution until API integration is ready
const TASKS_STORAGE_KEY = '@DailyFlo:tasks';

// Helper function to generate a unique ID for tasks
// This creates a simple timestamp-based ID for local storage
function generateTaskId(): string {
  return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Create a new task (TEMPORARY - uses local storage instead of API)
// This is an async thunk - a Redux Toolkit function that handles async operations
// It dispatches actions automatically: pending (loading), fulfilled (success), rejected (error)
// For now, this stores tasks in AsyncStorage instead of making API calls
export const createTask = createAsyncThunk(
  'tasks/createTask',
  async (taskData: CreateTaskInput, { rejectWithValue, getState }) => {
    try {
      // Create a new task object with all required fields
      // This transforms CreateTaskInput into a full Task object
      const newTask: Task = {
        id: generateTaskId(), // Generate a unique ID for local storage
        userId: 'local_user', // Temporary user ID for local storage
        listId: taskData.listId || null,
        title: taskData.title,
        description: taskData.description || '',
        icon: taskData.icon,
        time: taskData.time,
        duration: taskData.duration || 0,
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // Get current tasks from Redux state
      const state = getState() as any;
      const currentTasks = state.tasks?.tasks || [];
      
      // Add the new task to the list
      const updatedTasks = [...currentTasks, newTask];
      
      // Store tasks in AsyncStorage
      // AsyncStorage stores data as strings, so we need to JSON.stringify
      await AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(updatedTasks));
      
      console.log('Task created and stored locally:', newTask.id);
      
      // Return the new task so it gets added to Redux state
      return newTask;
    } catch (error) {
      // If storage fails, return an error message
      const errorMessage = error instanceof Error ? error.message : 'Failed to create task';
      console.error('Create task error:', error);
      return rejectWithValue(errorMessage);
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
        aValue = a.dueDate ? new Date(a.dueDate).getTime() : 0;
        bValue = b.dueDate ? new Date(b.dueDate).getTime() : 0;
        break;
      case 'priorityLevel':
        aValue = a.priorityLevel;
        bValue = b.priorityLevel;
        break;
      case 'createdAt':
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
        break;
      case 'updatedAt':
        aValue = new Date(a.updatedAt).getTime();
        bValue = new Date(b.updatedAt).getTime();
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
