/**
 * Gamification feature barrel
 *
 * UI for streaks, achievements, and goals. Routes live under app/(tabs)/browse/.
 * Data: store/slices/gamification + services/api/gamification + types/api/gamification.
 */

export { BrowseProgressCard } from './browse/BrowseProgressCard';
export type { BrowseProgressCardProps } from './browse/BrowseProgressCard';

export { AchievementListItem } from './achievements/AchievementListItem';
export type { AchievementListItemProps } from './achievements/AchievementListItem';
export { AchievementsScreenContent } from './achievements/AchievementsScreenContent';

export { GoalListItem } from './goals/GoalListItem';
export type { GoalListItemProps } from './goals/GoalListItem';
export { GoalsScreenContent } from './goals/GoalsScreenContent';
export { default as GoalCreateScreen } from './goals/GoalCreateScreen';

export { ProductivityScreenContent } from './productivity/ProductivityScreenContent';

export { computeTodayTaskGoal, localTodayDateStr } from './utils/computeTodayTaskGoal';
