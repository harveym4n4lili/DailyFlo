/**
 * route entry for task quick add — thin screen that mounts the overlay.
 * transparentModal (see _layout) keeps the tab screen visible for the blur backdrop.
 * enter/exit motion and android back are handled inside TaskQuickAddOverlay.
 */

import React, { useCallback } from 'react';

import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { TaskQuickAddOverlay } from '@/components/features/tasks/quickAdd';

export default function TaskQuickAddScreen() {
  const router = useGuardedRouter();

  const close = useCallback(() => {
    router.back();
  }, [router]);

  return <TaskQuickAddOverlay onRequestClose={close} />;
}
