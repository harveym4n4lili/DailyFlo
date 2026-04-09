/**
 * Button Components Export
 * 
 * This file provides clean exports for all button-related components.
 * It follows the barrel export pattern for better organization.
 */

// Export FloatingActionButton component
export { FloatingActionButton, FAB_SCREEN_INSET } from './FloatingActionButton';
export type { FloatingActionButtonProps } from './FloatingActionButton';

// Export FormPickerButton component and utilities
export { FormPickerButton } from './FormPickerButton';
export type { FormPickerButtonProps } from './FormPickerButton';

// Export TaskOptionButton (simplified FormPickerButton for fields with no value)
export { TaskOptionButton } from './FormPickerButton';
export type { TaskOptionButtonProps } from './FormPickerButton';

export {
  getDatePickerDisplay,
  getTimeDurationPickerDisplay,
  getTimeDurationDisplayLabels,
  getAlertsPickerDisplay,
  getIconPickerDisplay,
  getRelativeDateMessage,
} from './FormPickerButton';
export type { PickerButtonDisplay } from './FormPickerButton';

// Export CloseButton components
export {
  MainCloseButton,
  MainBackButton,
  MainSubmitButton,
  MainCreateButton,
} from './CloseButton';
export type {
  MainCloseButtonProps,
  MainBackButtonProps,
  MainSubmitButtonProps,
  MainCreateButtonProps,
} from './CloseButton';

// Export SaveButton component
export { SaveButton } from './SaveButton';
export type { SaveButtonProps } from './SaveButton';

// Export TaskButton components
export { FormDetailButton, CustomFormDetailButton } from './TaskButton';
export type { FormDetailButtonProps, CustomFormDetailButtonProps } from './TaskButton';
export { CUSTOM_FORM_DETAIL_BUTTON_CONSTANTS } from './TaskButton';

// Export Checkbox and checkbox constants
export { Checkbox } from './Checkbox';
export type { CheckboxProps } from './Checkbox';
export {
  CHECKBOX_SIZE_DEFAULT,
  CHECKBOX_SIZE_TASK_VIEW,
  CHECKBOX_SIZE_SMALL,
  CHECKBOX_TICK_SIZE_RATIO,
  CHECKBOX_SIZE_DEFAULT as SIMPLE_CHECKBOX_SIZE,
} from '@/constants/Checkbox';

// Export ScreenContextButton (3-dot ellipse button for screen headers)
export { ScreenContextButton } from './ScreenContextButton';
export type { ScreenContextButtonProps } from './ScreenContextButton';

// Export SelectionCloseButton (close button with liquid glass for selection mode)
export { SelectionCloseButton } from './SelectionCloseButton';
export type { SelectionCloseButtonProps } from './SelectionCloseButton';

// Export SelectAllButton ("Select all" text button with liquid glass for selection mode)
export { SelectAllButton } from './SelectAllButton';
export type { SelectAllButtonProps } from './SelectAllButton';

// Export ActionsButton (ellipsis button with liquid glass context menu)
export { ActionsButton } from './ActionsButton/index';
export type { ActionsButtonProps, ActionsButtonItem } from './ActionsButton/index';

// Default export for convenience (FloatingActionButton)
export { FloatingActionButton as default } from './FloatingActionButton';
