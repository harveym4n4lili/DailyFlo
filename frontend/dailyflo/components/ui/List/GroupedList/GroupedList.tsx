/**
 * GroupedList Component
 * 
 * Flexible iOS-style grouped list component that displays multiple items in a rounded container.
 * Can accept ANY ReactNode as children, making it completely flexible.
 * 
 * Automatically handles:
 * - Border radius on first/last items
 * - Separator lines between items
 * - Theme-aware colors
 * 
 * Usage with custom children:
 * <GroupedList>
 *   <CustomComponent1 />
 *   <CustomComponent2 />
 *   <CustomComponent3 />
 * </GroupedList>
 * 
 * Usage with button-style items (for settings pages):
 * <GroupedList>
 *   <GroupedListButton icon="calendar" label="Date" value="Today" onPress={() => {}} />
 *   <GroupedListButton icon="time" label="Time" value="9:00 AM" onPress={() => {}} />
 * </GroupedList>
 */

import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useThemeColors } from '@/hooks/useColorPalette';
import { GroupedListItemWrapper } from './GroupedListItemWrapper';
import type { GroupedListProps } from './GroupedList.types';

export const GroupedList: React.FC<GroupedListProps> = ({
  children,
  containerStyle,
  separatorColor,
  borderRadius = 12, // default iOS-style border radius
}) => {
  // get theme-aware colors for default separator color
  const themeColors = useThemeColors();
  
  // use provided separator color or default to theme border color
  const finalSeparatorColor = separatorColor || themeColors.border.primary();

  // convert children to array for easier manipulation
  // React.Children.toArray handles both single child and multiple children
  const childrenArray = React.Children.toArray(children);

  // determine position of each item in the list
  // this is used to apply correct border radius
  const getItemPosition = (index: number): 'first' | 'middle' | 'last' | 'only' => {
    const totalItems = childrenArray.length;
    
    // single item gets all corners rounded
    if (totalItems === 1) {
      return 'only';
    }
    
    // first item gets top corners rounded
    if (index === 0) {
      return 'first';
    }
    
    // last item gets bottom corners rounded
    if (index === totalItems - 1) {
      return 'last';
    }
    
    // middle items get no rounded corners
    return 'middle';
  };

  // helper function to extract key from child element
  // tries to get key from React element, otherwise falls back to index
  const getChildKey = (child: React.ReactNode, index: number): string | number => {
    if (React.isValidElement(child) && child.key != null) {
      return child.key;
    }
    return index;
  };

  return (
    <View style={[{ gap: 0 }, containerStyle]}>
      {childrenArray.map((child, index) => {
        const position = getItemPosition(index);
        // show separator for all items except the last one
        const showSeparator = index < childrenArray.length - 1;

        return (
          <GroupedListItemWrapper
            key={getChildKey(child, index)} // use child's key if available, otherwise use index
            position={position}
            showSeparator={showSeparator}
            borderRadius={borderRadius}
            separatorColor={finalSeparatorColor}
          >
            {child}
          </GroupedListItemWrapper>
        );
      })}
    </View>
  );
};

export default GroupedList;
