/**
 * gamification API types — match GET /gamification/* camelCase responses from django.
 */

export interface GamificationSummary {
  completionsToday: number;
  completionsThisWeek: number;
  completionsThisMonth: number;
  currentStreak: number;
  longestStreak: number;
  lastCompletionDate: string | null;
  goalsOnTrack: number;
  goalsTotal: number;
  unlockedAchievementCount: number;
}

export interface AchievementItem {
  id: string;
  code: string;
  title: string;
  description: string;
  iconKey: string;
  sortOrder: number;
  unlockedAt: string | null;
  progressLabel: string | null;
}

export interface UserGoalItem {
  id: string;
  title: string;
  goalType: 'task_count' | 'linked_task';
  targetCount: number;
  currentCount: number;
  period: 'daily' | 'weekly' | 'monthly';
  periodLabel: string;
  linkedTaskId: string | null;
  isActive: boolean;
  isMet: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserGoalInput {
  title: string;
  goalType: 'task_count' | 'linked_task';
  targetCount: number;
  period: 'daily' | 'weekly' | 'monthly';
  linkedTaskId?: string | null;
}

export interface UpdateUserGoalInput {
  title?: string;
  goalType?: 'task_count' | 'linked_task';
  targetCount?: number;
  period?: 'daily' | 'weekly' | 'monthly';
  linkedTaskId?: string | null;
  isActive?: boolean;
}
