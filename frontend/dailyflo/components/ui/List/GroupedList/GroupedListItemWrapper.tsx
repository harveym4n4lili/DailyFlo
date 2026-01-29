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
  
  /** Optional background color override (defaults to theme elevated background) */
  backgroundColor?: string;
  
  /** Optional border width (no border when undefined) */
  borderWidth?: number;
  
  /** Optional border color (defaults to theme border when borderWidth is set) */
  borderColor?: string;
  
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
  backgroundColor,
  borderWidth,
  borderColor,
  style,
}) => {
  // get theme-aware colors for default background and border when props not provided
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
  // use backgroundColor prop when provided, otherwise theme elevated background
  // when borderWidth is set, apply border (borderColor defaults to theme border)
  const containerStyle: ViewStyle = {
    backgroundColor: backgroundColor ?? themeColors.background.primarySecondaryBlend(),
    overflow: 'hidden', // ensure border radius is applied correctly
    ...(borderWidth != null && borderWidth > 0
      ? { borderWidth, borderColor: borderColor ?? themeColors.border.primary() }
      : {}),
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

