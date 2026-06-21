/**
 * habit increment ring — instant local UI on every tap, API syncs in background immediately.
 * no debounce delay: redux mirrors local state right away; backend runs async without blocking.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import { store, useAppDispatch, useAppSelector } from '@/store';
import {
  logHabitProgress,
  revertOptimisticLog,
  setTodayHabitProgress,
} from '@/store/slices/habits/habitsSlice';
import type { HabitHeatmapData, HabitTodayItem } from '@/types/api/habits';
import {
  applyHabitIncrementWithHeatmap,
  habitTodayProgressMatches,
} from '@/utils/habitIncrementLogic';
import {
  registerPendingHabitIncrementSync,
  unregisterPendingHabitIncrementSync,
} from '@/utils/pendingHabitIncrementSyncRegistry';

function readTodayHabit(habitId: string): HabitTodayItem | undefined {
  return store.getState().habits.todayHabits.find((row) => row.id === habitId);
}

export type HabitIncrementPressOptions = {
  /** when habit.heatmap is missing, patch this copy instead (detail screen stats heatmap) */
  heatmapBase?: HabitHeatmapData;
};

export type HabitIncrementPressResult = {
  handleIncrement: () => void;
  /** read ring/score from this — includes local taps not yet synced to redux */
  displayHabit: HabitTodayItem | undefined;
};

export function useHabitIncrementPress(
  habit: HabitTodayItem | undefined,
  options?: HabitIncrementPressOptions,
): HabitIncrementPressResult {
  const dispatch = useAppDispatch();
  const todayDate = useAppSelector((state) => state.habits.todayDate);

  const [optimisticHabit, setOptimisticHabit] = useState<HabitTodayItem | null>(null);
  const displayHabit = optimisticHabit ?? habit;

  const habitRef = useRef(habit);
  habitRef.current = habit;

  // updated synchronously on each tap so rapid taps chain before react re-renders
  const pendingLocalRef = useRef<HabitTodayItem | null>(null);

  const burstSnapshotRef = useRef<HabitTodayItem | null>(null);
  const pendingDeltaRef = useRef(0);
  const pendingToggleCountRef = useRef(0);
  const isSyncingRef = useRef(false);
  const needsResyncRef = useRef(false);
  const habitIdRef = useRef(habit?.id);
  const flushSyncRef = useRef<(() => void) | null>(null);

  const heatmapBaseRef = useRef(options?.heatmapBase);
  heatmapBaseRef.current = options?.heatmapBase;

  const applyLocalIncrement = useCallback(
    (base: HabitTodayItem) => {
      const heatmapSource = heatmapBaseRef.current ?? base.heatmap;
      const withHeatmap = heatmapSource ? { ...base, heatmap: heatmapSource } : base;
      return applyHabitIncrementWithHeatmap(withHeatmap, todayDate, 1);
    },
    [todayDate],
  );

  const clearLocalOverlay = useCallback(() => {
    pendingLocalRef.current = null;
    setOptimisticHabit(null);
  }, []);

  useEffect(() => {
    if (optimisticHabit && habit && habitTodayProgressMatches(optimisticHabit, habit)) {
      clearLocalOverlay();
    }
  }, [habit, optimisticHabit, clearLocalOverlay]);

  useEffect(() => {
    if (habitIdRef.current !== habit?.id) {
      habitIdRef.current = habit?.id;
      clearLocalOverlay();
      burstSnapshotRef.current = null;
      pendingDeltaRef.current = 0;
      pendingToggleCountRef.current = 0;
    }
  }, [habit?.id, clearLocalOverlay]);

  const runSync = useCallback(async () => {
    if (isSyncingRef.current) {
      needsResyncRef.current = true;
      return;
    }

    const snapshot = burstSnapshotRef.current;
    const deltaBatch = pendingDeltaRef.current;
    const toggleBatch = pendingToggleCountRef.current;
    const finalLocal = pendingLocalRef.current;

    if (!snapshot || !finalLocal || (deltaBatch <= 0 && toggleBatch <= 0)) {
      return;
    }

    pendingDeltaRef.current = 0;
    pendingToggleCountRef.current = 0;
    burstSnapshotRef.current = null;
    isSyncingRef.current = true;

    try {
      if (snapshot.trackingType === 'binary') {
        for (let i = 0; i < toggleBatch; i += 1) {
          await dispatch(
            logHabitProgress({
              id: snapshot.id,
              delta: 1,
              wasCompleteBefore: i === 0 ? snapshot.isCompleteToday : undefined,
            }),
          ).unwrap();
        }
      } else {
        await dispatch(
          logHabitProgress({
            id: snapshot.id,
            delta: deltaBatch,
            wasCompleteBefore: snapshot.isCompleteToday,
          }),
        ).unwrap();
      }
    } catch {
      dispatch(revertOptimisticLog({ id: snapshot.id, snapshot }));
      clearLocalOverlay();
    } finally {
      isSyncingRef.current = false;
      if (needsResyncRef.current) {
        needsResyncRef.current = false;
        void runSync();
      } else if (
        pendingDeltaRef.current === 0 &&
        pendingToggleCountRef.current === 0 &&
        flushSyncRef.current
      ) {
        unregisterPendingHabitIncrementSync(flushSyncRef.current);
      }
    }
  }, [dispatch, clearLocalOverlay]);

  useEffect(() => {
    flushSyncRef.current = () => {
      void runSync();
    };
  }, [runSync]);

  useEffect(
    () => () => {
      if (flushSyncRef.current) {
        registerPendingHabitIncrementSync(flushSyncRef.current);
        void runSync();
      }
    },
    [runSync],
  );

  const handleIncrement = useCallback(() => {
    const baseHabit = habitRef.current;
    if (!baseHabit) return;

    const hasPendingBatch =
      pendingDeltaRef.current > 0 ||
      pendingToggleCountRef.current > 0 ||
      burstSnapshotRef.current != null;

    if (!hasPendingBatch) {
      const fromStore = readTodayHabit(baseHabit.id);
      burstSnapshotRef.current = { ...(fromStore ?? baseHabit) };
    }

    const next = applyLocalIncrement(pendingLocalRef.current ?? baseHabit);
    pendingLocalRef.current = next;

    // instant UI + redux — no timer before these run
    setOptimisticHabit(next);
    dispatch(setTodayHabitProgress({ id: next.id, habit: next }));

    if (baseHabit.trackingType === 'binary') {
      pendingToggleCountRef.current += 1;
    } else {
      pendingDeltaRef.current += 1;
    }

    if (flushSyncRef.current) {
      registerPendingHabitIncrementSync(flushSyncRef.current);
    }

    // kick off API in background immediately (does not block the tap handler)
    void runSync();
  }, [applyLocalIncrement, dispatch, runSync]);

  return { handleIncrement, displayHabit };
}
