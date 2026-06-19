/**
 * shared achievement unlock detection — used after task/habit completions.
 * snapshots prior unlock codes, refetches django evaluator, dispatches toast for first new unlock.
 */

import type { AppDispatch } from '@/store';
import type { UpdateTaskInput } from '@/types';
import type { AchievementItem } from '@/types/api/gamification';

import {
  fetchAchievements,
  fetchGamificationSummary,
  setPendingAchievementUnlock,
} from './gamificationSlice';

type GamificationSliceState = {
  gamification: {
    achievements: AchievementItem[];
    achievementsLoaded: boolean;
  };
};

/** load achievement catalog once per session so unlock diff has a real baseline */
export async function ensureAchievementsHydrated(
  dispatch: AppDispatch,
  getState: () => unknown,
): Promise<void> {
  const state = getState() as GamificationSliceState;
  if (state.gamification.achievementsLoaded) {
    return;
  }
  await dispatch(fetchAchievements());
}

/** codes already unlocked in redux before the completion api call */
export function collectPriorUnlockedCodes(getState: () => unknown): Set<string> {
  const state = getState() as GamificationSliceState;
  return new Set(
    state.gamification.achievements
      .filter((a) => a.unlockedAt != null)
      .map((a) => a.code),
  );
}

/**
 * hydrate achievements if needed, then snapshot prior unlock codes.
 * returns null when catalog could not be loaded — caller should skip toast detection.
 */
export async function collectPriorUnlockedCodesAfterHydrate(
  dispatch: AppDispatch,
  getState: () => unknown,
): Promise<Set<string> | null> {
  await ensureAchievementsHydrated(dispatch, getState);
  const state = getState() as GamificationSliceState;
  if (!state.gamification.achievementsLoaded) {
    return null;
  }
  return collectPriorUnlockedCodes(getState);
}

/** true when updateTask payload marks a task (or recurrence occurrence) newly complete */
export function isNewTaskCompletion(updates: UpdateTaskInput): boolean {
  // trust the patch intent — redux optimistic pending may already have flipped isCompleted
  if (updates.isCompleted === true) {
    return true;
  }
  if (updates.isCompleted === false) {
    return false;
  }

  // recurring occurrence complete sends metadata.recurrence_completions without isCompleted
  if (updates.metadata?.recurrence_completions != null) {
    return true;
  }

  return false;
}

/**
 * re-fetch summary + achievements from django, diff against prior codes, queue toast for first new unlock.
 */
export async function refreshAchievementsAndDetectUnlock(
  dispatch: AppDispatch,
  priorUnlockedCodes: Set<string>,
): Promise<void> {
  await dispatch(fetchGamificationSummary());
  const achievementsResult = await dispatch(fetchAchievements());

  if (fetchAchievements.fulfilled.match(achievementsResult)) {
    const newlyUnlocked = achievementsResult.payload
      .filter((a) => a.unlockedAt != null && !priorUnlockedCodes.has(a.code))
      .sort((a, b) => a.sortOrder - b.sortOrder);
    if (newlyUnlocked.length > 0) {
      dispatch(setPendingAchievementUnlock(newlyUnlocked[0]));
    }
  }
}
