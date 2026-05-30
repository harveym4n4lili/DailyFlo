/**
 * route params for /task-quick-add — sessionKey ensures draft init runs once per open,
 * not again when the modal remounts after popping date/time/alert pickers.
 */
export function buildTaskQuickAddRouteParams(options?: { dueDate?: string; showSubtasks?: boolean }) {
  return {
    sessionKey: String(Date.now()),
    ...(options?.dueDate ? { dueDate: options.dueDate } : {}),
    ...(options?.showSubtasks ? { showSubtasks: '1' as const } : {}),
  };
}
