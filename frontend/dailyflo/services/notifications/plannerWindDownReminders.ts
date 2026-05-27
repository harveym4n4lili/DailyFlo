/**
 * schedules local os reminders for the planner "Wind Down" sleep anchor.
 * wind down is not a real backend task — we build one synthetic task per calendar day
 * so each day's 5-min-before alert gets its own expo notification id.
 */

import { Platform } from 'react-native';

import {
  buildPlannerWindDownReminderTask,
  isPlannerWindDownReminderTaskId,
  PLANNER_WIND_DOWN_REMINDER_LOOKAHEAD_DAYS,
} from '@/components/features/timeline/plannerScheduleAnchors';
import type { UserPreferences } from '@/types';
import { isValidWakeSleepHHMM } from '@/utils/preferenceScheduleTimes';
import { toLocalCalendarDayString } from '@/utils/recurrenceUtils';

import {
  areUserNotificationPrefsAllowed,
  canScheduleTaskReminders,
} from './taskReminderEligibility';
import { cancelTaskReminders, syncTaskReminders } from './taskReminderScheduler';
import { readTaskLocalNotificationMap } from './taskReminderStorage';

/** drop every scheduled wind-down reminder from storage + expo (before a full resync) */
export async function cancelPlannerWindDownReminders(): Promise<void> {
  const map = await readTaskLocalNotificationMap();
  const windDownTaskIds = Object.keys(map).filter(isPlannerWindDownReminderTaskId);
  await Promise.all(windDownTaskIds.map((taskId) => cancelTaskReminders(taskId)));
}

/**
 * rebuild wind-down reminders for today through the lookahead window.
 * called after tasks fetch and when wake/sleep schedule prefs change.
 */
export async function syncPlannerWindDownReminders(
  sleepHHMM: string | null | undefined,
  notificationPrefs: UserPreferences['notifications'] | undefined,
): Promise<void> {
  if (Platform.OS === 'web') return;

  await cancelPlannerWindDownReminders();

  const sleep = sleepHHMM?.trim() ?? '';
  if (!isValidWakeSleepHHMM(sleep)) return;

  if (!areUserNotificationPrefsAllowed(notificationPrefs)) return;

  const allowed = await canScheduleTaskReminders(notificationPrefs, { requestIfNeeded: true });
  if (!allowed) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let dayOffset = 0; dayOffset < PLANNER_WIND_DOWN_REMINDER_LOOKAHEAD_DAYS; dayOffset += 1) {
    const day = new Date(today);
    day.setDate(today.getDate() + dayOffset);
    const dateStr = toLocalCalendarDayString(day);
    const task = buildPlannerWindDownReminderTask(sleep, dateStr);

    try {
      await syncTaskReminders(task, notificationPrefs);
    } catch (err) {
      console.warn('[notifications] wind-down reminder sync skipped', dateStr, err);
    }
  }
}
