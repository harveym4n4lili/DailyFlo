/**
 * maps taskId → expo notification identifiers so cancel/reschedule does not scan all os schedules.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export const TASK_LOCAL_NOTIFICATION_IDS_STORAGE_KEY = '@DailyFlo:taskLocalNotificationIds';

export type TaskLocalNotificationMap = {
  [taskId: string]: {
    [alertId: string]: string;
  };
};

export async function readTaskLocalNotificationMap(): Promise<TaskLocalNotificationMap> {
  try {
    const raw = await AsyncStorage.getItem(TASK_LOCAL_NOTIFICATION_IDS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as TaskLocalNotificationMap;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export async function writeTaskLocalNotificationMap(map: TaskLocalNotificationMap): Promise<void> {
  await AsyncStorage.setItem(TASK_LOCAL_NOTIFICATION_IDS_STORAGE_KEY, JSON.stringify(map));
}

export async function clearTaskLocalNotificationMap(): Promise<void> {
  await AsyncStorage.removeItem(TASK_LOCAL_NOTIFICATION_IDS_STORAGE_KEY);
}
