/**
 * Activity Logs Slice - Redux State Management for the Activity Log
 *
 * A Redux "slice" bundles together the state shape, sync reducers, and async thunks
 * for one feature. This slice manages all the activity log data.
 *
 * State shape:
 *   logs        - array of ActivityLog entries fetched from the API (newest first)
 *   isLoading   - true while the API call is in flight (used to show a loading indicator)
 *   error       - human-readable error message if the fetch fails (null when all is well)
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ActivityLog } from '../../../types/common/ActivityLog';
import activityLogsApiService from '../../../services/api/activityLogs';

// ─── State Shape ─────────────────────────────────────────────────────────────

interface ActivityLogsState {
  // flat array of all log entries for the user - the UI groups them by date
  logs: ActivityLog[];
  // loading flag: true while the GET /tasks/activity-logs/ request is running
  isLoading: boolean;
  // error message string when the fetch fails; null when there is no error
  error: string | null;
}

const initialState: ActivityLogsState = {
  logs: [],
  isLoading: false,
  error: null,
};

// ─── Async Thunk ─────────────────────────────────────────────────────────────

/**
 * fetchActivityLogs
 *
 * An "async thunk" is a Redux Toolkit helper that wraps an async function
 * and automatically dispatches three actions for you:
 *   - fetchActivityLogs/pending   → sets isLoading = true
 *   - fetchActivityLogs/fulfilled → stores the returned logs in state
 *   - fetchActivityLogs/rejected  → stores the error message in state
 *
 * The component just dispatches `fetchActivityLogs()` and subscribes to state;
 * it never has to manually handle loading/error itself.
 */
export const fetchActivityLogs = createAsyncThunk(
  'activityLogs/fetchActivityLogs',
  async (_, { rejectWithValue }) => {
    try {
      // call the API service which makes GET /tasks/activity-logs/
      const logs = await activityLogsApiService.fetchActivityLogs();
      return logs;
    } catch (error: any) {
      // convert the axios error into a user-readable string
      // rejectWithValue ensures it lands in action.payload (not action.error)
      const message =
        error?.response?.data?.detail ||
        error?.message ||
        'Failed to load activity log';
      return rejectWithValue(message);
    }
  }
);

// ─── Slice ───────────────────────────────────────────────────────────────────

const activityLogsSlice = createSlice({
  name: 'activityLogs',
  initialState,
  reducers: {
    // clear the log from state (called when user logs out so no data leaks between sessions)
    clearActivityLogs: (state) => {
      state.logs = [];
      state.isLoading = false;
      state.error = null;
    },

    // clear any existing error banner
    clearError: (state) => {
      state.error = null;
    },
  },

  // extraReducers respond to the three auto-generated fetchActivityLogs actions
  extraReducers: (builder) => {
    builder
      // request started - show loading indicator, clear any old error
      .addCase(fetchActivityLogs.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      // request succeeded - store the logs array, hide loading indicator
      .addCase(fetchActivityLogs.fulfilled, (state, action: PayloadAction<ActivityLog[]>) => {
        state.isLoading = false;
        state.logs = action.payload;
      })
      // request failed - hide loading indicator, surface the error message
      .addCase(fetchActivityLogs.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearActivityLogs, clearError } = activityLogsSlice.actions;

export default activityLogsSlice.reducer;
