/**
 * GroupedList Component Exports
 * 
 * Clean barrel exports for the GroupedList component.
 * This allows importing the component and types from a single path.
 * 
 * Usage:
 * import { GroupedList, type GroupedListItemConfig } from '@/components/ui/List/GroupedList';
 */

// main component exports
export { GroupedList } from './GroupedList';
export { GroupedListItem } from './GroupedListItem';

// type exports
export type {
  GroupedListProps,
  GroupedListItemConfig,
  GroupedListItemProps,
} from './GroupedList.types';

// default export
export { GroupedList as default } from './GroupedList';

