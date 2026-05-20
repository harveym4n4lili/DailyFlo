/**
 * onboarding completion is tracked two ways:
 * - device-wide `@DailyFlo:onboardingComplete` — root `_layout` uses this to stop showing the modal on cold start
 * - per-account `@DailyFlo:onboardingCompleteUser:<userId>` + server `preferences.onboarding_completed` —
 *   tells us a signed-in user is "returning" so questionnaire slides can show Skip (new users cannot skip)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import type { User } from '@/types';

/** same key as `useCompleteOnboardingAndExit` / root `_layout` */
export const ONBOARDING_COMPLETE_STORAGE_KEY = '@DailyFlo:onboardingComplete';

const perUserKey = (userId: string) => `@DailyFlo:onboardingCompleteUser:${userId}`;

/** device-wide flag — finished funnel on this install */
export async function getDeviceOnboardingComplete(): Promise<boolean> {
  const v = await AsyncStorage.getItem(ONBOARDING_COMPLETE_STORAGE_KEY);
  return v === 'true';
}

export async function setDeviceOnboardingComplete(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_COMPLETE_STORAGE_KEY, 'true');
}

/** per-account local flag — survives logout so returning users keep Skip on re-login */
export async function setUserOnboardingComplete(userId: string): Promise<void> {
  await AsyncStorage.setItem(perUserKey(userId), 'true');
}

/**
 * returning = this account finished onboarding before (local per-user key or django preferences).
 * used for Skip visibility — not the same as "must show onboarding modal" (device-wide key + auth gate that).
 */
export async function hasUserEverCompletedOnboarding(user: User): Promise<boolean> {
  const local = await AsyncStorage.getItem(perUserKey(user.id));
  if (local === 'true') return true;
  return user.preferences.onboardingCompleted === true;
}

/** accounts created within this window are treated as brand-new when the server did not send `is_new_user` */
const NEW_ACCOUNT_MAX_AGE_MS = 20 * 60 * 1000;

/**
 * whether this sign-in created a fresh django user.
 * `authReportedNewAccount` comes from POST `/accounts/auth/social/` → `is_new_user` (google/apple).
 */
export function inferOnboardingIsNewAccount(
  user: User,
  authReportedNewAccount: boolean | null,
): boolean {
  if (authReportedNewAccount === true) return true;
  if (authReportedNewAccount === false) return false;
  return Date.now() - user.createdAt.getTime() < NEW_ACCOUNT_MAX_AGE_MS;
}

/**
 * returning = existing account or already finished onboarding — show Skip on questionnaire slides.
 */
export async function isReturningOnboardingUser(
  user: User | null,
  authReportedNewAccount: boolean | null = null,
): Promise<boolean> {
  if (!user) return false;
  if (await hasUserEverCompletedOnboarding(user)) return true;
  return !inferOnboardingIsNewAccount(user, authReportedNewAccount);
}

/** sync slice for header chrome — matches async `isReturningOnboardingUser` when completion flags are not set yet */
export function isReturningOnboardingUserSync(
  user: User | null,
  authReportedNewAccount: boolean | null,
): boolean {
  if (!user) return false;
  if (user.preferences.onboardingCompleted === true) return true;
  return !inferOnboardingIsNewAccount(user, authReportedNewAccount);
}
