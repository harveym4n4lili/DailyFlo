/**
 * wraps expo-notifications permission APIs — returns a simple granted/denied outcome for onboarding + settings.
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { ensureAndroidNotificationChannel } from './notificationsSetup';

export type NotificationPermissionOutcome = 'granted' | 'denied';

export type NotificationPermissionSnapshot = {
  outcome: NotificationPermissionOutcome;
  /** false when ios/android will not show the system dialog again (user must open Settings) */
  canAskAgain: boolean;
};

/** read current os permission without prompting */
export async function getNotificationPermissionSnapshot(): Promise<NotificationPermissionSnapshot> {
  if (Platform.OS === 'web') {
    return { outcome: 'denied', canAskAgain: false };
  }

  const current = await Notifications.getPermissionsAsync();
  return {
    outcome: current.status === 'granted' ? 'granted' : 'denied',
    canAskAgain: current.canAskAgain ?? current.status !== 'denied',
  };
}

/**
 * triggers the native permission sheet when the os allows it.
 * if already granted, returns granted without re-prompting.
 */
export async function requestAppNotificationPermission(): Promise<NotificationPermissionSnapshot> {
  if (Platform.OS === 'web') {
    return { outcome: 'denied', canAskAgain: false };
  }

  await ensureAndroidNotificationChannel();

  const current = await Notifications.getPermissionsAsync();
  if (current.status === 'granted') {
    return { outcome: 'granted', canAskAgain: true };
  }

  const result = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });

  return {
    outcome: result.status === 'granted' ? 'granted' : 'denied',
    canAskAgain: result.canAskAgain ?? result.status !== 'denied',
  };
}
