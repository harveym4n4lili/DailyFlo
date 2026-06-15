/**
 * maps habitId → expo notification identifier so cancel/reschedule does not scan all os schedules.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export const HABIT_LOCAL_NOTIFICATION_IDS_STORAGE_KEY = '@DailyFlo:habitLocalNotificationIds';

export type HabitLocalNotificationMap = {
  [habitId: string]: string;
};

export async function readHabitLocalNotificationMap(): Promise<HabitLocalNotificationMap> {
  try {
    const raw = await AsyncStorage.getItem(HABIT_LOCAL_NOTIFICATION_IDS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as HabitLocalNotificationMap;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export async function writeHabitLocalNotificationMap(map: HabitLocalNotificationMap): Promise<void> {
  await AsyncStorage.setItem(HABIT_LOCAL_NOTIFICATION_IDS_STORAGE_KEY, JSON.stringify(map));
}

export async function clearHabitLocalNotificationMap(): Promise<void> {
  await AsyncStorage.removeItem(HABIT_LOCAL_NOTIFICATION_IDS_STORAGE_KEY);
}
