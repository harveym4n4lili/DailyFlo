/**
 * ActivityLog Types
 *
 * These types describe the shape of an activity log entry in our app.
 * The backend sends camelCase JSON (converted by ActivityLogSerializer)
 * so these match 1-to-1 with what the API returns.
 */

// the four actions that get recorded in the log
export type ActionType = 'created' | 'completed' | 'updated' | 'deleted';

export interface ActivityLog {
  // unique ID of the log entry itself (UUID)
  id: string;

  // ID of the task this log entry refers to.
  // can be null if the task was hard-deleted (extremely rare - we use soft-delete)
  taskId: string | null;

  // what happened to the task
  actionType: ActionType;

  // snapshot of the task title at the moment the action happened.
  // stored so deleted tasks still display a readable name in the log
  taskTitle: string;

  // for recurring tasks: the specific date occurrence that was completed (YYYY-MM-DD).
  // null for non-recurring tasks or update/delete actions
  occurrenceDate: string | null;

  // ISO timestamp when this log entry was created - used for date grouping in the UI
  createdAt: string;
}
