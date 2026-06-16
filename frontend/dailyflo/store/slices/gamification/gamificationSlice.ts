/**
 * Gamification Slice — Redux state for streaks, stats, achievements, and goals.
 *
 * data comes from GET /gamification/* on django; browse home dispatches fetchGamificationSummary on focus.
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import gamificationApiService from '../../../services/api/gamification';
import type {
  AchievementItem,
  CreateUserGoalInput,
  GamificationSummary,
  UpdateUserGoalInput,
  UserGoalItem,
} from '@/types/api/gamification';

interface GamificationState {
  summary: GamificationSummary | null;
  achievements: AchievementItem[];
  goals: UserGoalItem[];
  /** set when a habit log unlocks a new achievement — drives AchievementUnlockToast */
  pendingAchievementUnlock: AchievementItem | null;
  isSummaryLoading: boolean;
  isAchievementsLoading: boolean;
  isGoalsLoading: boolean;
  isGoalSaving: boolean;
  summaryError: string | null;
  achievementsError: string | null;
  goalsError: string | null;
  goalSaveError: string | null;
}

const emptySummary: GamificationSummary = {
  completionsToday: 0,
  completionsThisWeek: 0,
  completionsThisMonth: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastCompletionDate: null,
  goalsOnTrack: 0,
  goalsTotal: 0,
  unlockedAchievementCount: 0,
};

const initialState: GamificationState = {
  summary: null,
  achievements: [],
  goals: [],
  pendingAchievementUnlock: null,
  isSummaryLoading: false,
  isAchievementsLoading: false,
  isGoalsLoading: false,
  isGoalSaving: false,
  summaryError: null,
  achievementsError: null,
  goalsError: null,
  goalSaveError: null,
};

function getErrorMessage(error: unknown, fallback: string): string {
  const err = error as { response?: { data?: { detail?: string } }; message?: string };
  return err?.response?.data?.detail || err?.message || fallback;
}

/** load streak + period counts for browse progress card */
export const fetchGamificationSummary = createAsyncThunk(
  'gamification/fetchSummary',
  async (_, { rejectWithValue }) => {
    try {
      return await gamificationApiService.fetchSummary();
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to load progress'));
    }
  }
);

export const fetchAchievements = createAsyncThunk(
  'gamification/fetchAchievements',
  async (_, { rejectWithValue }) => {
    try {
      return await gamificationApiService.fetchAchievements();
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to load achievements'));
    }
  }
);

export const fetchGoals = createAsyncThunk(
  'gamification/fetchGoals',
  async (_, { rejectWithValue }) => {
    try {
      return await gamificationApiService.fetchGoals();
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to load goals'));
    }
  }
);

export const createGoal = createAsyncThunk(
  'gamification/createGoal',
  async (input: CreateUserGoalInput, { rejectWithValue, dispatch }) => {
    try {
      const goal = await gamificationApiService.createGoal(input);
      void dispatch(fetchGamificationSummary());
      return goal;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to create goal'));
    }
  }
);

export const deleteGoal = createAsyncThunk(
  'gamification/deleteGoal',
  async (goalId: string, { rejectWithValue, dispatch }) => {
    try {
      await gamificationApiService.deleteGoal(goalId);
      void dispatch(fetchGamificationSummary());
      return goalId;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to delete goal'));
    }
  }
);

/** dev-only — clears unlock rows + completion logs on server, then refreshes local gamification state */
export const resetAchievementsDev = createAsyncThunk(
  'gamification/resetAchievementsDev',
  async (_, { rejectWithValue, dispatch }) => {
    if (!__DEV__) {
      return rejectWithValue('Dev reset is only available in development builds.');
    }
    try {
      const result = await gamificationApiService.resetAchievementsDev();
      void dispatch(fetchGamificationSummary());
      const { fetchHabitsToday } = await import('../habits/habitsSlice');
      void dispatch(fetchHabitsToday());
      return result.achievements;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to reset achievements'));
    }
  },
);

const gamificationSlice = createSlice({
  name: 'gamification',
  initialState,
  reducers: {
    clearGamification: (state) => {
      state.summary = null;
      state.achievements = [];
      state.goals = [];
      state.pendingAchievementUnlock = null;
      state.summaryError = null;
      state.achievementsError = null;
      state.goalsError = null;
      state.goalSaveError = null;
    },
    clearGamificationErrors: (state) => {
      state.summaryError = null;
      state.achievementsError = null;
      state.goalsError = null;
      state.goalSaveError = null;
    },
    /** show unlock toast after habit completion — cleared when toast dismisses */
    setPendingAchievementUnlock: (state, action: PayloadAction<AchievementItem>) => {
      state.pendingAchievementUnlock = action.payload;
    },
    clearPendingAchievementUnlock: (state) => {
      state.pendingAchievementUnlock = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGamificationSummary.pending, (state) => {
        state.isSummaryLoading = true;
        state.summaryError = null;
      })
      .addCase(fetchGamificationSummary.fulfilled, (state, action: PayloadAction<GamificationSummary>) => {
        state.isSummaryLoading = false;
        state.summary = action.payload;
      })
      .addCase(fetchGamificationSummary.rejected, (state, action) => {
        state.isSummaryLoading = false;
        state.summaryError = (action.payload as string) || 'Failed to load progress';
      })
      .addCase(fetchAchievements.pending, (state) => {
        state.isAchievementsLoading = true;
        state.achievementsError = null;
      })
      .addCase(fetchAchievements.fulfilled, (state, action: PayloadAction<AchievementItem[]>) => {
        state.isAchievementsLoading = false;
        state.achievements = action.payload;
      })
      .addCase(fetchAchievements.rejected, (state, action) => {
        state.isAchievementsLoading = false;
        state.achievementsError = (action.payload as string) || 'Failed to load achievements';
      })
      .addCase(fetchGoals.pending, (state) => {
        state.isGoalsLoading = true;
        state.goalsError = null;
      })
      .addCase(fetchGoals.fulfilled, (state, action: PayloadAction<UserGoalItem[]>) => {
        state.isGoalsLoading = false;
        state.goals = action.payload;
      })
      .addCase(fetchGoals.rejected, (state, action) => {
        state.isGoalsLoading = false;
        state.goalsError = (action.payload as string) || 'Failed to load goals';
      })
      .addCase(createGoal.pending, (state) => {
        state.isGoalSaving = true;
        state.goalSaveError = null;
      })
      .addCase(createGoal.fulfilled, (state, action: PayloadAction<UserGoalItem>) => {
        state.isGoalSaving = false;
        state.goals = [...state.goals, action.payload];
      })
      .addCase(createGoal.rejected, (state, action) => {
        state.isGoalSaving = false;
        state.goalSaveError = (action.payload as string) || 'Failed to create goal';
      })
      .addCase(deleteGoal.fulfilled, (state, action: PayloadAction<string>) => {
        state.goals = state.goals.filter((g) => g.id !== action.payload);
      })
      .addCase(resetAchievementsDev.pending, (state) => {
        state.isAchievementsLoading = true;
        state.achievementsError = null;
      })
      .addCase(resetAchievementsDev.fulfilled, (state, action: PayloadAction<AchievementItem[]>) => {
        state.isAchievementsLoading = false;
        state.achievements = action.payload;
        state.pendingAchievementUnlock = null;
      })
      .addCase(resetAchievementsDev.rejected, (state, action) => {
        state.isAchievementsLoading = false;
        state.achievementsError = (action.payload as string) || 'Failed to reset achievements';
      });
  },
});

export const { clearGamification, clearGamificationErrors, setPendingAchievementUnlock, clearPendingAchievementUnlock } = gamificationSlice.actions;
export { emptySummary };
export default gamificationSlice.reducer;
