/**
 * gates whether we schedule a local task reminder — os permission, profile prefs, task shape.
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { Task, UserPreferences } from '@/types';

import { requestAppNotificationPermission } from './requestNotificationPermission';

/** timed, active tasks only — all-day (no `time`) skips v1 */
export function isTaskEligibleForLocalReminder(task: Task): boolean {
  return (
    !task.isCompleted &&
    !task.softDeleted &&
    Boolean(task.dueDate) &&
    Boolean(task.time?.trim())
  );
}

/** reads django-synced notification toggles on the signed-in user */
export function areUserNotificationPrefsAllowed(
  prefs: UserPreferences['notifications'] | undefined,
): boolean {
  if (!prefs) return true;
  if (prefs.enabled === false) return false;
  if (prefs.dueDateReminders === false) return false;
  return true;
}

/** os permission + user prefs — may prompt once when scheduling if os never asked yet */
export async function canScheduleTaskReminders(
  prefs: UserPreferences['notifications'] | undefined,
  options?: { requestIfNeeded?: boolean },
): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  if (!areUserNotificationPrefsAllowed(prefs)) return false;

  const current = await Notifications.getPermissionsAsync();
  if (current.status === 'granted') return true;

  // first task save after install — os may still be undetermined if user skipped onboarding notifications
  if (options?.requestIfNeeded && current.canAskAgain !== false) {
    const result = await requestAppNotificationPermission();
    return result.outcome === 'granted';
  }

  return false;
}
