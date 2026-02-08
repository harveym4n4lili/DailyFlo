/**
 * GroupedList Component Exports
 * 
 * Clean barrel exports for the GroupedList component system.
 * 
 * Usage:
 * // Flexible list with custom children
 * import { GroupedList } from '@/components/ui/List/GroupedList';
 * 
 * // Button-style items for task forms
 * import { GroupedList, FormDetailButton } from '@/components/ui/List/GroupedList';
 */

// main component exports
export { GroupedList } from './GroupedList';
export { GroupedListItemWrapper } from './GroupedListItemWrapper';

// re-export FormDetailButton from TaskButton folder for backward compatibility
export { FormDetailButton } from '@/components/ui/Button/TaskButton';

// deprecated exports (kept for backward compatibility)
export { GroupedListItem } from './GroupedListItem';

// type exports
export type {
  GroupedListProps,
  FormDetailButtonProps,
  // deprecated types (kept for backward compatibility)
  GroupedListItemConfig,
  GroupedListItemProps,
} from './GroupedList.types';

// default export
export { GroupedList as default } from './GroupedList';
