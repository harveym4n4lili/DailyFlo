/**
 * computes the denominator for the browse "today's tasks" progress bar.
 * goal = completions already logged today + incomplete tasks still due today.
 */

import type { Task } from '@/types/common/Task';
import { taskOccursOnDate } from '@/utils/recurrenceUtils';

export function localTodayDateStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function computeTodayTaskGoal(
  tasks: Task[],
  completionsToday: number,
  todayDateStr: string = localTodayDateStr()
): number {
  let incompleteDueToday = 0;
  for (const task of tasks) {
    if (task.isCompleted) continue;
    if (!task.dueDate || taskOccursOnDate(task, todayDateStr)) {
      incompleteDueToday += 1;
    }
  }
  return Math.max(1, completionsToday + incompleteDueToday);
}
