/**
 * Activity Logs API Service
 *
 * Handles HTTP requests to the activity-logs endpoint on the Django backend.
 * This service is intentionally minimal - the log is read-only from the frontend.
 * Django creates log entries automatically when tasks are completed, updated, or deleted.
 *
 * Endpoint: GET /tasks/activity-logs/
 * Returns: array of ActivityLog objects, newest first
 */

import apiClient from './client';
import { ActivityLog } from '../../types/common/ActivityLog';

class ActivityLogsApiService {
  /**
   * Fetch all activity log entries for the current user.
   * The backend returns entries ordered by -created_at (newest first).
   * Authentication is handled automatically by apiClient (injects the auth token).
   */
  async fetchActivityLogs(params?: { action_type?: string }): Promise<ActivityLog[]> {
    try {
      // GET /tasks/activity-logs/ — optional action_type=completed for browse Completed screen only
      const response = await apiClient.get('/tasks/activity-logs/', { params });

      // Django REST Framework returns either an array directly or a paginated object with 'results'.
      // Handle both formats for robustness.
      if (Array.isArray(response.data)) {
        return response.data as ActivityLog[];
      }
      if (response.data?.results && Array.isArray(response.data.results)) {
        return response.data.results as ActivityLog[];
      }

      return [];
    } catch (error) {
      console.error('fetchActivityLogs failed:', error);
      throw error;
    }
  }
}

// export a singleton so every import shares the same instance
const activityLogsApiService = new ActivityLogsApiService();
export default activityLogsApiService;
