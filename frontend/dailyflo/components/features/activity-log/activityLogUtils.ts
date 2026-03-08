/**
 * Activity Log Utilities
 *
 * Pure helper functions for grouping, formatting, and styling activity logs.
 * Keeps logic out of components for easier testing and reuse.
 */

import { ActivityLog, ActionType } from '@/types/common/ActivityLog';

/**
 * Converts an ISO timestamp string into a plain YYYY-MM-DD local date string.
 * Used as the group key so all entries from the same local day land in one section.
 */
export function toLocalDateKey(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-CA'); // returns YYYY-MM-DD
}

/**
 * Formats a YYYY-MM-DD key into a human-readable section header.
 * Matches ListCard GroupHeader format: "8 Mar, Sunday" (day + short month + weekday).
 */
export function formatDateHeader(dateKey: string): string {
  const date = new Date(dateKey + 'T00:00:00');
  const day = date.getDate();
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
  return `${day} ${month}, ${dayOfWeek}`;
}

/**
 * Groups a flat array of logs into an ordered array of { dateKey, entries } sections.
 * The first section is the most recent date (logs arrive newest-first from the API).
 */
export function groupLogsByDate(
  logs: ActivityLog[]
): { dateKey: string; entries: ActivityLog[] }[] {
  const map = new Map<string, ActivityLog[]>();

  for (const log of logs) {
    const key = toLocalDateKey(log.createdAt);
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key)!.push(log);
  }

  return Array.from(map.entries()).map(([dateKey, entries]) => ({
    dateKey,
    entries,
  }));
}

/**
 * Returns a short human-readable label for each action type.
 */
export function getActionLabel(type: ActionType): string {
  switch (type) {
    case 'created':
      return 'Created';
    case 'completed':
      return 'Completed';
    case 'updated':
      return 'Updated';
    case 'deleted':
      return 'Deleted';
  }
}

/**
 * Returns a dynamic message for each action type (e.g. "You updated a task").
 * Shown above the task title in LogCard.
 */
export function getActionMessage(type: ActionType): string {
  switch (type) {
    case 'created':
      return 'You created a task';
    case 'completed':
      return 'You completed a task';
    case 'updated':
      return 'You updated a task';
    case 'deleted':
      return 'You deleted a task';
  }
}

/**
 * Returns the accent colour for each action type (icon tint).
 * Uses consistent brand colours regardless of theme.
 */
export function getActionAccentColor(type: ActionType): string {
  switch (type) {
    case 'created':
      return '#34C759'; // iOS green (same as completed - positive action)
    case 'completed':
      return '#34C759'; // iOS green
    case 'updated':
      return '#007AFF'; // iOS blue
    case 'deleted':
      return '#FF3B30'; // iOS red
  }
}

/**
 * Returns the SF Symbol name for each action type (used in LogCard).
 * Matches app icon sizing (20pt) used elsewhere (TaskScreen actions, SelectionActionsBar).
 */
export function getActionSFSymbol(type: ActionType): string {
  switch (type) {
    case 'created':
      return 'plus.circle.fill';
    case 'completed':
      return 'checkmark.circle.fill';
    case 'updated':
      return 'square.and.pencil';
    case 'deleted':
      return 'trash.fill';
  }
}

/**
 * Returns the Ionicons fallback name for each action type (Android/Web).
 */
export function getActionFallbackIcon(type: ActionType): string {
  switch (type) {
    case 'created':
      return 'add-circle';
    case 'completed':
      return 'checkmark-circle';
    case 'updated':
      return 'create-outline';
    case 'deleted':
      return 'trash';
  }
}
