/**
 * Habits Slice — Redux state for today's habits list and CRUD.
 *
 * data comes from GET /habits/today/ on django; habits tab + today section dispatch fetchHabitsToday on focus.
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import habitsApiService from '@/services/api/habits';
import {
  cancelHabitReminders,
  syncAllHabitRemindersFromToday,
  syncHabitReminder,
} from '@/services/notifications/habitReminderScheduler';
import type { User } from '@/types';
import type {
  CreateHabitInput,
  Habit,
  HabitHeatmapData,
  HabitLogResponse,
  HabitStatsResponse,
  HabitTodayItem,
  HabitsTodayResponse,
  HabitsTodaySummary,
  UpdateHabitInput,
} from '@/types/api/habits';
import {
  applyHabitIncrementWithHeatmap,
  patchHabitHeatmapForToday,
} from '@/utils/habitIncrementLogic';

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
  const err = error as {
    response?: { data?: Record<string, unknown> | string };
    message?: string;
    code?: string;
  };
  const data = err?.response?.data;
  if (typeof data === 'string' && data.trim()) return data;
  if (data && typeof data === 'object') {
    if (typeof data.detail === 'string' && data.detail.trim()) return data.detail;
    const parts = Object.entries(data).flatMap(([key, val]) => {
      if (Array.isArray(val)) return val.map((m) => `${key}: ${String(m)}`);
      if (typeof val === 'string') return [`${key}: ${val}`];
      return [];
    });
    if (parts.length > 0) return parts.join('\n');
  }
  if (err?.code === 'ECONNABORTED' || err?.message?.includes('Network Error')) {
    return 'Could not reach the server. Check Wi‑Fi and that this device can reach the API URL.';
  }
  return err?.message || fallback;
}

/** read signed-in user notification prefs — same gate as task reminders */
function getNotificationPrefsFromAuthState(getState: () => unknown) {
  return (getState() as { auth: Readonly<{ user: User | null }> }).auth.user?.preferences?.notifications;
}

async function scheduleRemindersAfterTodayFetch(
  payload: HabitsTodayResponse,
  getState: () => unknown,
): Promise<void> {
  try {
    await syncAllHabitRemindersFromToday(payload, getNotificationPrefsFromAuthState(getState));
  } catch (err) {
    console.warn('[notifications] habit reminder bulk sync skipped', err);
  }
}

async function scheduleReminderForHabitAfterSave(
  habitId: string,
  reminderTime: string,
  getState: () => unknown,
  dispatch: (action: unknown) => unknown,
): Promise<void> {
  if (!reminderTime?.trim()) {
    await cancelHabitReminders(habitId);
    return;
  }
  const todayResult = await dispatch(fetchHabitsToday());
  if (!fetchHabitsToday.fulfilled.match(todayResult)) return;
  const todayItem = todayResult.payload.habits.find((h) => h.id === habitId);
  if (!todayItem) {
    await cancelHabitReminders(habitId);
    return;
  }
  try {
    await syncHabitReminder(
      { ...todayItem, reminderTime },
      todayResult.payload.date,
      getNotificationPrefsFromAuthState(getState),
    );
  } catch (err) {
    console.warn('[notifications] habit reminder sync skipped', habitId, err);
  }
}

/** load habits due today — used by habits tab and today section */
export const fetchHabitsToday = createAsyncThunk(
  'habits/fetchToday',
  async (_, { rejectWithValue, getState }) => {
    try {
      const payload = await habitsApiService.fetchHabitsToday();
      await scheduleRemindersAfterTodayFetch(payload, getState);
      return payload;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to load habits'));
    }
  },
);

/** POST /habits/ — create from FAB or onboarding */
export const createHabit = createAsyncThunk(
  'habits/create',
  async (input: CreateHabitInput, { rejectWithValue, dispatch, getState }) => {
    try {
      const habit = await habitsApiService.createHabit(input);
      await scheduleReminderForHabitAfterSave(habit.id, habit.reminderTime ?? '', getState, dispatch);
      // refresh today's list so the new habit appears when the create modal closes
      await dispatch(fetchHabitsToday());
      return habit;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to create habit'));
    }
  },
);

export const updateHabit = createAsyncThunk(
  'habits/update',
  async ({ id, input }: { id: string; input: UpdateHabitInput }, { rejectWithValue, dispatch, getState }) => {
    try {
      const habit = await habitsApiService.updateHabit(id, input);
      await scheduleReminderForHabitAfterSave(habit.id, habit.reminderTime ?? '', getState, dispatch);
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
      await cancelHabitReminders(id);
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
    {
      id,
      date,
      delta,
      wasCompleteBefore,
    }: { id: string; date?: string; delta?: number; wasCompleteBefore?: boolean },
    { rejectWithValue, dispatch, getState },
  ) => {
    try {
      const { collectPriorUnlockedCodesAfterHydrate, refreshAchievementsAndDetectUnlock } = await import(
        '../gamification/achievementUnlockDetection'
      );
      const priorUnlockedCodes = await collectPriorUnlockedCodesAfterHydrate(dispatch, getState);

      const response = await habitsApiService.logHabitProgress(id, { date, delta });
      const wasComplete = wasCompleteBefore ?? false;

      if (response.isCompleteToday && !wasComplete && priorUnlockedCodes) {
        try {
          await refreshAchievementsAndDetectUnlock(dispatch, priorUnlockedCodes);
        } catch (err) {
          console.warn('[habits] achievement unlock refresh skipped after log', err);
        }
      }

      const stateAfter = getState() as { habits: HabitsState };
      const todayDate = stateAfter.habits.todayDate;
      const todayHabit = stateAfter.habits.todayHabits.find((h) => h.id === id);
      if (todayDate && todayHabit) {
        try {
          if (response.isCompleteToday) {
            await cancelHabitReminders(id);
          } else {
            await syncHabitReminder(
              { ...todayHabit, isCompleteToday: false },
              todayDate,
              getNotificationPrefsFromAuthState(getState),
            );
          }
        } catch (err) {
          console.warn('[notifications] habit reminder log sync skipped', id, err);
        }
      }

      return { habitId: id, response };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to log habit'));
    }
  },
);

/** sync today's heatmap cell on detail stats when board row updates */
function patchDetailStatsHeatmapForToday(
  heatmap: HabitHeatmapData,
  dayIso: string,
  habit: HabitTodayItem,
): HabitHeatmapData {
  return patchHabitHeatmapForToday(heatmap, dayIso, habit) ?? heatmap;
}

function mergeTodayHabitWithLocal(local: HabitTodayItem, incoming: HabitTodayItem): HabitTodayItem {
  if (local.trackingType === 'numeric') {
    const target = incoming.targetValue ?? 1;
    const localLogged = local.loggedValue ?? 0;
    const incomingLogged = incoming.loggedValue ?? 0;
    const localIsReset =
      localLogged === 0 && !local.isCompleteToday && incoming.isCompleteToday;
    const localIsAhead =
      localLogged > incomingLogged ||
      (local.isCompleteToday && !incoming.isCompleteToday);

    if (localIsReset || localIsAhead) {
      return {
        ...incoming,
        loggedValue: localLogged,
        isCompleteToday: local.isCompleteToday,
        heatmap: local.heatmap,
        currentStreak: Math.max(local.currentStreak, incoming.currentStreak),
        longestStreak: Math.max(local.longestStreak, incoming.longestStreak),
      };
    }

    const loggedValue = Math.max(localLogged, incomingLogged);
    const isCompleteToday =
      incoming.isCompleteToday || local.isCompleteToday || loggedValue >= target;
    return {
      ...incoming,
      loggedValue: isCompleteToday ? Math.max(loggedValue, target) : loggedValue,
      isCompleteToday,
      currentStreak: Math.max(local.currentStreak, incoming.currentStreak),
      longestStreak: Math.max(local.longestStreak, incoming.longestStreak),
    };
  }
  if (local.isCompleteToday && !incoming.isCompleteToday) {
    return { ...incoming, isCompleteToday: true, loggedValue: 1 };
  }
  return incoming;
}

function applyTodayPayload(state: HabitsState, payload: HabitsTodayResponse) {
  const sameDay = state.todayDate === payload.date;
  const localById =
    sameDay && state.todayHabits.length > 0
      ? new Map(state.todayHabits.map((h) => [h.id, h]))
      : null;

  state.todayDate = payload.date;
  state.todayHabits = payload.habits.map((incoming) => {
    const local = localById?.get(incoming.id);
    return local ? mergeTodayHabitWithLocal(local, incoming) : incoming;
  });
  state.todaySummary = payload.summary;
  if (state.todaySummary) {
    state.todaySummary.completedCount = state.todayHabits.filter((h) => h.isCompleteToday).length;
    state.todaySummary.bestActiveStreak = Math.max(
      ...state.todayHabits.map((h) => h.currentStreak),
      0,
    );
  }
}

function applyLogToHabit(state: HabitsState, habitId: string, response: HabitLogResponse) {
  const idx = state.todayHabits.findIndex((h) => h.id === habitId);
  if (idx === -1) return;
  const local = state.todayHabits[idx];
  const target = local.targetValue ?? 1;
  let loggedValue = response.loggedValue;
  if (local.trackingType === 'numeric' && response.isCompleteToday) {
    loggedValue = Math.max(loggedValue, target);
  }
  const incoming: HabitTodayItem = {
    ...local,
    loggedValue,
    isCompleteToday: response.isCompleteToday,
    currentStreak: response.currentStreak,
    longestStreak: response.longestStreak,
    heatmap: response.heatmap ?? local.heatmap,
  };
  state.todayHabits[idx] = mergeTodayHabitWithLocal(local, incoming);
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
    /** legacy per-tap redux bump — prefer setTodayHabitProgress from debounced hook sync */
    optimisticLogHabit(state, action: PayloadAction<{ id: string; delta?: number }>) {
      const idx = state.todayHabits.findIndex((h) => h.id === action.payload.id);
      if (idx === -1) return;
      const updated = applyHabitIncrementWithHeatmap(
        state.todayHabits[idx],
        state.todayDate,
        action.payload.delta ?? 1,
      );
      state.todayHabits[idx] = updated;
      if (
        state.detailStats &&
        state.detailHabit?.id === action.payload.id &&
        state.todayDate
      ) {
        state.detailStats.heatmap = patchDetailStatsHeatmapForToday(
          state.detailStats.heatmap,
          state.todayDate,
          updated,
        );
      }
      if (state.todaySummary) {
        state.todaySummary.completedCount = state.todayHabits.filter((h) => h.isCompleteToday).length;
      }
    },
    /** apply debounced local overlay to redux before API — mirrors updateTask.pending */
    setTodayHabitProgress(
      state,
      action: PayloadAction<{ id: string; habit: HabitTodayItem }>,
    ) {
      const idx = state.todayHabits.findIndex((h) => h.id === action.payload.id);
      if (idx === -1) return;
      state.todayHabits[idx] = action.payload.habit;
      if (
        state.detailStats &&
        state.detailHabit?.id === action.payload.id &&
        state.todayDate
      ) {
        state.detailStats.heatmap = patchDetailStatsHeatmapForToday(
          state.detailStats.heatmap,
          state.todayDate,
          action.payload.habit,
        );
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
      if (
        state.detailStats &&
        state.detailHabit?.id === action.payload.id &&
        action.payload.snapshot.heatmap
      ) {
        state.detailStats.heatmap = action.payload.snapshot.heatmap;
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
          const local = state.todayHabits.find((h) => h.id === action.payload.habitId);
          state.detailStats.currentStreak = Math.max(
            local?.currentStreak ?? 0,
            action.payload.response.currentStreak,
          );
          state.detailStats.longestStreak = Math.max(
            local?.longestStreak ?? 0,
            action.payload.response.longestStreak,
          );
          if (local?.heatmap) {
            state.detailStats.heatmap = local.heatmap;
          } else if (action.payload.response.heatmap) {
            state.detailStats.heatmap = action.payload.response.heatmap;
          }
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

export const {
  clearHabits,
  clearHabitDetail,
  optimisticLogHabit,
  setTodayHabitProgress,
  revertOptimisticLog,
} = habitsSlice.actions;
export default habitsSlice.reducer;
