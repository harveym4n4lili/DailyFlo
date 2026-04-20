/**
 * route entry for task quick add — thin screen that mounts the overlay.
 * transparentModal (see _layout) keeps the tab screen visible for the blur backdrop.
 */

import React, { useCallback } from 'react';
import { BackHandler, Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { TaskQuickAddOverlay } from '@/components/features/tasks/quickAdd';

export default function TaskQuickAddScreen() {
  const router = useGuardedRouter();

  const close = useCallback(() => {
    router.back();
  }, [router]);

  // android hardware back should dismiss like tapping the dimmed area
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') return undefined;
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        close();
        return true;
      });
      return () => sub.remove();
    }, [close]),
  );

  return <TaskQuickAddOverlay onRequestClose={close} />;
}
