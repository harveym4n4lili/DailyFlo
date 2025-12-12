/**
 * GroupedListItemWrapper Component
 * 
 * Wrapper component that applies border radius and separator styling to any child element.
 * Used internally by GroupedList to style items based on their position.
 * This allows GroupedList to accept any custom ReactNode as children.
 */

import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useThemeColors } from '@/hooks/useColorPalette';

export interface GroupedListItemWrapperProps {
  /** The child element to wrap */
  children: React.ReactNode;
  
  /** Position in the list determines which corners get rounded */
  position: 'first' | 'middle' | 'last' | 'only';
  
  /** Whether to show separator line below this item */
  showSeparator: boolean;
  
  /** Border radius value */
  borderRadius: number;
  
  /** Separator color */
  separatorColor: string;
  
  /** Optional style override */
  style?: ViewStyle;
}

/**
 * GroupedListItemWrapper Component
 * 
 * Wraps any child element with appropriate border radius and separator styling
 * based on its position in the list.
 */
export const GroupedListItemWrapper: React.FC<GroupedListItemWrapperProps> = ({
  children,
  position,
  showSeparator,
  borderRadius,
  separatorColor,
  style,
}) => {
  // get theme-aware colors for default background
  const themeColors = useThemeColors();

  // determine which corners should be rounded based on item position
  // first item: round top corners
  // last item: round bottom corners
  // middle items: no rounded corners
  // only item: round all corners
  const getBorderRadiusStyle = (): ViewStyle => {
    switch (position) {
      case 'first':
        return {
          borderTopLeftRadius: borderRadius,
          borderTopRightRadius: borderRadius,
        };
      case 'last':
        return {
          borderBottomLeftRadius: borderRadius,
          borderBottomRightRadius: borderRadius,
        };
      case 'only':
        return {
          borderRadius: borderRadius,
        };
      case 'middle':
      default:
        return {};
    }
  };

  // combine all container styles
  // removed borderBottomWidth/Color from here since we're using a separate separator View
  const containerStyle: ViewStyle = {
    backgroundColor: themeColors.background.elevated(),
    overflow: 'hidden', // ensure border radius is applied correctly
    ...getBorderRadiusStyle(),
    ...style, // allow parent-level override
  };

  return (
    <View style={containerStyle}>
      {children}
      {/* separator line with horizontal padding - only shown for items that need it */}
      {/* creates a horizontal line between items with padding on the sides */}
      {showSeparator && (
        <View
          style={{
            height: 1, // 1px separator line
            backgroundColor: separatorColor,
            marginHorizontal: 16, // horizontal padding for the separator (16px on each side)
          }}
        />
      )}
    </View>
  );
};

export default GroupedListItemWrapper;

