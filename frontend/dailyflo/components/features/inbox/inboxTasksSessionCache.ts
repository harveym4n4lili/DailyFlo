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
