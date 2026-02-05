/**
 * GroupedListItemWrapper Component
 * 
 * Wrapper component that applies border radius and separator styling to any child element.
 * Used internally by GroupedList to style items based on their position.
 * This allows GroupedList to accept any custom ReactNode as children.
 */

import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
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
  
  /** Left inset for separator line in pt (0 = align to left edge) */
  separatorInsetLeft?: number;
  /** Right inset for separator line in pt (0 = align to right edge) */
  separatorInsetRight?: number;
  
  /** Optional background color override (defaults to theme elevated background) */
  backgroundColor?: string;
  
  /** Optional border width (no border when undefined). When set, only the edges that form the group outline are drawn (first: top+left+right, middle: left+right, last: bottom+left+right). */
  borderWidth?: number;
  
  /** Optional border color (defaults to theme border when borderWidth is set) */
  borderColor?: string;

  /** Content padding and min height (passed from GroupedList; when set, applied so button padding lives on wrapper) */
  contentPaddingHorizontal?: number;
  contentPaddingVertical?: number;
  contentMinHeight?: number;
  
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
  separatorInsetLeft = 0,
  separatorInsetRight = 0,
  backgroundColor,
  borderWidth,
  borderColor,
  contentPaddingHorizontal,
  contentPaddingVertical,
  contentMinHeight,
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

  // when borderWidth is set, draw only the edges that form the group outline (no double lines between rows)
  // first: top + left + right; middle: left + right; last: bottom + left + right; only: all four
  const getBorderEdgeStyle = (): ViewStyle => {
    if (borderWidth == null || borderWidth <= 0) return {};
    const c = borderColor ?? themeColors.border.primary();
    const w = borderWidth;
    switch (position) {
      case 'first':
        return { borderTopWidth: w, borderLeftWidth: w, borderRightWidth: w, borderColor: c };
      case 'middle':
        return { borderLeftWidth: w, borderRightWidth: w, borderColor: c };
      case 'last':
        return { borderBottomWidth: w, borderLeftWidth: w, borderRightWidth: w, borderColor: c };
      case 'only':
        return { borderWidth: w, borderColor: c };
      default:
        return {};
    }
  };

  // outer container: background, border radius, minHeight; no padding so separator can sit below padded content
  const outerStyle: ViewStyle = {
    backgroundColor: backgroundColor ?? themeColors.background.primarySecondaryBlend(),
    overflow: 'hidden',
    ...getBorderRadiusStyle(),
    ...getBorderEdgeStyle(),
    ...(contentMinHeight != null && { minHeight: contentMinHeight }),
    ...style,
  };

  // inner wrapper: same vertical and horizontal padding so content has space on all sides; separator is outside this
  const hasContentPadding =
    contentPaddingHorizontal != null || contentPaddingVertical != null;
  const contentWrapperStyle: ViewStyle = hasContentPadding
    ? {
        ...(contentPaddingHorizontal != null && { paddingHorizontal: contentPaddingHorizontal }),
        ...(contentPaddingVertical != null && { paddingVertical: contentPaddingVertical }),
      }
    : {};

  return (
    <View style={outerStyle}>
      <View style={contentWrapperStyle}>
        {children}
      </View>
      {/* separator below padded content so borders don't touch the item */}
      {showSeparator && (
        <View
          style={{
            height: StyleSheet.hairlineWidth,
            backgroundColor: separatorColor,
            ...(separatorInsetLeft > 0 && { marginLeft: separatorInsetLeft }),
            ...(separatorInsetRight > 0 && { marginRight: separatorInsetRight }),
          }}
        />
      )}
    </View>
  );
};

export default GroupedListItemWrapper;

