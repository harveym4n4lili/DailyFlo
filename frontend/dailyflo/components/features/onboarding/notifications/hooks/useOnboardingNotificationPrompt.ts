/**
 * last onboarding step — native os permission prompt + django preferences sync, then dismiss to Today.
 */

import type { Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Linking } from 'react-native';

import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { requestAppNotificationPermission } from '@/services/notifications/requestNotificationPermission';
import { useAppDispatch } from '@/store';
import { patchUserNotificationPreferences } from '@/store/slices/auth/authSlice';
import { markNotificationPromptShown } from '@/utils/notifications/notificationPromptStorage';

import {
  ONBOARDING_NOTIFICATIONS_CONTINUE_LABEL,
  ONBOARDING_NOTIFICATIONS_DENIED_MESSAGE,
  ONBOARDING_NOTIFICATIONS_DENIED_TITLE,
  ONBOARDING_NOTIFICATIONS_OPEN_SETTINGS_LABEL,
} from '../constants';

const TODAY_HREF = '/(tabs)/today' as Href;

/** maps os grant/deny into django `preferences.notifications` merge payload */
async function syncNotificationPreferences(
  dispatch: ReturnType<typeof useAppDispatch>,
  granted: boolean,
): Promise<void> {
  try {
    await dispatch(
      patchUserNotificationPreferences({
        enabled: granted,
        pushNotifications: granted,
        dueDateReminders: granted,
        routineReminders: granted,
      }),
    ).unwrap();
  } catch (err) {
    // non-blocking — local os permission still applies even if profile PATCH fails offline
    console.warn('[onboarding] notification preferences sync skipped', err);
  }
}

export function useOnboardingNotificationPrompt() {
  const router = useGuardedRouter();
  const dispatch = useAppDispatch();
  const [busy, setBusy] = useState(false);

  // close onboarding modal stack and land on Today tab
  const finishAndGoHome = useCallback(async () => {
    await markNotificationPromptShown();
    router.dismissTo(TODAY_HREF);
  }, [router]);

  const onNotNow = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      await syncNotificationPreferences(dispatch, false);
      await finishAndGoHome();
    } finally {
      setBusy(false);
    }
  }, [busy, dispatch, finishAndGoHome]);

  const onEnableNotifications = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      const { outcome, canAskAgain } = await requestAppNotificationPermission();
      const granted = outcome === 'granted';

      if (!granted && !canAskAgain) {
        // ios/android already denied — system sheet will not reappear; offer Settings
        Alert.alert(ONBOARDING_NOTIFICATIONS_DENIED_TITLE, ONBOARDING_NOTIFICATIONS_DENIED_MESSAGE, [
          {
            text: ONBOARDING_NOTIFICATIONS_OPEN_SETTINGS_LABEL,
            onPress: () => {
              void (async () => {
                await syncNotificationPreferences(dispatch, false);
                await finishAndGoHome();
                await Linking.openSettings();
              })();
            },
          },
          {
            text: ONBOARDING_NOTIFICATIONS_CONTINUE_LABEL,
            onPress: () => {
              void (async () => {
                await syncNotificationPreferences(dispatch, false);
                await finishAndGoHome();
              })();
            },
          },
        ]);
        return;
      }

      await syncNotificationPreferences(dispatch, granted);
      await finishAndGoHome();
    } finally {
      setBusy(false);
    }
  }, [busy, dispatch, finishAndGoHome]);

  return { busy, onEnableNotifications, onNotNow };
}
