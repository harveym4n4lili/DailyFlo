/**
 * browse gamification board — copy per UI text slot (one block per line on screen).
 * matching typography slot: progressBoardText.ts — colors/spacing: progressBoardUiTokens.ts
 */

// —— streak section label ("STREAK") ——
export const PROGRESS_BOARD_STREAK_LABEL = 'Daily Streak';

// —— streak day counter (number + unit are separate Text nodes in the card) ——
export const PROGRESS_BOARD_STREAK_EMPTY_VALUE = '—';
export const PROGRESS_BOARD_STREAK_DAY_UNIT = 'day';
export const PROGRESS_BOARD_STREAK_DAYS_UNIT = 'days';

export function formatProgressBoardStreakNumber(streakDays: number): string {
  if (streakDays <= 0) {
    return PROGRESS_BOARD_STREAK_EMPTY_VALUE;
  }
  return String(streakDays);
}

/** null when streak is 0 — hide unit line */
export function getProgressBoardStreakUnitLabel(streakDays: number): string | null {
  if (streakDays <= 0) {
    return null;
  }
  return streakDays === 1 ? PROGRESS_BOARD_STREAK_DAY_UNIT : PROGRESS_BOARD_STREAK_DAYS_UNIT;
}

// —— longest streak (from API summary — computed from all completion logs) ——
export const PROGRESS_BOARD_LONGEST_STREAK_PREFIX = 'Longest: ';

export function formatProgressBoardLongestStreakLabel(longestDays: number): string {
  if (longestDays <= 0) {
    return `${PROGRESS_BOARD_LONGEST_STREAK_PREFIX}${PROGRESS_BOARD_STREAK_EMPTY_VALUE}`;
  }
  const unit = longestDays === 1 ? PROGRESS_BOARD_STREAK_DAY_UNIT : PROGRESS_BOARD_STREAK_DAYS_UNIT;
  return `${PROGRESS_BOARD_LONGEST_STREAK_PREFIX}${longestDays} ${unit}`;
}

/** voiceover when medal shows beside day/days — current streak matches or beats longest */
export const PROGRESS_BOARD_NEW_BEST_STREAK_ACCESSIBILITY_LABEL = 'New personal best streak';

/**
 * true when the user is on their longest-ever streak — show medal beside day/days.
 * longestStreak comes from GET /gamification/summary/ (recomputed from activity logs each fetch).
 */
export function isProgressBoardNewBestStreak(
  currentStreak: number,
  longestStreak: number
): boolean {
  return currentStreak > 0 && longestStreak > 0 && currentStreak >= longestStreak;
}

// —— streak empty-state hint ——
export const PROGRESS_BOARD_STREAK_EMPTY_HINT =
  'Complete a task today to start your streak';

// —— today's tasks section label ——
export const PROGRESS_BOARD_TODAYS_TASKS_LABEL = "Today's Tasks";

// —— today's completed task count (left side of "3/10") ——
export function formatProgressBoardTasksCompletedCount(completedToday: number): string {
  return completedToday.toLocaleString();
}

// —— goal suffix (right side of count, e.g. "/10") ——
export const PROGRESS_BOARD_GOAL_COUNT_SEPARATOR = '/';

export function formatProgressBoardTasksGoalSuffix(goal: number): string {
  return `${PROGRESS_BOARD_GOAL_COUNT_SEPARATOR}${goal.toLocaleString()}`;
}

// —— percent label (right side of count row) ——
export const PROGRESS_BOARD_PERCENT_SUFFIX = '%';

export function formatProgressBoardPercentValue(progressRatio: number): string {
  const clamped = Math.min(1, Math.max(0, progressRatio));
  return String(Math.round(clamped * 100));
}

export function formatProgressBoardPercentLabel(progressRatio: number): string {
  return `${formatProgressBoardPercentValue(progressRatio)}${PROGRESS_BOARD_PERCENT_SUFFIX}`;
}

// —— productivity nav row (opens browse productivity hub) ——
export const PROGRESS_BOARD_PRODUCTIVITY_LABEL = 'Productivity';
