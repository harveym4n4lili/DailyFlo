/**
 * schedules / cancels local expo notifications for habits due today with reminderTime set.
 * mirrors taskReminderScheduler — one daily fire per habit on due days only.
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { HabitTodayItem, HabitsTodayResponse } from '@/types/api/habits';
import type { UserPreferences } from '@/types';

import { ANDROID_DEFAULT_CHANNEL_ID, ensureAndroidNotificationChannel } from './notificationsSetup';
import { getNotificationPermissionSnapshot } from './requestNotificationPermission';
import {
  buildHabitReminderNotificationId,
  HABIT_REMINDER_NOTIFICATION_ID_PREFIX,
} from './habitReminderConstants';
import { formatHabitReminderBody } from './habitReminderCopy';
import {
  clearHabitLocalNotificationMap,
  readHabitLocalNotificationMap,
  writeHabitLocalNotificationMap,
} from './habitReminderStorage';
import {
  areUserNotificationPrefsAllowed,
  canScheduleTaskReminders,
} from './taskReminderEligibility';

export type HabitReminderSyncItem = Pick<
  HabitTodayItem,
  'id' | 'title' | 'isCompleteToday' | 'reminderTime'
>;

/** combine calendar date YYYY-MM-DD + HH:MM into local fire Date */
export function buildHabitReminderFireDate(calendarDate: string, reminderHHMM: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(calendarDate.trim());
  const timeMatch = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(reminderHHMM.trim());
  if (!match || !timeMatch) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const hours = Number(timeMatch[1]);
  const minutes = Number(timeMatch[2]);
  return new Date(year, month, day, hours, minutes, 0, 0);
}

async function cancelNotificationId(identifier: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch {
    // stale map entry — safe to ignore
  }
}

/** remove scheduled reminder for one habit */
export async function cancelHabitReminders(habitId: string): Promise<void> {
  const map = await readHabitLocalNotificationMap();
  const identifier = map[habitId];
  if (identifier) {
    await cancelNotificationId(identifier);
    delete map[habitId];
    await writeHabitLocalNotificationMap(map);
  }
}

/** logout — cancel every dailyflo habit notification + clear storage map */
export async function cancelAllHabitReminders(): Promise<void> {
  const map = await readHabitLocalNotificationMap();
  const ids = new Set(Object.values(map));

  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    scheduled.forEach((req) => {
      if (req.identifier.startsWith(HABIT_REMINDER_NOTIFICATION_ID_PREFIX)) {
        ids.add(req.identifier);
      }
    });
  } catch {
    // best-effort sweep
  }

  await Promise.all([...ids].map((id) => cancelNotificationId(id)));
  await clearHabitLocalNotificationMap();
}

/**
 * schedule today's habit reminder when reminderTime is set, habit is due, and not complete.
 * non-throwing — habit CRUD must succeed even if expo schedule fails.
 */
export async function syncHabitReminder(
  habit: HabitReminderSyncItem,
  todayDate: string,
  notificationPrefs: UserPreferences['notifications'] | undefined,
): Promise<void> {
  if (Platform.OS === 'web') return;

  await cancelHabitReminders(habit.id);

  const reminderTime = habit.reminderTime?.trim();
  if (!reminderTime) return;
  if (habit.isCompleteToday) return;

  if (!areUserNotificationPrefsAllowed(notificationPrefs)) return;

  const allowed = await canScheduleTaskReminders(notificationPrefs, { requestIfNeeded: true });
  if (!allowed) {
    if (__DEV__) {
      const { outcome } = await getNotificationPermissionSnapshot();
      console.warn('[notifications] habit reminder skipped — permission', { habitId: habit.id, outcome });
    }
    return;
  }

  const fireDate = buildHabitReminderFireDate(todayDate, reminderTime);
  if (!fireDate || fireDate.getTime() <= Date.now()) {
    if (__DEV__) {
      console.warn('[notifications] habit reminder skipped — fire time passed', {
        habitId: habit.id,
        todayDate,
        reminderTime,
      });
    }
    return;
  }

  await ensureAndroidNotificationChannel();
  const identifier = buildHabitReminderNotificationId(habit.id);
  const trigger: Notifications.DateTriggerInput = {
    type: Notifications.SchedulableTriggerInputTypes.DATE,
    date: fireDate,
  };
  if (Platform.OS === 'android') {
    trigger.channelId = ANDROID_DEFAULT_CHANNEL_ID;
  }

  try {
    await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title: 'DailyFlo',
        body: formatHabitReminderBody(habit.title),
        sound: true,
        data: {
          type: 'habit_reminder',
          habitId: habit.id,
          reminderDate: todayDate,
        },
      },
      trigger,
    });

    const map = await readHabitLocalNotificationMap();
    map[habit.id] = identifier;
    await writeHabitLocalNotificationMap(map);

    if (__DEV__) {
      console.log('[notifications] habit reminder scheduled', {
        habitId: habit.id,
        fireAt: fireDate.toISOString(),
      });
    }
  } catch (err) {
    console.warn('[notifications] schedule habit reminder failed', habit.id, err);
  }
}

/** after fetchHabitsToday — rebuild reminders for every due-today habit with reminderTime */
export async function syncAllHabitRemindersFromToday(
  payload: HabitsTodayResponse,
  notificationPrefs: UserPreferences['notifications'] | undefined,
): Promise<void> {
  if (Platform.OS === 'web') return;

  const dueIds = new Set(payload.habits.map((h) => h.id));
  const map = await readHabitLocalNotificationMap();

  await Promise.all(
    Object.keys(map)
      .filter((habitId) => !dueIds.has(habitId))
      .map((habitId) => cancelHabitReminders(habitId)),
  );

  for (const habit of payload.habits) {
    try {
      await syncHabitReminder(habit, payload.date, notificationPrefs);
    } catch (err) {
      console.warn('[notifications] bulk habit sync skipped', habit.id, err);
    }
  }
}
