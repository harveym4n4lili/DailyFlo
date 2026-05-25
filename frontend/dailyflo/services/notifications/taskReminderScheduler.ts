/**
 * schedules / cancels local expo notifications for timed tasks.
 * reads alert ids from task.metadata.reminders (or defaults to mandatory 15-min when empty).
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { Task, UserPreferences } from '@/types';

import { ANDROID_DEFAULT_CHANNEL_ID, ensureAndroidNotificationChannel } from './notificationsSetup';
import { getNotificationPermissionSnapshot } from './requestNotificationPermission';
import {
  formatNotificationBodyForAlert,
  getEffectiveAlertIdsForTask,
  getFireDateForAlert,
} from './taskReminderAlerts';
import {
  buildTaskReminderNotificationId,
  TASK_REMINDER_NOTIFICATION_ID_PREFIX,
} from './taskReminderConstants';
import { getTaskLocalStartDate } from './taskReminderDateMath';
import {
  areUserNotificationPrefsAllowed,
  canScheduleTaskReminders,
  isTaskEligibleForLocalReminder,
} from './taskReminderEligibility';
import {
  readTaskLocalNotificationMap,
  writeTaskLocalNotificationMap,
  clearTaskLocalNotificationMap,
} from './taskReminderStorage';

/** dev-only — explains why a reminder was not scheduled */
function logReminderSkip(taskId: string, reason: string, extra?: Record<string, unknown>): void {
  if (__DEV__) {
    console.warn('[notifications] reminder skipped', { taskId, reason, ...extra });
  }
}

/** dev-only — confirms a reminder was scheduled */
function logReminderScheduled(
  taskId: string,
  alertId: string,
  fireDate: Date,
  taskStart: Date,
  identifier: string,
): void {
  if (__DEV__) {
    console.log('[notifications] reminder scheduled', {
      taskId,
      alertId,
      identifier,
      fireAt: fireDate.toISOString(),
      taskStart: taskStart.toISOString(),
      minutesUntilFire: Math.round((fireDate.getTime() - Date.now()) / 60_000),
    });
  }
}

/** cancel one expo id — ignore "not found" errors from stale maps */
async function cancelNotificationId(identifier: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch {
    // stale map entry or already fired — safe to ignore
  }
}

/** remove all scheduled reminders for a single task id */
export async function cancelTaskReminders(taskId: string): Promise<void> {
  const map = await readTaskLocalNotificationMap();
  const entry = map[taskId];
  if (entry) {
    await Promise.all(Object.values(entry).map((id) => cancelNotificationId(id)));
    delete map[taskId];
    await writeTaskLocalNotificationMap(map);
  }
}

/** logout — drop every dailyflo task notification + clear storage map */
export async function cancelAllTaskReminders(): Promise<void> {
  const map = await readTaskLocalNotificationMap();
  const ids = new Set<string>();
  Object.values(map).forEach((alerts) => {
    Object.values(alerts).forEach((id) => ids.add(id));
  });

  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    scheduled.forEach((req) => {
      if (req.identifier.startsWith(TASK_REMINDER_NOTIFICATION_ID_PREFIX)) {
        ids.add(req.identifier);
      }
    });
  } catch {
    // best-effort sweep
  }

  await Promise.all([...ids].map((id) => cancelNotificationId(id)));
  await clearTaskLocalNotificationMap();
}

/**
 * (re)schedule reminders for one task from saved alert ids — cancels previous ids first.
 * non-throwing: logs and returns on failure so task CRUD still succeeds.
 */
export async function syncTaskReminders(
  task: Task,
  notificationPrefs: UserPreferences['notifications'] | undefined,
): Promise<void> {
  if (Platform.OS === 'web') return;

  await cancelTaskReminders(task.id);

  if (!isTaskEligibleForLocalReminder(task)) {
    logReminderSkip(task.id, 'task not eligible', {
      isCompleted: task.isCompleted,
      hasDueDate: Boolean(task.dueDate),
      hasTime: Boolean(task.time?.trim()),
    });
    return;
  }

  if (!areUserNotificationPrefsAllowed(notificationPrefs)) {
    logReminderSkip(task.id, 'notification prefs disabled', { notificationPrefs });
    return;
  }

  const allowed = await canScheduleTaskReminders(notificationPrefs, { requestIfNeeded: true });
  if (!allowed) {
    const { outcome } = await getNotificationPermissionSnapshot();
    logReminderSkip(task.id, 'os permission not granted', { permission: outcome, notificationPrefs });
    return;
  }

  const taskStart = getTaskLocalStartDate(task);
  if (!taskStart) {
    logReminderSkip(task.id, 'could not parse task start datetime', {
      dueDate: task.dueDate,
      time: task.time,
    });
    return;
  }

  const alertIds = getEffectiveAlertIdsForTask(task);
  const durationMinutes = task.duration ?? 0;
  await ensureAndroidNotificationChannel();

  const scheduledEntries: Record<string, string> = {};

  for (const alertId of alertIds) {
    const fireDate = getFireDateForAlert(alertId, taskStart, durationMinutes);
    if (!fireDate) {
      logReminderSkip(task.id, 'alert could not compute fire time', { alertId, durationMinutes });
      continue;
    }

    if (fireDate.getTime() <= Date.now()) {
      logReminderSkip(task.id, 'fire time already passed', {
        alertId,
        taskStart: taskStart.toISOString(),
        fireAt: fireDate.toISOString(),
      });
      continue;
    }

    const identifier = buildTaskReminderNotificationId(task.id, alertId);
    const body = formatNotificationBodyForAlert(alertId, task.title, taskStart, fireDate);

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
          body,
          sound: true,
          data: {
            type: 'task_reminder',
            taskId: task.id,
            alertId,
            taskStartIso: taskStart.toISOString(),
          },
        },
        trigger,
      });

      scheduledEntries[alertId] = identifier;
      logReminderScheduled(task.id, alertId, fireDate, taskStart, identifier);
    } catch (err) {
      console.warn('[notifications] schedule task reminder failed', task.id, alertId, err);
    }
  }

  if (Object.keys(scheduledEntries).length > 0) {
    const map = await readTaskLocalNotificationMap();
    map[task.id] = scheduledEntries;
    await writeTaskLocalNotificationMap(map);
  }
}

/** after fetch/login — rebuild local reminders for every eligible timed task */
export async function syncAllTaskReminders(
  tasks: Task[],
  notificationPrefs: UserPreferences['notifications'] | undefined,
): Promise<void> {
  if (Platform.OS === 'web') return;

  for (const task of tasks) {
    try {
      await syncTaskReminders(task, notificationPrefs);
    } catch (err) {
      console.warn('[notifications] bulk sync skipped for task', task.id, err);
    }
  }

  if (__DEV__) {
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      const ours = scheduled.filter((req) =>
        req.identifier.startsWith(TASK_REMINDER_NOTIFICATION_ID_PREFIX),
      );
      console.log('[notifications] scheduled count after bulk sync', ours.length);
    } catch {
      // ignore debug read failures
    }
  }
}

/** debug helper — confirm permission without scheduling */
export async function hasNotificationPermissionForReminders(): Promise<boolean> {
  const { outcome } = await getNotificationPermissionSnapshot();
  return outcome === 'granted';
}
