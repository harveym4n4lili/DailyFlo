/**
 * route entry for task quick add — thin screen that mounts the overlay.
 * transparentModal (see _layout) keeps the tab screen visible for the blur backdrop.
 * enter/exit motion and android back are handled inside TaskQuickAddOverlay.
 *
 * query: showSubtasks=1 | true — shows subtasks + description block in the composer (default hidden).
 */

import React, { useCallback, useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';

import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { TaskQuickAddOverlay } from '@/components/features/tasks/quickAdd';
import { useCreateTaskDraft } from '@/app/task/CreateTaskDraftContext';

export default function TaskQuickAddScreen() {
  const router = useGuardedRouter();
  const params = useLocalSearchParams<{ dueDate?: string; showSubtasks?: string }>();
  const { setDraft } = useCreateTaskDraft();

  const showSubtasksAndDescription =
    params.showSubtasks === '1' ||
    params.showSubtasks === 'true' ||
    params.showSubtasks === 'yes';

  useEffect(() => {
    // initialize quick-add picker draft once for this open instance, including planner dueDate prefill
    setDraft({
      dueDate: params.dueDate,
      time: undefined,
      duration: undefined,
      alerts: [],
      pickedListId: null,
      routineType: 'once',
    });
  }, [params.dueDate, setDraft]);

  const close = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <TaskQuickAddOverlay
      onRequestClose={close}
      showSubtasksAndDescription={showSubtasksAndDescription}
    />
  );
}
