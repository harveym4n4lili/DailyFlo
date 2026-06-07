/**
 * maps GroupedList `itemPadding` preset to vertical content inset tokens in Paddings.ts
 */

import { Paddings } from '@/constants/Paddings';
import type { GroupedListItemPadding } from './GroupedList.types';

/** resolve row v-padding — explicit override wins over root/child preset */
export function resolveGroupedListContentPaddingVertical(
  itemPadding: GroupedListItemPadding = 'child',
  contentPaddingVertical?: number
): number {
  if (contentPaddingVertical != null) {
    return contentPaddingVertical;
  }
  return itemPadding === 'root'
    ? Paddings.groupedListRootContentVertical
    : Paddings.groupedListChildContentVertical;
}
