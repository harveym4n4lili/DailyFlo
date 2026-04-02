/**
 * label for the task form “list destination” pill: Inbox vs list name from redux (api-backed lists).
 */
import type { List } from '@/types';

export function getListDisplayName(
  listId: string | undefined | null,
  reduxLists: List[]
): string {
  if (listId == null || listId === '') return 'Inbox';
  const fromStore = reduxLists.find((l) => l.id === listId && !l.softDeleted);
  if (fromStore) return fromStore.name;
  return 'List';
}
