/**
 * helpers for list-select sheet — filter, count tasks/habits per list, format row metadata.
 */

import type { List, Task } from '@/types';
import type { HabitLibraryItem } from '@/types/api/habits';

export type ListSelectRowModel = {
  id: string | null;
  name: string;
  leadingIcon: 'leaf' | 'tray';
  taskCount: number;
  habitCount: number;
};

/** show all lists when query empty; filter name/description when user types */
export function filterListsForListSelect(lists: List[], query: string): List[] {
  const active = lists
    .filter((l) => !l.softDeleted)
    .slice()
    .sort((a, b) => {
      const orderDiff = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
      if (orderDiff !== 0) return orderDiff;
      return a.name.localeCompare(b.name);
    });

  const q = query.trim().toLowerCase();
  if (!q) return active;

  return active.filter((list) => {
    const name = list.name.toLowerCase();
    const desc = (list.description ?? '').toLowerCase();
    return name.includes(q) || desc.includes(q);
  });
}

/** e.g. "3 tasks · 1 habit" */
export function formatListSelectMeta(taskCount: number, habitCount: number): string {
  const taskLabel = taskCount === 1 ? 'task' : 'tasks';
  const habitLabel = habitCount === 1 ? 'habit' : 'habits';
  return `${taskCount} ${taskLabel} · ${habitCount} ${habitLabel}`;
}

function countTasksByListId(tasks: Task[]): Map<string | null, number> {
  const map = new Map<string | null, number>();
  for (const task of tasks) {
    const key = task.listId ?? null;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return map;
}

function countHabitsByListId(habits: HabitLibraryItem[]): Map<string | null, number> {
  const map = new Map<string | null, number>();
  for (const habit of habits) {
    if (habit.isActive === false) continue;
    const key = habit.listId ?? null;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return map;
}

function taskCountForList(
  list: List,
  tasksByListId: Map<string | null, number>,
): number {
  const fromMeta = list.metadata?.taskCount;
  if (typeof fromMeta === 'number' && Number.isFinite(fromMeta)) {
    return fromMeta;
  }
  return tasksByListId.get(list.id) ?? 0;
}

export function buildListSelectRows(
  lists: List[],
  tasks: Task[],
  habits: HabitLibraryItem[],
  isHabitMode: boolean,
  query: string,
): ListSelectRowModel[] {
  const tasksByListId = countTasksByListId(tasks);
  const habitsByListId = countHabitsByListId(habits);
  const defaultName = isHabitMode ? 'Habits' : 'Inbox';
  const q = query.trim().toLowerCase();

  const rows: ListSelectRowModel[] = [];

  const defaultMatches = !q || defaultName.toLowerCase().includes(q);
  if (defaultMatches) {
    rows.push({
      id: null,
      name: defaultName,
      leadingIcon: 'tray',
      taskCount: tasksByListId.get(null) ?? 0,
      habitCount: habitsByListId.get(null) ?? 0,
    });
  }

  for (const list of filterListsForListSelect(lists, query)) {
    rows.push({
      id: list.id,
      name: list.name,
      leadingIcon: 'leaf',
      taskCount: taskCountForList(list, tasksByListId),
      habitCount: habitsByListId.get(list.id) ?? 0,
    });
  }

  return rows;
}
