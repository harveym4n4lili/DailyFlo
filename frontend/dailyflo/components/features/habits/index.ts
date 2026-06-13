/**
 * Habits feature barrel
 *
 * UI for habit tracking. Routes live under app/(tabs)/habits/.
 * Data: store/slices/habits + services/api/habits + types/api/habits.
 *
 * Folder layout:
 * - tab/     Habits navbar tab (today due list + summary)
 * - list/    Shared habit row (tab, today section, detail)
 * - detail/  Per-habit analytics (heatmap + trend)
 * - forms/   Create + edit modals
 * - today/   Habits block embedded on Today tab
 */

export { HabitsScreenContent, HabitsTodayList, HabitTabSummaryHeader } from './tab';
export { HabitListItem } from './list';
export { default as HabitCreateScreen } from './forms/HabitCreateScreen';
export { default as HabitEditScreen } from './forms/HabitEditScreen';
export { HABIT_COLORS, HABIT_FREQUENCIES, HABIT_WEEKDAYS } from './forms/habitFormConstants';
export { TodayHabitsSection } from './today';
