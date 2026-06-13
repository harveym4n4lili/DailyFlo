/**
 * Habits Slice — Redux state for today's habits list and CRUD.
 *
 * data comes from GET /habits/today/ on django; habits tab + today section dispatch fetchHabitsToday on focus.
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import habitsApiService from '@/services/api/habits';
import type {
  CreateHabitInput,
  Habit,
  HabitLogResponse,
  HabitStatsResponse,
  HabitTodayItem,
  HabitsTodayResponse,
  HabitsTodaySummary,
  UpdateHabitInput,
} from '@/types/api/habits';

interface HabitsState {
  todayDate: string | null;
  todayHabits: HabitTodayItem[];
  todaySummary: HabitsTodaySummary | null;
  isTodayLoading: boolean;
  isSaving: boolean;
  todayError: string | null;
  saveError: string | null;
  /** detail screen — single habit + analytics from GET /habits/:id/stats/ */
  detailHabit: Habit | null;
  detailStats: HabitStatsResponse | null;
  isDetailLoading: boolean;
  detailError: string | null;
}

const initialState: HabitsState = {
  todayDate: null,
  todayHabits: [],
  todaySummary: null,
  isTodayLoading: false,
  isSaving: false,
  todayError: null,
  saveError: null,
  detailHabit: null,
  detailStats: null,
  isDetailLoading: false,
  detailError: null,
};

function getErrorMessage(error: unknown, fallback: string): string {
  const err = error as { response?: { data?: { detail?: string } }; message?: string };
  return err?.response?.data?.detail || err?.message || fallback;
}

/** load habits due today — used by habits tab and today section */
export const fetchHabitsToday = createAsyncThunk(
  'habits/fetchToday',
  async (_, { rejectWithValue }) => {
    try {
      return await habitsApiService.fetchHabitsToday();
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to load habits'));
    }
  },
);

/** POST /habits/ — create from FAB or onboarding */
export const createHabit = createAsyncThunk(
  'habits/create',
  async (input: CreateHabitInput, { rejectWithValue, dispatch }) => {
    try {
      const habit = await habitsApiService.createHabit(input);
      // refresh today's list so new habit appears if due today
      void dispatch(fetchHabitsToday());
      return habit;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to create habit'));
    }
  },
);

export const updateHabit = createAsyncThunk(
  'habits/update',
  async ({ id, input }: { id: string; input: UpdateHabitInput }, { rejectWithValue, dispatch }) => {
    try {
      const habit = await habitsApiService.updateHabit(id, input);
      void dispatch(fetchHabitsToday());
      void dispatch(fetchHabitStats(id));
      return habit;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to update habit'));
    }
  },
);

export const deleteHabit = createAsyncThunk(
  'habits/delete',
  async (id: string, { rejectWithValue, dispatch }) => {
    try {
      await habitsApiService.deleteHabit(id);
      void dispatch(fetchHabitsToday());
      return id;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to delete habit'));
    }
  },
);

/** GET /habits/:id/ — load habit record for detail / edit screens */
export const fetchHabit = createAsyncThunk(
  'habits/fetchOne',
  async (id: string, { rejectWithValue }) => {
    try {
      return await habitsApiService.fetchHabit(id);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to load habit'));
    }
  },
);

/** GET /habits/:id/stats/ — heatmap + trend; used on detail focus */
export const fetchHabitStats = createAsyncThunk(
  'habits/fetchStats',
  async (id: string, { rejectWithValue }) => {
    try {
      return await habitsApiService.fetchHabitStats(id);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to load habit stats'));
    }
  },
);

/** tap row / +1 — toggles binary or increments numeric; refreshes gamification streak on complete */
export const logHabitProgress = createAsyncThunk(
  'habits/logProgress',
  async (
    { id, date, delta }: { id: string; date?: string; delta?: number },
    { rejectWithValue, dispatch, getState },
  ) => {
    try {
      const response = await habitsApiService.logHabitProgress(id, { date, delta });
      const state = getState() as { habits: HabitsState };
      const previous = state.habits.todayHabits.find((h) => h.id === id);
      const wasComplete = previous?.isCompleteToday ?? false;
      if (response.isCompleteToday && !wasComplete) {
        const { fetchGamificationSummary } = await import('../gamification/gamificationSlice');
        void dispatch(fetchGamificationSummary());
      }
      const stateAfter = getState() as { habits: HabitsState };
      if (stateAfter.habits.detailHabit?.id === id) {
        void dispatch(fetchHabitStats(id));
      }
      return { habitId: id, response };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to log habit'));
    }
  },
);

function applyTodayPayload(state: HabitsState, payload: HabitsTodayResponse) {
  state.todayDate = payload.date;
  state.todayHabits = payload.habits;
  state.todaySummary = payload.summary;
}

function applyLogToHabit(state: HabitsState, habitId: string, response: HabitLogResponse) {
  const idx = state.todayHabits.findIndex((h) => h.id === habitId);
  if (idx === -1) return;
  const habit = state.todayHabits[idx];
  state.todayHabits[idx] = {
    ...habit,
    loggedValue: response.loggedValue,
    isCompleteToday: response.isCompleteToday,
    currentStreak: response.currentStreak,
    longestStreak: response.longestStreak,
  };
  if (state.todaySummary) {
    const completedCount = state.todayHabits.filter((h) => h.isCompleteToday).length;
    state.todaySummary = {
      ...state.todaySummary,
      completedCount,
      bestActiveStreak: Math.max(
        ...state.todayHabits.map((h) => h.currentStreak),
        0,
      ),
    };
  }
}

const habitsSlice = createSlice({
  name: 'habits',
  initialState,
  reducers: {
    clearHabits(state) {
      Object.assign(state, initialState);
    },
    clearHabitDetail(state) {
      state.detailHabit = null;
      state.detailStats = null;
      state.isDetailLoading = false;
      state.detailError = null;
    },
    /** optimistic row update before API returns — reverted on rejected log thunk */
    optimisticLogHabit(state, action: PayloadAction<{ id: string; delta?: number }>) {
      const habit = state.todayHabits.find((h) => h.id === action.payload.id);
      if (!habit) return;
      if (habit.trackingType === 'binary') {
        habit.isCompleteToday = !habit.isCompleteToday;
        habit.loggedValue = habit.isCompleteToday ? 1 : 0;
      } else {
        const step = action.payload.delta ?? 1;
        habit.loggedValue = (habit.loggedValue ?? 0) + step;
        const target = habit.targetValue ?? 1;
        habit.isCompleteToday = habit.loggedValue >= target;
      }
      if (state.todaySummary) {
        state.todaySummary.completedCount = state.todayHabits.filter((h) => h.isCompleteToday).length;
      }
    },
    revertOptimisticLog(state, action: PayloadAction<{ id: string; snapshot: HabitTodayItem }>) {
      const idx = state.todayHabits.findIndex((h) => h.id === action.payload.id);
      if (idx !== -1) {
        state.todayHabits[idx] = action.payload.snapshot;
      }
      if (state.todaySummary) {
        state.todaySummary.completedCount = state.todayHabits.filter((h) => h.isCompleteToday).length;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHabitsToday.pending, (state) => {
        state.isTodayLoading = true;
        state.todayError = null;
      })
      .addCase(fetchHabitsToday.fulfilled, (state, action: PayloadAction<HabitsTodayResponse>) => {
        state.isTodayLoading = false;
        applyTodayPayload(state, action.payload);
      })
      .addCase(fetchHabitsToday.rejected, (state, action) => {
        state.isTodayLoading = false;
        state.todayError = (action.payload as string) || 'Failed to load habits';
      })
      .addCase(createHabit.pending, (state) => {
        state.isSaving = true;
        state.saveError = null;
      })
      .addCase(createHabit.fulfilled, (state) => {
        state.isSaving = false;
      })
      .addCase(createHabit.rejected, (state, action) => {
        state.isSaving = false;
        state.saveError = (action.payload as string) || 'Failed to create habit';
      })
      .addCase(logHabitProgress.fulfilled, (state, action) => {
        applyLogToHabit(state, action.payload.habitId, action.payload.response);
        if (state.detailStats && action.payload.habitId === state.detailHabit?.id) {
          state.detailStats.currentStreak = action.payload.response.currentStreak;
          state.detailStats.longestStreak = action.payload.response.longestStreak;
        }
      })
      .addCase(fetchHabit.pending, (state) => {
        state.isDetailLoading = true;
        state.detailError = null;
      })
      .addCase(fetchHabit.fulfilled, (state, action: PayloadAction<Habit>) => {
        state.isDetailLoading = false;
        state.detailHabit = action.payload;
      })
      .addCase(fetchHabit.rejected, (state, action) => {
        state.isDetailLoading = false;
        state.detailError = (action.payload as string) || 'Failed to load habit';
      })
      .addCase(fetchHabitStats.fulfilled, (state, action: PayloadAction<HabitStatsResponse>) => {
        state.detailStats = action.payload;
      })
      .addCase(fetchHabitStats.rejected, (state, action) => {
        state.detailError = (action.payload as string) || 'Failed to load habit stats';
      })
      .addCase(updateHabit.fulfilled, (state, action: PayloadAction<Habit>) => {
        state.detailHabit = action.payload;
      })
      .addCase(deleteHabit.fulfilled, (state, action: PayloadAction<string>) => {
        if (state.detailHabit?.id === action.payload) {
          state.detailHabit = null;
          state.detailStats = null;
        }
      });
  },
});

export const { clearHabits, clearHabitDetail, optimisticLogHabit, revertOptimisticLog } = habitsSlice.actions;
export default habitsSlice.reducer;
