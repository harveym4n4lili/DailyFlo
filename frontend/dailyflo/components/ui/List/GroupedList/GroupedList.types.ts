/**
 * TypeScript Types for GroupedList Component
 * 
 * Defines the interfaces and types for the iOS-style grouped list component.
 * This component replicates the iOS Settings app list style with rounded containers
 * and separator lines between items.
 */

import { ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Configuration for a single item in the grouped list
 * Each item represents one row with icon, label, value, and action
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
 * Props for the main GroupedList component
 */
export interface GroupedListProps {
  // array of item configurations that make up the list
  items: GroupedListItemConfig[];
  
  // optional style overrides for the entire container
  containerStyle?: ViewStyle;
  
  // optional style overrides that apply to all items
  itemStyle?: ViewStyle;
  
  // custom separator color (defaults to theme border color)
  separatorColor?: string;
  
  // custom border radius for first/last items (defaults to 12)
  borderRadius?: number;
}

/**
 * Props for the individual GroupedListItem component
 * This is used internally by GroupedList
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

