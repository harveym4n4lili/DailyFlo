/**
 * Habits API Service
 *
 * talks to django /habits/ for CRUD, today's due list, and daily log toggles.
 * auth token is injected by apiClient on each request.
 */

import apiClient from './client';
import type {
  CreateHabitInput,
  Habit,
  HabitLogResponse,
  HabitsTodayResponse,
  HabitStatsResponse,
  UpdateHabitInput,
} from '@/types/api/habits';

class HabitsApiService {
  /** GET /habits/ — all active habits for the signed-in user */
  async fetchHabits(): Promise<Habit[]> {
    const { data } = await apiClient.get<Habit[]>('/habits/');
    return Array.isArray(data) ? data : [];
  }

  /** GET /habits/today/ — habits due today with completion + streak fields */
  async fetchHabitsToday(): Promise<HabitsTodayResponse> {
    const { data } = await apiClient.get<HabitsTodayResponse>('/habits/today/');
    return data;
  }

  /** POST /habits/ — create a new habit */
  async createHabit(input: CreateHabitInput): Promise<Habit> {
    const { data } = await apiClient.post<Habit>('/habits/', input);
    return data;
  }

  /** GET /habits/:id/ — single habit for detail / edit */
  async fetchHabit(id: string): Promise<Habit> {
    const { data } = await apiClient.get<Habit>(`/habits/${id}/`);
    return data;
  }

  /** GET /habits/:id/stats/ — heatmap + 30-day trend + streaks */
  async fetchHabitStats(id: string): Promise<HabitStatsResponse> {
    const { data } = await apiClient.get<HabitStatsResponse>(`/habits/${id}/stats/`);
    return data;
  }

  /** PATCH /habits/:id/ */
  async updateHabit(id: string, input: UpdateHabitInput): Promise<Habit> {
    const { data } = await apiClient.patch<Habit>(`/habits/${id}/`, input);
    return data;
  }

  /** DELETE /habits/:id/ — soft delete on server */
  async deleteHabit(id: string): Promise<void> {
    await apiClient.delete(`/habits/${id}/`);
  }

  /** POST /habits/:id/log/ — binary toggle or numeric +delta */
  async logHabitProgress(
    id: string,
    options?: { date?: string; delta?: number },
  ): Promise<HabitLogResponse> {
    const { data } = await apiClient.post<HabitLogResponse>(`/habits/${id}/log/`, options ?? {});
    return data;
  }

  /** DELETE /habits/:id/log/?date= — undo completion for a calendar day */
  async undoHabitLog(id: string, date: string): Promise<HabitLogResponse> {
    const { data } = await apiClient.delete<HabitLogResponse>(`/habits/${id}/log/`, {
      params: { date },
    });
    return data;
  }
}

const habitsApiService = new HabitsApiService();
export default habitsApiService;
