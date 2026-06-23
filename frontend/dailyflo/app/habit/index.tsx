/**
 * Habit index — redirects /habit?habitId=… to /habit/[habitId] (same pattern as app/task/index.tsx).
 */

import { useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';

import { useGuardedRouter } from '@/hooks/useGuardedRouter';

export default function HabitIndexRedirect() {
  const router = useGuardedRouter();
  const params = useLocalSearchParams<{ habitId?: string }>();

  useEffect(() => {
    if (params.habitId) {
      router.replace({
        pathname: '/habit/[habitId]',
        params: { habitId: params.habitId },
      });
    } else {
      router.back();
    }
  }, [params.habitId, router]);

  return null;
}
