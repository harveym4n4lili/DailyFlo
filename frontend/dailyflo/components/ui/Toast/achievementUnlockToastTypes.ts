/**
 * shared types for achievement unlock toasts — redux pending unlock drives the host.
 */

import type { AchievementItem } from '@/types/api/gamification';

export type AchievementUnlockToastPayload = Pick<
  AchievementItem,
  'id' | 'title' | 'description' | 'iconKey'
>;

export const ACHIEVEMENT_UNLOCK_TOAST_AUTO_DISMISS_MS = 4500;

/** snappy slide-in — higher damping/stiffness = less bounce, faster settle */
export const ACHIEVEMENT_UNLOCK_TOAST_ENTER_SPRING = {
  damping: 18,
  stiffness: 220,
  mass: 0.85,
} as const;

export const ACHIEVEMENT_UNLOCK_TOAST_ENTER_OPACITY_MS = 180;
export const ACHIEVEMENT_UNLOCK_TOAST_EXIT_OPACITY_MS = 160;
export const ACHIEVEMENT_UNLOCK_TOAST_EXIT_TRANSLATE_MS = 200;
export const ACHIEVEMENT_UNLOCK_TOAST_OFFSCREEN_Y = -180;
