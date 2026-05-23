/**
 * device-local flag — we only show the post-onboarding notification prompt once per install.
 * separate from django `preferences.notifications` (server truth for reminder toggles).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export const NOTIFICATION_PROMPT_SHOWN_STORAGE_KEY = '@DailyFlo:notificationPromptShown';

/** true when user already saw allow / not-now on the onboarding notifications step */
export async function getNotificationPromptAlreadyShown(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(NOTIFICATION_PROMPT_SHOWN_STORAGE_KEY);
    return raw === 'true';
  } catch {
    return false;
  }
}

export async function markNotificationPromptShown(): Promise<void> {
  await AsyncStorage.setItem(NOTIFICATION_PROMPT_SHOWN_STORAGE_KEY, 'true');
}
