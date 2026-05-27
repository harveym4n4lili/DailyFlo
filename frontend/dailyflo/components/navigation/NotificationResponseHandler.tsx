/**
 * listens for os notification taps and deep-links into the app (task edit or planner for wind-down).
 * mount once inside root layout after expo-router is ready.
 */

import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { InteractionManager, Platform } from 'react-native';

import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { getHrefFromNotificationData } from '@/services/notifications/notificationNavigation';

export function NotificationResponseHandler() {
  const router = useGuardedRouter();
  const lastHandledIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    const navigateFromResponse = (response: Notifications.NotificationResponse) => {
      const requestId = response.notification.request.identifier;
      if (lastHandledIdRef.current === requestId) return;

      const href = getHrefFromNotificationData(response.notification.request.content.data);
      if (!href) return;

      lastHandledIdRef.current = requestId;

      // brief delay so cold-start bootstrap finishes before we push task / planner routes
      InteractionManager.runAfterInteractions(() => {
        setTimeout(() => router.push(href), 250);
      });
    };

    const subscription = Notifications.addNotificationResponseReceivedListener(navigateFromResponse);

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) navigateFromResponse(response);
    });

    return () => subscription.remove();
  }, [router]);

  return null;
}
