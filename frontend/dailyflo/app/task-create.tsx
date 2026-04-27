/**
 * Legacy deep-link entry: task-create now uses the same quick-add overlay flow as Today.
 */

import React, { useCallback } from 'react';

import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { TaskQuickAddOverlay } from '@/components/features/tasks/quickAdd';

export default function TaskCreateScreen() {
  const router = useGuardedRouter();

  const close = useCallback(() => {
    router.back();
  }, [router]);

  return <TaskQuickAddOverlay onRequestClose={close} />;
}
