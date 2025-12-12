# Tasks API Integration Planning Document
## Overview
This document outlines the step-by-step plan for integrating the Redux tasks slice with the API service layer. Currently, tasks are managed entirely in Redux using mock data stored in memory. This integration will connect the frontend to the Django backend API, enabling persistent task storage, real-time synchronization, and offline-first functionality.

### Current State
- **Redux Slice**: `store/slices/tasks/tasksSlice.ts` uses mock data and AsyncStorage
- **API Service**: `services/api/tasks.ts` contains all API methods but is not connected
- **UI Components**: Fully functional task management UI (create, read, update, delete)
- **Data Flow**: UI → Redux → Mock Data (no backend connection)

### Target State
- **Redux Slice**: Uses API service for all data operations
- **API Service**: Fully integrated with Redux async thunks
- **UI Components**: Same UI, now backed by real API data
- **Data Flow**: UI → Redux → API Service → Django Backend → Database

### Key Concepts for First-Time Redux/Service Layer Users
- **Redux Slice**: Manages application state (like a global data store)
- **Async Thunks**: Functions that handle async operations (like API calls) in Redux
- **Service Layer**: Separate layer that handles all API communication
- **Separation of Concerns**: UI doesn't talk directly to API, it goes through Redux

---
## Integration Architecture

### Data Flow Diagram
```
User Action (UI)
    ↓
Redux Action Dispatched
    ↓
Async Thunk (in Redux Slice)
    ↓
API Service Method (tasksApiService)
    ↓
HTTP Request (Axios)
    ↓
Django Backend API
    ↓
Database (PostgreSQL)
    ↓
Response Back Through Chain
    ↓
Redux State Updated
    ↓
UI Re-renders with New Data
```

### Component Responsibilities
- **UI Components**: Display data and handle user interactions
- **Redux Slice**: Manages state and dispatches actions
- **Async Thunks**: Handle async operations and call API service
- **API Service**: Makes HTTP requests and handles responses
- **API Client**: Configures HTTP client with authentication

---
## Implementation Steps

### Step 1: Update API Client Token Management
**Purpose**: Ensure API client can access authentication tokens from Redux store

**Files to Modify**:
- `services/api/client.ts`

**Changes Required**:
1. Import Redux store to access auth state
2. Update `getStoredToken()` to read from Redux store instead of localStorage
3. Update `refreshToken()` to dispatch Redux actions
4. Ensure token is available before making requests

**Code Pattern**:
```typescript
import { store } from '@/store';

const getStoredToken = (): string | null => {
  return store.getState().auth?.accessToken || null;
};
```

**Testing**:
- Verify token is retrieved correctly
- Test token refresh flow
- Ensure 401 errors trigger token refresh

---

### Step 2: Update fetchTasks Async Thunk
**Purpose**: Replace mock data with real API call

**Files to Modify**:
- `store/slices/tasks/tasksSlice.ts`

**Changes Required**:
1. Import `tasksApiService` from `@/services/api/tasks`
2. Replace mock data return with `tasksApiService.fetchTasks()`
3. Handle API response format (may differ from mock data)
4. Add proper error handling
5. Map API response to Task interface format

**Before (Current)**:
```typescript
export const fetchTasks = createAsyncThunk(
  'tasks/fetchTasks',
  async (_, { rejectWithValue }) => {
    // Returns mock data
    const mockTasks: Task[] = [...];
    return mockTasks;
  }
);
```

**After (Target)**:
```typescript
import tasksApiService from '@/services/api/tasks';

export const fetchTasks = createAsyncThunk(
  'tasks/fetchTasks',
  async (_, { rejectWithValue }) => {
    try {
      const response = await tasksApiService.fetchTasks();
      const tasks = response.tasks || response;
      return tasks.map(transformApiTaskToTask);
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch tasks');
    }
  }
);
```

**Helper Function** (see Data Transformation Reference section for full implementation):
```typescript
function transformApiTaskToTask(apiTask: any): Task {
  // Maps snake_case API fields to camelCase Task interface
  // Handles both formats for compatibility
}
```

**Testing**:
- Test successful fetch
- Test error handling (network failure, 401, 500)
- Verify data transformation
- Check Redux state updates correctly

---

### Step 3: Update createTask Async Thunk
**Purpose**: Replace AsyncStorage with API call

**Files to Modify**:
- `store/slices/tasks/tasksSlice.ts`

**Changes Required**:
1. Remove AsyncStorage logic
2. Call `tasksApiService.createTask()` with task data
3. Transform CreateTaskInput to API request format
4. Handle API response and transform back to Task format
5. Add optimistic update (update UI immediately, sync later)

**Before (Current)**:
```typescript
export const createTask = createAsyncThunk(
  'tasks/createTask',
  async (taskData: CreateTaskInput, { rejectWithValue, getState }) => {
    // Creates task locally and stores in AsyncStorage
    const newTask: Task = { ...taskData, id: generateTaskId() };
    await AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(updatedTasks));
    return newTask;
  }
);
```

**After (Target)**:
```typescript
export const createTask = createAsyncThunk(
  'tasks/createTask',
  async (taskData: CreateTaskInput, { rejectWithValue }) => {
    try {
      const apiRequest = transformTaskInputToApiRequest(taskData);
      const response = await tasksApiService.createTask(apiRequest);
      return transformApiTaskToTask(response.task || response);
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to create task');
    }
  }
);
```

**Helper Function** (see Data Transformation Reference):
```typescript
function transformTaskInputToApiRequest(input: CreateTaskInput): any {
  // Converts camelCase to snake_case and formats dates
}
```

**Optimistic Updates** (optional, for better UX):
```typescript
// Update UI immediately, sync in background
dispatch(optimisticUpdateTask({ id: tempId, updates: newTask }));
dispatch(createTask(taskData));
```

**Testing**:
- Test successful task creation
- Test validation errors from API
- Test network failures
- Verify optimistic updates work
- Check error rollback

---

### Step 4: Update updateTask Async Thunk
**Purpose**: Connect task updates to API

**Files to Modify**:
- `store/slices/tasks/tasksSlice.ts`

**Changes Required**:
1. Replace placeholder logic with `tasksApiService.updateTask()`
2. Transform UpdateTaskInput to API request format
3. Handle partial updates (PATCH request)
4. Update Redux state with API response

**Before (Current)**:
```typescript
export const updateTask = createAsyncThunk(
  'tasks/updateTask',
  async ({ id, updates }: { id: string; updates: UpdateTaskInput }, { rejectWithValue }) => {
    // Just returns the updates, doesn't call API
    return { id, updates };
  }
);
```

**After (Target)**:
```typescript
export const updateTask = createAsyncThunk(
  'tasks/updateTask',
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      const apiRequest = transformTaskInputToApiRequest(updates);
      const response = await tasksApiService.updateTask(id, apiRequest);
      const updatedTask = transformApiTaskToTask(response.task || response);
      return { id, task: updatedTask };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update task');
    }
  }
);
```

**Update Redux Reducer**:
```typescript
.addCase(updateTask.fulfilled, (state, action) => {
  state.isUpdating = false;
  const { id, task } = action.payload;
  const index = state.tasks.findIndex(t => t.id === id);
  if (index !== -1) {
    state.tasks[index] = task;
    state.filteredTasks = applyFilters(state.tasks, state.filters);
  }
})
```

**Testing**:
- Test successful task update
- Test partial updates (only some fields)
- Test validation errors
- Test network failures
- Verify state updates correctly

---

### Step 5: Update deleteTask Async Thunk
**Purpose**: Connect task deletion to API

**Files to Modify**:
- `store/slices/tasks/tasksSlice.ts`

**Changes Required**:
1. Replace placeholder logic with `tasksApiService.deleteTask()`
2. Handle soft delete vs hard delete
3. Update Redux state after successful deletion

**Before (Current)**:
```typescript
export const deleteTask = createAsyncThunk(
  'tasks/deleteTask',
  async (taskId: string, { rejectWithValue }) => {
    // Just returns taskId, doesn't call API
    return taskId;
  }
);
```

**After (Target)**:
```typescript
export const deleteTask = createAsyncThunk(
  'tasks/deleteTask',
  async (taskId: string, { rejectWithValue }) => {
    try {
      await tasksApiService.deleteTask(taskId);
      return taskId;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to delete task');
    }
  }
);
```

**Testing**:
- Test successful task deletion
- Test deletion of non-existent task (404 error)
- Test network failures
- Verify task is removed from state
- Test undo functionality (if implemented)

---

### Step 6: Add Error Handling and Retry Logic
**Purpose**: Handle network errors gracefully and provide retry functionality

**Files to Modify**:
- `store/slices/tasks/tasksSlice.ts`
- `services/api/client.ts` (if needed)

**Changes Required**:
1. Add retry logic for failed requests
2. Handle different error types (network, validation, server)
3. Show user-friendly error messages
4. Implement exponential backoff for retries

**Error Handling Strategy**:
```typescript
// Add retry logic with exponential backoff
export const fetchTasks = createAsyncThunk(
  'tasks/fetchTasks',
  async (_, { rejectWithValue }) => {
    let lastError;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await tasksApiService.fetchTasks();
        return response.tasks || response;
      } catch (error) {
        lastError = error;
        // Don't retry on 4xx errors
        if (error.response?.status >= 400 && error.response?.status < 500) break;
        // Exponential backoff
        if (attempt < 2) await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
        }
      }
    return rejectWithValue(getErrorMessage(lastError));
  }
);

// Helper: Convert API errors to user-friendly messages
function getErrorMessage(error: any): string {
  if (error.response) {
    const status = error.response.status;
    if (status === 401) return 'Please log in again';
    if (status === 403) return 'You don\'t have permission';
    if (status === 404) return 'Task not found';
    if (status === 422) return error.response.data?.message || 'Invalid data';
    if (status === 500) return 'Server error. Please try again later';
        return error.response.data?.message || 'An error occurred';
    }
  if (error.request) return 'Network error. Check your connection';
    return error.message || 'An unexpected error occurred';
}
```

**Testing**:
- Test network failure scenarios
- Test retry logic
- Test different error types
- Verify user-friendly error messages
- Test error recovery

---

### Step 7: Implement Offline Support with AsyncStorage
**Purpose**: Allow task operations when offline, sync when connection returns

**Files to Modify**:
- `store/slices/tasks/tasksSlice.ts`
- Create new file: `services/sync/taskSync.ts`

**Changes Required**:
1. Store pending operations in AsyncStorage when offline
2. Detect online/offline status
3. Sync pending operations when connection returns
4. Show offline indicator in UI

**Offline Queue Strategy**:
```typescript
// Store pending operations when offline
const OFFLINE_QUEUE_KEY = '@DailyFlo:offlineQueue';

async function queueOfflineOperation(operation: { type: string; data: any }) {
  const queue = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
  const operations = queue ? JSON.parse(queue) : [];
  operations.push({ ...operation, timestamp: Date.now() });
  await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(operations));
}

// Process queue when connection returns
async function processOfflineQueue(dispatch: any) {
  const queue = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
  if (!queue) return;
  const operations = JSON.parse(queue);
  for (const op of operations) {
    try {
      if (op.type === 'create') await dispatch(createTask(op.data));
      else if (op.type === 'update') await dispatch(updateTask({ id: op.data.id, updates: op.data }));
      else if (op.type === 'delete') await dispatch(deleteTask(op.data.id));
    } catch (error) {
      console.error('Sync failed:', op, error);
    }
  }
  await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
}
```

**Network Status Detection**:
```typescript
import NetInfo from '@react-native-community/netinfo';

NetInfo.addEventListener(state => {
  if (state.isConnected) processOfflineQueue(dispatch);
});
```

**Testing**:
- Test task creation while offline
- Test task updates while offline
- Test sync when connection returns
- Test conflict resolution (if task was modified on another device)
- Verify offline indicator shows correctly

---

### Step 8: Update Redux Reducers for API Responses
**Purpose**: Ensure reducers handle API response format correctly

**Files to Modify**:
- `store/slices/tasks/tasksSlice.ts`

**Changes Required**:
1. Update all reducer cases to handle API response format
2. Ensure data transformation happens in reducers if needed
3. Handle edge cases (empty responses, null values)

**Reducer Updates**:
```typescript
extraReducers: (builder) => {
  builder
    .addCase(fetchTasks.fulfilled, (state, action) => {
      state.isLoading = false;
      const tasks = Array.isArray(action.payload) ? action.payload : [];
      state.tasks = tasks;
      state.filteredTasks = applyFilters(tasks, state.filters);
      state.lastFetched = Date.now();
    })
    .addCase(createTask.fulfilled, (state, action) => {
      state.isCreating = false;
      state.tasks.push(action.payload);
      state.filteredTasks = applyFilters(state.tasks, state.filters);
    })
    .addCase(updateTask.fulfilled, (state, action) => {
      state.isUpdating = false;
      const { id, task } = action.payload;
      const index = state.tasks.findIndex(t => t.id === id);
      if (index !== -1) {
        state.tasks[index] = task;
        state.filteredTasks = applyFilters(state.tasks, state.filters);
      }
    })
    .addCase(deleteTask.fulfilled, (state, action) => {
      state.isDeleting = false;
      const taskId = action.payload;
      state.tasks = state.tasks.filter(t => t.id !== taskId);
      state.filteredTasks = state.filteredTasks.filter(t => t.id !== taskId);
    });
}
```

**Testing**:
- Test reducer with real API responses
- Test edge cases (empty arrays, null values)
- Verify state updates correctly
- Test filtering and sorting with real data

---

### Step 9: Add Loading States and User Feedback
**Purpose**: Provide visual feedback during API operations

**Files to Modify**:
- `app/(tabs)/today/index.tsx` (or relevant components)

**Changes Required**:
1. Show loading indicators during API calls
2. Display success/error messages
3. Handle optimistic updates visually

**Loading State Implementation**:
```typescript
const { isLoading, error } = useTasks();

{isLoading && <LoadingIndicator />}
{error && <ErrorMessage message={error} onDismiss={() => dispatch(clearErrors())} />}
```

**Testing**:
- Test loading indicators show correctly
- Test error messages display properly
- Test success feedback
- Verify loading states don't block UI unnecessarily

---

### Step 10: Testing and Validation
**Purpose**: Ensure all API integration works correctly

**Testing Checklist**:
- [ ] Fetch tasks on app load
- [ ] Create new task via API
- [ ] Update existing task via API
- [ ] Delete task via API
- [ ] Handle network errors gracefully
- [ ] Handle validation errors from API
- [ ] Test offline functionality
- [ ] Test sync when connection returns
- [ ] Verify token refresh works
- [ ] Test with multiple users (data isolation)
- [ ] Test with large number of tasks
- [ ] Verify performance (no lag in UI)

**Manual Testing Steps**:
1. Start Django backend server
2. Ensure backend API endpoints are working
3. Test each CRUD operation in the app
4. Test error scenarios (disconnect network, invalid data)
5. Test offline mode
6. Verify data persists after app restart

**Automated Testing** (Future):
- Unit tests for async thunks
- Integration tests for API service
- E2E tests for complete flows

---

## Data Transformation Reference

### API Response Format → Task Interface
The API returns snake_case (e.g., `due_date`) while frontend uses camelCase (e.g., `dueDate`). Transform function maps all fields:

```typescript
function transformApiTaskToTask(apiTask: any): Task {
  return {
    id: apiTask.id,
    userId: apiTask.user_id || apiTask.userId,
    listId: apiTask.list_id || apiTask.listId,
    title: apiTask.title,
    description: apiTask.description || '',
    // ... map all fields from snake_case to camelCase
    dueDate: apiTask.due_date || apiTask.dueDate,
    isCompleted: apiTask.is_completed || apiTask.isCompleted,
    priorityLevel: apiTask.priority_level || apiTask.priorityLevel,
    // ... etc
  };
}
```

### Task Interface → API Request Format
Transform frontend format to API request format:

```typescript
function transformTaskInputToApiRequest(input: CreateTaskInput | UpdateTaskInput): any {
  return {
    title: input.title,
    description: input.description,
    // ... convert camelCase to snake_case
    due_date: input.dueDate ? new Date(input.dueDate).toISOString() : null,
    priority_level: input.priorityLevel,
    list_id: input.listId,
    // ... etc
  };
}
```

---

## Error Handling Strategy

### Error Types and Responses
1. **Network Errors**: No internet connection
   - Show: "Network error. Please check your connection"
   - Action: Queue operation for offline sync

2. **Authentication Errors (401)**: Token expired or invalid
   - Show: "Please log in again"
   - Action: Trigger token refresh or redirect to login

3. **Validation Errors (422)**: Invalid data sent to API
   - Show: Specific field errors from API response
   - Action: Highlight invalid fields in form

4. **Permission Errors (403)**: User doesn't have permission
   - Show: "You don't have permission to do this"
   - Action: Disable action or redirect

5. **Not Found Errors (404)**: Resource doesn't exist
   - Show: "Task not found"
   - Action: Remove from state or show error

6. **Server Errors (500)**: Backend issue
   - Show: "Server error. Please try again later"
   - Action: Retry with exponential backoff

---

## Performance Considerations

### Optimization Strategies
1. **Pagination**: Load tasks in batches (e.g., 20 at a time)
2. **Caching**: Cache fetched tasks for 5 minutes (already implemented)
3. **Debouncing**: Debounce rapid updates (e.g., typing in search)
4. **Optimistic Updates**: Update UI immediately, sync in background
5. **Request Deduplication**: Prevent duplicate API calls

### Implementation Example
```typescript
export const fetchTasks = createAsyncThunk(
  'tasks/fetchTasks',
  async (_, { rejectWithValue, getState }) => {
    const state = getState() as any;
    const { lastFetched, cacheExpiry } = state.tasks;
    
    // Return cached data if still valid (5 minutes)
    if (lastFetched && Date.now() - lastFetched < cacheExpiry) {
      return state.tasks.tasks;
    }
    
    const response = await tasksApiService.fetchTasks();
    return response.tasks || response;
  }
);
```

---

## Security Considerations

### Data Protection
- **Authentication**: All API calls require valid JWT token
- **Authorization**: Backend validates user owns the task
- **Input Validation**: Validate all user input before sending to API
- **Error Messages**: Don't expose sensitive information in error messages

### Token Management
- **Automatic Refresh**: API client handles token refresh automatically
- **Secure Storage**: Tokens stored in secure storage (not plaintext)
- **Token Expiry**: Handle token expiration gracefully

---

## Rollback Strategy

If issues arise during integration:

1. **Keep Mock Data**: Don't delete mock data immediately, comment it out
2. **Feature Flag**: Add feature flag to toggle between mock and API data
3. **Gradual Rollout**: Test with one operation at a time (fetch first, then create, etc.)
4. **Version Control**: Commit after each step, not all at once

**Feature Flag Example**:
```typescript
const USE_API = true; // Toggle to false for mock data

export const fetchTasks = createAsyncThunk(
  'tasks/fetchTasks',
  async (_, { rejectWithValue }) => {
    if (!USE_API) return mockTasks;
    const response = await tasksApiService.fetchTasks();
    return response.tasks || response;
  }
);
```

---

## Success Criteria

### Functional Requirements
- [ ] All CRUD operations work with real API
- [ ] Data persists after app restart
- [ ] Offline mode works correctly
- [ ] Error handling provides clear feedback
- [ ] Token refresh works automatically
- [ ] Performance is acceptable (< 2s load time)

### Technical Requirements
- [ ] No console errors
- [ ] TypeScript types are correct
- [ ] Code follows project conventions
- [ ] Comments explain complex logic
- [ ] Error messages are user-friendly

---

## Next Steps After Integration

Once tasks API integration is complete:

1. **Lists API Integration**: Connect lists to API (similar process)
2. **Routines API Integration**: Connect recurring tasks to API
3. **Subtasks API Integration**: Connect subtasks to API
4. **Reminders API Integration**: Connect reminders to API
5. **Optimization**: Add pagination, caching improvements
6. **Testing**: Add automated tests for API integration

---

## Resources and References

### Key Files
- **Redux Slice**: `frontend/dailyflo/store/slices/tasks/tasksSlice.ts`
- **API Service**: `frontend/dailyflo/services/api/tasks.ts`
- **API Client**: `frontend/dailyflo/services/api/client.ts`
- **Task Types**: `frontend/dailyflo/types/common/Task.ts`
- **API Types**: `frontend/dailyflo/types/api/tasks.ts`

### Documentation
- **API Endpoints**: `docs/technical-design/api/endpoints.md`
- **Database Models**: `docs/technical-design/database/models.md`
- **Architecture**: `docs/technical-design/architecture.md`

### External Resources
- [Redux Toolkit Async Thunks](https://redux-toolkit.js.org/api/createAsyncThunk)
- [Axios Documentation](https://axios-http.com/docs/intro)
- [React Native NetInfo](https://github.com/react-native-netinfo/react-native-netinfo)

---

*Last updated: 2025-01-20*

