/**
 * UI Components Export
 * 
 * This file provides clean exports for all UI components.
 * It follows the barrel export pattern for better organization.
 */

// export button components
export { FloatingActionButton } from './button';
export type { FloatingActionButtonProps } from './button';

export { FormPickerButton } from './button';
export type { FormPickerButtonProps } from './button';

export { TaskOptionButton } from './button';
export type { TaskOptionButtonProps } from './button';

export { ScreenContextButton } from './button';
export type { ScreenContextButtonProps } from './button';

// export FormPickerButton utilities
export {
  getDatePickerDisplay,
  getTimeDurationPickerDisplay,
  getAlertsPickerDisplay,
  getRelativeDateMessage,
} from './button';
export type { PickerButtonDisplay } from './button';

// export task-related components
export { TaskCard } from './card';
export type { TaskCardProps } from './card';

export { ListCard } from './card';
export type {ListCardProps } from './card';

// export text input components
export { CustomTextInput } from './textinput';
export type { CustomTextInputProps } from './textinput';

// export list components (includes DropdownList)
export { DropdownList } from './list';
export type { 
  DropdownListProps, 
  DropdownListItem, 
  DropdownListAnchorPosition 
} from './list';

// export custom icon components (SVG-based; paste your SVG path d in each icon file)
export {
  AddIcon,
  CloseIcon,
  SaveIcon,
  CalendarIcon,
  ClockIcon,
  BellIcon,
  BrowseIcon,
} from './icon';

// export message components (dynamic today message, etc.)
export { TaskSummary } from './message';
export type {
  AddIconProps,
  CloseIconProps,
  SaveIconProps,
  CalendarIconProps,
  ClockIconProps,
  BellIconProps,
  BrowseIconProps,
} from './icon';