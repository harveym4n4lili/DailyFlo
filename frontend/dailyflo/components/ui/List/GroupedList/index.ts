/**
 * GroupedList Component Exports
 * 
 * Clean barrel exports for the GroupedList component system.
 * 
 * Usage:
 * // Flexible list with custom children
 * import { GroupedList } from '@/components/ui/List/GroupedList';
 * 
 * // Button-style items for settings pages
 * import { GroupedList, GroupedListButton } from '@/components/ui/List/GroupedList';
 */

// main component exports
export { GroupedList } from './GroupedList';
export { GroupedListButton } from './GroupedListButton';
export { GroupedListItemWrapper } from './GroupedListItemWrapper';

// deprecated exports (kept for backward compatibility)
export { GroupedListItem } from './GroupedListItem';

// type exports
export type {
  GroupedListProps,
  GroupedListButtonProps,
  // deprecated types (kept for backward compatibility)
  GroupedListItemConfig,
  GroupedListItemProps,
} from './GroupedList.types';

// default export
export { GroupedList as default } from './GroupedList';
