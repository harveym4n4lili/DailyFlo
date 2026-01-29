/**
 * UI Components Export
 * 
 * This file provides clean exports for all UI components.
 * It follows the barrel export pattern for better organization.
 */

// export button components
export { FloatingActionButton } from './Button';
export type { FloatingActionButtonProps } from './Button';

export { FormPickerButton } from './Button';
export type { FormPickerButtonProps } from './Button';

// export FormPickerButton utilities
export {
  getDatePickerDisplay,
  getTimeDurationPickerDisplay,
  getAlertsPickerDisplay,
  getRelativeDateMessage,
} from './Button';
export type { PickerButtonDisplay } from './Button';

// export task-related components
export { TaskCard } from './Card';
export type { TaskCardProps } from './Card';

export { ListCard } from './Card';
export type {ListCardProps } from './Card';

// export text input components
export { CustomTextInput } from './TextInput';
export type { CustomTextInputProps } from './TextInput';

// export list components (includes DropdownList)
export { DropdownList } from './List';
export type { 
  DropdownListProps, 
  DropdownListItem, 
  DropdownListAnchorPosition 
} from './List';

// export custom icon components (SVG-based; paste your SVG path d in each icon file)
export {
  AddIcon,
  CloseIcon,
  SaveIcon,
  CalendarIcon,
  ClockIcon,
  BellIcon,
  BrowseIcon,
} from './Icon';
export type {
  AddIconProps,
  CloseIconProps,
  SaveIconProps,
  CalendarIconProps,
  ClockIconProps,
  BellIconProps,
  BrowseIconProps,
} from './Icon';