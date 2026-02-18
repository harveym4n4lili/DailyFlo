import type { ReactNode } from 'react';

/**
 * DropdownList Types
 * 
 * TypeScript type definitions for the DropdownList component.
 * These types define the structure of menu items and component props.
 */

/**
 * Menu item interface - defines the structure of each item in the dropdown list
 * 
 * Each menu item represents an option that can be selected from the dropdown.
 * Items can have labels, icons, and can be marked as destructive (e.g., delete actions).
 */
export interface DropdownListItem {
  // unique identifier for the menu item (used for key prop in lists)
  id: string;
  
  // text label to display for this menu item
  label: string;
  
  // optional icon name from Ionicons (e.g., "checkmark-circle-outline", "trash-outline")
  // if iconComponent is provided, it takes precedence over icon
  icon?: string;
  
  // optional custom icon - render function receives color for theme-aware icons (e.g. TrashIcon)
  // takes precedence over icon when provided
  iconComponent?: (color: string) => ReactNode;
  
  // callback function called when this menu item is pressed
  // this allows the parent component to handle the action
  onPress: () => void;
  
  // optional flag to mark this item as destructive (e.g., delete, remove actions)
  // destructive items may be styled differently (e.g., red text color)
  destructive?: boolean;
  
  // optional flag to disable this menu item
  // disabled items cannot be pressed and may be styled differently
  disabled?: boolean;
}

/**
 * Dropdown list anchor position - where the menu should appear relative to the trigger button
 * 
 * This controls the positioning of the dropdown list on the screen.
 * For example, "top-right" positions the menu at the top-right corner.
 */
export type DropdownListAnchorPosition = 
  | 'top-right'   // menu appears at top-right (default for ellipse buttons)
  | 'top-left'    // menu appears at top-left
  | 'bottom-right' // menu appears at bottom-right
  | 'bottom-left'; // menu appears at bottom-left

/**
 * Props interface for DropdownList component
 * 
 * This defines what data and callbacks the component needs to function.
 */
export interface DropdownListProps {
  // whether the dropdown list is currently visible
  // when true, the menu modal is shown; when false, it's hidden
  visible: boolean;
  
  // callback function called when the menu should be closed
  // this is called when user taps outside the menu or presses back button
  onClose: () => void;
  
  // array of menu items to display in the dropdown
  // each item will be rendered as a pressable row with label and optional icon
  items: DropdownListItem[];
  
  // optional anchor position for the dropdown list
  // controls where the menu appears relative to the trigger button
  // defaults to 'top-right' if not specified
  anchorPosition?: DropdownListAnchorPosition;
  
  // optional top padding offset for positioning
  // useful when the menu needs to account for headers, navbars, or safe areas
  // defaults to 0 if not specified
  topOffset?: number;
  
  // optional right padding offset for positioning
  // useful for fine-tuning horizontal positioning
  // defaults to 20 if not specified
  rightOffset?: number;
  
  // optional left padding offset for positioning
  // useful for fine-tuning horizontal positioning when using left anchor positions
  // defaults to 20 if not specified
  leftOffset?: number;
}

