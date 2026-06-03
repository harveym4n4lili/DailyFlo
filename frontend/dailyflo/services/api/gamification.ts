/**
 * Gamification API Service
 *
 * talks to django /gamification/ for streaks, stats, achievements, and user goals.
 * auth token is injected by apiClient on each request.
 */

import apiClient from './client';
import type {
  AchievementItem,
  CreateUserGoalInput,
  GamificationSummary,
  UpdateUserGoalInput,
  UserGoalItem,
} from '@/types/api/gamification';

class GamificationApiService {
  /** GET /gamification/summary/ — streak + today/week/month completion counts */
  async fetchSummary(): Promise<GamificationSummary> {
    const { data } = await apiClient.get<GamificationSummary>('/gamification/summary/');
    return data;
  }

  /** GET /gamification/achievements/ — full catalog with unlock state */
  async fetchAchievements(): Promise<AchievementItem[]> {
    const { data } = await apiClient.get<AchievementItem[]>('/gamification/achievements/');
    return Array.isArray(data) ? data : [];
  }

  /** GET /gamification/goals/ — active goals with computed progress */
  async fetchGoals(): Promise<UserGoalItem[]> {
    const { data } = await apiClient.get<UserGoalItem[]>('/gamification/goals/');
    return Array.isArray(data) ? data : [];
  }

  /** POST /gamification/goals/ — create a new goal (max 5 active) */
  async createGoal(input: CreateUserGoalInput): Promise<UserGoalItem> {
    const { data } = await apiClient.post<UserGoalItem>('/gamification/goals/', {
      title: input.title,
      goalType: input.goalType,
      targetCount: input.targetCount,
      period: input.period,
      linkedTaskId: input.linkedTaskId ?? null,
    });
    return data;
  }

  /** PATCH /gamification/goals/:id/ */
  async updateGoal(id: string, input: UpdateUserGoalInput): Promise<UserGoalItem> {
    const body: Record<string, unknown> = {};
    if (input.title !== undefined) body.title = input.title;
    if (input.goalType !== undefined) body.goalType = input.goalType;
    if (input.targetCount !== undefined) body.targetCount = input.targetCount;
    if (input.period !== undefined) body.period = input.period;
    if (input.linkedTaskId !== undefined) body.linkedTaskId = input.linkedTaskId;
    if (input.isActive !== undefined) body.isActive = input.isActive;
    const { data } = await apiClient.patch<UserGoalItem>(`/gamification/goals/${id}/`, body);
    return data;
  }

  /** DELETE /gamification/goals/:id/ — soft-deactivates on server */
  async deleteGoal(id: string): Promise<void> {
    await apiClient.delete(`/gamification/goals/${id}/`);
  }
}

const gamificationApiService = new GamificationApiService();
export default gamificationApiService;
