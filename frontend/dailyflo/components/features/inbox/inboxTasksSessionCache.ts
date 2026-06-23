import type { Task } from '@/types';

/**
 * in-memory inbox rows shared between inbox index + select routes.
 * avoids an empty-list flash on ios select push (which was shifting scroll/header layout).
 */
let cachedInboxTasks: Task[] = [];

export function getCachedInboxTasks(): Task[] {
  return cachedInboxTasks;
}

export function setCachedInboxTasks(tasks: Task[]): void {
  cachedInboxTasks = tasks;
}

/** drop deleted base ids so inbox index reflects bulk delete before the next api fetch */
export function removeCachedInboxTasksByIds(baseIds: string[]): void {
  const idSet = new Set(baseIds);
  cachedInboxTasks = cachedInboxTasks.filter((task) => !idSet.has(task.id));
}
