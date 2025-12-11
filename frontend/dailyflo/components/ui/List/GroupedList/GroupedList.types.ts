/**
 * TypeScript Types for GroupedList Component
 * 
 * Defines the interfaces and types for the flexible iOS-style grouped list component.
 * The component can accept any ReactNode as children, making it completely flexible.
 */

import { ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Props for the main GroupedList component
 * 
 * Now accepts any ReactNode children instead of config items.
 * This makes the component completely flexible.
 */
export interface GroupedListProps {
  // children can be any ReactNode (single element or array)
  // this allows complete flexibility - any component can be used as a list item
  children: React.ReactNode;
  
  // optional style overrides for the entire container
  containerStyle?: ViewStyle;
  
  // custom separator color (defaults to theme border color)
  separatorColor?: string;
  
  // custom border radius for first/last items (defaults to 12)
  borderRadius?: number;
}

/**
 * Props for GroupedListButton component
 * 
 * Button-style item for settings pages and similar use cases.
 * This is the extracted button-style functionality from the original GroupedListItem.
 */
export interface GroupedListButtonProps {
  // icon name from Ionicons library (e.g., 'calendar-outline')
  // optional - if not provided, no icon will be shown
  icon?: keyof typeof Ionicons.glyphMap;
  
  // main label text displayed on the left (e.g., 'Date Picker')
  label: string;
  
  // value text displayed on the right (e.g., 'Today', 'Optional')
  // can be a string or a custom React component for complex displays
  value: string | React.ReactNode;
  
  // optional secondary value text displayed next to the main value
  // used for additional context (e.g., relative dates like 'Today', 'Tomorrow')
  secondaryValue?: string;
  
  // callback function when the item is pressed
  onPress: () => void;
  
  // whether the item is disabled (grayed out, no interaction)
  disabled?: boolean;
  
  // optional custom styles to override defaults for this specific item
  customStyles?: {
    // override the entire item container style
    container?: ViewStyle;
    // override icon size and color
    icon?: {
      size?: number;
      color?: string;
    };
    // override label text style
    label?: TextStyle;
    // override value text style
    value?: TextStyle;
    // override secondary value text style
    secondaryValue?: TextStyle;
  };
}

/**
 * Configuration for a single item in the grouped list (DEPRECATED)
 * 
 * @deprecated Use GroupedListButton component instead, or pass custom ReactNode children to GroupedList
 * This type is kept for backward compatibility but is no longer used by GroupedList.
 */
export interface GroupedListItemConfig {
  // unique identifier for the item (used as React key)
  id: string;
  
  // icon name from Ionicons library (e.g., 'calendar-outline')
  icon: keyof typeof Ionicons.glyphMap;
  
  // main label text displayed on the left (e.g., 'Date Picker')
  label: string;
  
  // value text displayed on the right (e.g., 'Today', 'Optional')
  // can be a string or a custom React component for complex displays
  value: string | React.ReactNode;
  
  // optional secondary value text displayed next to the main value
  // used for additional context (e.g., relative dates like 'Today', 'Tomorrow')
  secondaryValue?: string;
  
  // callback function when the item is pressed
  onPress: () => void;
  
  // whether the item is disabled (grayed out, no interaction)
  disabled?: boolean;
  
  // optional custom styles to override defaults for this specific item
  customStyles?: {
    // override the entire item container style
    container?: ViewStyle;
    // override icon size and color
    icon?: {
      size?: number;
      color?: string;
    };
    // override label text style
    label?: TextStyle;
    // override value text style
    value?: TextStyle;
    // override secondary value text style
    secondaryValue?: TextStyle;
  };
}

/**
 * Props for the individual GroupedListItem component (DEPRECATED)
 * 
 * @deprecated This component is no longer used. Use GroupedListButton wrapped in GroupedList instead.
 * This type is kept for backward compatibility.
 */
export interface GroupedListItemProps {
  // the item configuration
  config: GroupedListItemConfig;
  
  // position in the list determines which corners get rounded
  position: 'first' | 'middle' | 'last' | 'only';
  
  // whether to show separator line below this item
  showSeparator: boolean;
  
  // border radius value (passed down from parent)
  borderRadius: number;
  
  // separator color (passed down from parent)
  separatorColor: string;
  
  // optional style override from parent
  itemStyle?: ViewStyle;
}
