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
 * Usage with button-style items (for task forms):
 * <GroupedList>
 *   <FormDetailButton icon="calendar" label="Date" value="Today" onPress={() => {}} />
 *   <FormDetailButton icon="time" label="Time" value="9:00 AM" onPress={() => {}} />
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
  separatorInsetLeft = 0,
  separatorInsetRight = 0,
  borderRadius = 28, // default iOS-style border radius
  backgroundColor,
  borderWidth,
  borderColor,
  contentPaddingHorizontal = 20,
  contentPaddingVertical = 14,
  contentMinHeight = 44,
  listStyle = 'roundedStyle',
  minimalStyle = false,
  fullWidthSeparators = false,
}) => {
  // get theme-aware colors for default separator color
  const themeColors = useThemeColors();

  // when minimalStyle is true, remove h/v padding, background, border radius, and min height from item wrappers
  const finalContentPaddingHorizontal = minimalStyle ? 0 : contentPaddingHorizontal;
  const finalContentPaddingVertical = minimalStyle ? 0 : contentPaddingVertical;
  const finalBackgroundColor = minimalStyle ? 'transparent' : backgroundColor;
  const finalBorderRadius = minimalStyle ? 0 : borderRadius;
  const finalContentMinHeight = minimalStyle ? undefined : contentMinHeight;

  // when fullWidthSeparators is true, separators span full width (no inset)
  const finalSeparatorInsetLeft = fullWidthSeparators ? 0 : separatorInsetLeft;
  const finalSeparatorInsetRight = fullWidthSeparators ? 0 : separatorInsetRight;

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
        const showSeparator = index < childrenArray.length - 1;
        return (
          <GroupedListItemWrapper
            key={getChildKey(child, index)}
            position={position}
            showSeparator={showSeparator}
            borderRadius={finalBorderRadius}
            separatorColor={finalSeparatorColor}
            separatorInsetLeft={finalSeparatorInsetLeft}
            separatorInsetRight={finalSeparatorInsetRight}
            backgroundColor={finalBackgroundColor}
            borderWidth={borderWidth}
            borderColor={borderColor}
            contentPaddingHorizontal={finalContentPaddingHorizontal}
            contentPaddingVertical={finalContentPaddingVertical}
            contentMinHeight={finalContentMinHeight}
            listStyle={listStyle}
          >
            {child}
          </GroupedListItemWrapper>
        );
      })}
    </View>
  );
};

export default GroupedList;
