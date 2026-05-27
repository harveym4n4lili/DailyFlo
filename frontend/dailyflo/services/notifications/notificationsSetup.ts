/**
 * one-time expo-notifications bootstrap — call from root `_layout` on app start.
 * sets foreground handler + android channel so local/push alerts can display after OS permission is granted.
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const ANDROID_DEFAULT_CHANNEL_ID = 'dailyflo-reminders';

let setupDone = false;

/** show banner/sound when a notification arrives while app is foregrounded */
export function configureForegroundNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

/** android 8+ requires a channel before notifications can post */
export async function ensureAndroidNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync(ANDROID_DEFAULT_CHANNEL_ID, {
    name: 'Reminders',
    description: 'Task and routine reminders from DailyFlo',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#6B4E71',
  });
}

/** idempotent — safe to call on every cold start */
export async function setupNotifications(): Promise<void> {
  if (setupDone || Platform.OS === 'web') return;
  setupDone = true;

  configureForegroundNotificationHandler();
  await ensureAndroidNotificationChannel();
}

export { ANDROID_DEFAULT_CHANNEL_ID };
