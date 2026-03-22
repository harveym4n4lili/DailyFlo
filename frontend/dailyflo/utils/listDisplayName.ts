/**
 * label for the task form “list destination” pill: Inbox vs list name from redux or browse example lists.
 */
import type { List } from '@/types';

export function getListDisplayName(
  listId: string | undefined | null,
  reduxLists: List[],
  fallbackLists: Pick<List, 'id' | 'name'>[]
): string {
  if (listId == null || listId === '') return 'Inbox';
  const fromStore = reduxLists.find((l) => l.id === listId && !l.softDeleted);
  if (fromStore) return fromStore.name;
  const fromFallback = fallbackLists.find((l) => l.id === listId);
  if (fromFallback) return fromFallback.name;
  return 'List';
}
