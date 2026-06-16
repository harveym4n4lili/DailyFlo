/**
 * redux → toast controller — watches pendingAchievementUnlock, haptics, auto-dismiss, slide animation.
 */

import { useCallback, useEffect, useRef } from 'react';
import * as Haptics from 'expo-haptics';
import {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useAppDispatch, useAppSelector } from '@/store';
import { clearPendingAchievementUnlock } from '@/store/slices/gamification/gamificationSlice';
import {
  ACHIEVEMENT_UNLOCK_TOAST_AUTO_DISMISS_MS,
  ACHIEVEMENT_UNLOCK_TOAST_ENTER_OPACITY_MS,
  ACHIEVEMENT_UNLOCK_TOAST_ENTER_SPRING,
  ACHIEVEMENT_UNLOCK_TOAST_EXIT_OPACITY_MS,
  ACHIEVEMENT_UNLOCK_TOAST_EXIT_TRANSLATE_MS,
  ACHIEVEMENT_UNLOCK_TOAST_OFFSCREEN_Y,
} from './achievementUnlockToastTypes';

export function useAchievementUnlockToastController() {
  const dispatch = useAppDispatch();
  const pendingUnlock = useAppSelector((state) => state.gamification.pendingAchievementUnlock);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const translateY = useSharedValue(ACHIEVEMENT_UNLOCK_TOAST_OFFSCREEN_Y);
  const opacity = useSharedValue(0);

  const clearPending = useCallback(() => {
    dispatch(clearPendingAchievementUnlock());
  }, [dispatch]);

  const dismiss = useCallback(() => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
    opacity.value = withTiming(0, { duration: ACHIEVEMENT_UNLOCK_TOAST_EXIT_OPACITY_MS });
    translateY.value = withTiming(
      ACHIEVEMENT_UNLOCK_TOAST_OFFSCREEN_Y,
      { duration: ACHIEVEMENT_UNLOCK_TOAST_EXIT_TRANSLATE_MS },
      (finished) => {
        if (finished) {
          runOnJS(clearPending)();
        }
      },
    );
  }, [clearPending, opacity, translateY]);

  useEffect(() => {
    if (!pendingUnlock) {
      translateY.value = ACHIEVEMENT_UNLOCK_TOAST_OFFSCREEN_Y;
      opacity.value = 0;
      return;
    }

    // success haptic when django reports a newly unlocked achievement
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    translateY.value = withSpring(0, ACHIEVEMENT_UNLOCK_TOAST_ENTER_SPRING);
    opacity.value = withTiming(1, { duration: ACHIEVEMENT_UNLOCK_TOAST_ENTER_OPACITY_MS });

    dismissTimerRef.current = setTimeout(() => {
      dismiss();
    }, ACHIEVEMENT_UNLOCK_TOAST_AUTO_DISMISS_MS);

    return () => {
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
        dismissTimerRef.current = null;
      }
    };
  }, [pendingUnlock?.id, dismiss, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return {
    pendingUnlock,
    dismiss,
    animatedStyle,
  };
}
