/**
 * route entry for task quick add — thin screen that mounts the overlay.
 * transparentModal (see _layout) keeps the tab screen visible for the blur backdrop.
 * enter/exit motion and android back are handled inside TaskQuickAddOverlay.
 *
 * query: showSubtasks=1 | true — shows subtasks + description block in the composer (default hidden).
 */

import React, { useCallback, useEffect, useRef } from 'react';
import { useLocalSearchParams } from 'expo-router';

import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { TaskQuickAddOverlay } from '@/components/features/tasks/quickAdd';
import { useCreateTaskDraft } from '@/app/task/CreateTaskDraftContext';

export default function TaskQuickAddScreen() {
  const router = useGuardedRouter();
  const params = useLocalSearchParams<{ dueDate?: string; showSubtasks?: string; sessionKey?: string }>();
  const { setDraft } = useCreateTaskDraft();
  // remounting after date/time pickers must not wipe draft — init once per sessionKey from the push site
  const initializedSessionRef = useRef<string | null>(null);

  const showSubtasksAndDescription =
    params.showSubtasks === '1' ||
    params.showSubtasks === 'true' ||
    params.showSubtasks === 'yes';

  useEffect(() => {
    const sessionKey = params.sessionKey ?? params.dueDate ?? 'default';
    if (initializedSessionRef.current === sessionKey) return;
    initializedSessionRef.current = sessionKey;

    // inbox quick-add has no dueDate — start with no alerts; default 15-min is seeded only after day + time are set
    setDraft({
      dueDate: params.dueDate,
      time: undefined,
      duration: undefined,
      alerts: [],
      pickedListId: null,
      routineType: 'once',
    });
  }, [params.sessionKey, params.dueDate, setDraft]);

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
