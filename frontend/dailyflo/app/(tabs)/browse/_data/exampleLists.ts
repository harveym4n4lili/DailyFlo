/**
 * placeholder list rows for browse “My Lists” until lists API + redux are wired.
 * single module keeps browse index and list/[listId] in sync on id + shape.
 */

import type { List } from '@/types';

export const EXAMPLE_LISTS: List[] = [
  {
    id: 'example-list-1',
    userId: 'example-user',
    name: 'Work',
    description: '',
    color: 'blue',
    icon: 'briefcase',
    isDefault: false,
    sortOrder: 0,
    // keep in sync with WORK_TASKS length in exampleListTasks.ts (mock rows only)
    metadata: { taskCount: 4 },
    softDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'example-list-2',
    userId: 'example-user',
    name: 'Personal',
    description: '',
    color: 'green',
    icon: 'person',
    isDefault: false,
    sortOrder: 1,
    metadata: { taskCount: 2 },
    softDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'example-list-3',
    userId: 'example-user',
    name: 'Shopping',
    description: '',
    color: 'orange',
    icon: 'cart',
    isDefault: false,
    sortOrder: 2,
    metadata: { taskCount: 2 },
    softDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export function getExampleListById(listId: string): List | undefined {
  return EXAMPLE_LISTS.find((l) => l.id === listId);
}
