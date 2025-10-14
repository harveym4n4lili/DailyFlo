/**
 * GroupedList Component
 * 
 * iOS-style grouped list component that displays multiple items in a rounded container.
 * Replicates the iOS Settings app list style with automatic handling of:
 * - Border radius on first/last items
 * - Separator lines between items
 * - Theme-aware colors
 * 
 * Usage:
 * <GroupedList
 *   items={[
 *     {
 *       id: 'date',
 *       icon: 'calendar-outline',
 *       label: 'Date Picker',
 *       value: 'Today',
 *       onPress: () => {},
 *     },
 *     // ... more items
 *   ]}
 * />
 */

import React from 'react';
import { View } from 'react-native';
import { useThemeColors } from '@/hooks/useColorPalette';
import { GroupedListItem } from './GroupedListItem';
import type { GroupedListProps } from './GroupedList.types';

export const GroupedList: React.FC<GroupedListProps> = ({
  items,
  containerStyle,
  itemStyle,
  separatorColor,
  borderRadius = 12, // default iOS-style border radius
}) => {
  // get theme-aware colors for default separator color
  const themeColors = useThemeColors();
  
  // use provided separator color or default to theme border color
  const finalSeparatorColor = separatorColor || themeColors.border.primary();

  // determine position of each item in the list
  // this is used to apply correct border radius
  const getItemPosition = (index: number): 'first' | 'middle' | 'last' | 'only' => {
    const totalItems = items.length;
    
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

  return (
    <View style={[{ gap: 0 }, containerStyle]}>
      {items.map((item, index) => {
        const position = getItemPosition(index);
        // show separator for all items except the last one
        const showSeparator = index < items.length - 1;

        return (
          <GroupedListItem
            key={item.id}
            config={item}
            position={position}
            showSeparator={showSeparator}
            borderRadius={borderRadius}
            separatorColor={finalSeparatorColor}
            itemStyle={itemStyle}
          />
        );
      })}
    </View>
  );
};

export default GroupedList;

