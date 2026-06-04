/**
 * achievements screen filter — shared between ios native picker and android pill fallback.
 */

export type AchievementListFilter = 'all' | 'completed';

export const ACHIEVEMENT_FILTER_OPTIONS = [
  { value: 'all' as const, label: 'All achievements' },
  { value: 'completed' as const, label: 'Completed' },
] as const;

export type AchievementFilterPickerProps = {
  value: AchievementListFilter;
  onValueChange: (value: AchievementListFilter) => void;
};
