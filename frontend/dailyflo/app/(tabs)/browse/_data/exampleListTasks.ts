/**
 * mock tasks for browse list detail screens while lists/tasks API is not wired to these example lists.
 * ids match EXAMPLE_LISTS in exampleLists.ts (example-list-1, -2, -3) so each pill shows believable data.
 * mix of routineType "once" vs repeating types so ListCard groupBy="routine" shows two sections.
 */

import type { Task } from '@/types';

const MOCK_USER = 'example-user';
const now = () => new Date().toISOString();

/** small factory so each task stays valid Task-shaped without repeating every field */
function mockTask(partial: Omit<Task, 'userId' | 'metadata' | 'softDeleted'> & Partial<Task>): Task {
  return {
    userId: MOCK_USER,
    description: partial.description ?? '',
    duration: partial.duration ?? 0,
    completedAt: partial.completedAt ?? null,
    sortOrder: partial.sortOrder ?? 0,
    metadata: partial.metadata ?? { subtasks: [], reminders: [] },
    softDeleted: partial.softDeleted ?? false,
    ...partial,
  };
}

const WORK_TASKS: Task[] = [
  mockTask({
    id: 'mock-work-once-1',
    listId: 'example-list-1',
    title: 'Finish Q1 deck',
    dueDate: now(),
    isCompleted: false,
    priorityLevel: 4,
    color: 'blue',
    routineType: 'once',
    createdAt: new Date('2025-02-01').toISOString(),
    updatedAt: now(),
  }),
  mockTask({
    id: 'mock-work-once-2',
    listId: 'example-list-1',
    title: 'Expense report',
    dueDate: null,
    isCompleted: false,
    priorityLevel: 2,
    color: 'teal',
    routineType: 'once',
    createdAt: new Date('2025-02-10').toISOString(),
    updatedAt: now(),
  }),
  mockTask({
    id: 'mock-work-daily-1',
    listId: 'example-list-1',
    title: 'Stand-up notes',
    dueDate: now(),
    time: '09:00',
    isCompleted: false,
    priorityLevel: 3,
    color: 'purple',
    routineType: 'daily',
    createdAt: new Date('2025-01-05').toISOString(),
    updatedAt: now(),
  }),
  mockTask({
    id: 'mock-work-weekly-1',
    listId: 'example-list-1',
    title: '1:1 prep',
    dueDate: now(),
    isCompleted: false,
    priorityLevel: 3,
    color: 'orange',
    routineType: 'weekly',
    createdAt: new Date('2025-01-20').toISOString(),
    updatedAt: now(),
  }),
];

const PERSONAL_TASKS: Task[] = [
  mockTask({
    id: 'mock-personal-once-1',
    listId: 'example-list-2',
    title: 'Book dentist',
    dueDate: null,
    isCompleted: false,
    priorityLevel: 2,
    color: 'green',
    routineType: 'once',
    createdAt: new Date('2025-02-15').toISOString(),
    updatedAt: now(),
  }),
  mockTask({
    id: 'mock-personal-monthly-1',
    listId: 'example-list-2',
    title: 'Budget review',
    dueDate: now(),
    isCompleted: false,
    priorityLevel: 3,
    color: 'yellow',
    routineType: 'monthly',
    createdAt: new Date('2025-01-01').toISOString(),
    updatedAt: now(),
  }),
];

const SHOPPING_TASKS: Task[] = [
  mockTask({
    id: 'mock-shop-once-1',
    listId: 'example-list-3',
    title: 'Milk & eggs',
    dueDate: now(),
    isCompleted: false,
    priorityLevel: 4,
    color: 'orange',
    routineType: 'once',
    createdAt: new Date('2025-03-18').toISOString(),
    updatedAt: now(),
  }),
  mockTask({
    id: 'mock-shop-weekly-1',
    listId: 'example-list-3',
    title: 'Weekly groceries',
    dueDate: now(),
    isCompleted: false,
    priorityLevel: 3,
    color: 'green',
    routineType: 'weekly',
    createdAt: new Date('2025-03-01').toISOString(),
    updatedAt: now(),
  }),
];

const BY_LIST_ID: Record<string, Task[]> = {
  'example-list-1': WORK_TASKS,
  'example-list-2': PERSONAL_TASKS,
  'example-list-3': SHOPPING_TASKS,
};

/** tasks shown in ListCard for a browse example list; empty array if id is unknown */
export function getMockTasksForExampleListId(listId: string): Task[] {
  return BY_LIST_ID[listId] ?? [];
}
