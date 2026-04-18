/**
 * Task index – redirects to task-create (create) or task/[taskId] (view/edit).
 * Keeps old /task and /task?taskId= links working.
 */

import { useLocalSearchParams } from 'expo-router';

import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { useEffect } from 'react';

export default function TaskIndexRedirect() {
  const router = useGuardedRouter();
  const params = useLocalSearchParams<{ dueDate?: string; taskId?: string; occurrenceDate?: string }>();

  useEffect(() => {
    if (params.taskId) {
      router.replace({
        pathname: '/task/[taskId]',
        params: { taskId: params.taskId, ...(params.occurrenceDate ? { occurrenceDate: params.occurrenceDate } : {}) },
      });
    } else {
      router.replace({
        pathname: '/task-create',
        params: params.dueDate ? { dueDate: params.dueDate } : {},
      });
    }
  }, [params.taskId, params.dueDate, params.occurrenceDate, router]);

  return null;
}
