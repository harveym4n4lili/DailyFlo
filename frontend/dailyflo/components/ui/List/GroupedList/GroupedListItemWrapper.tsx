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
import { DashedSeparator, SolidSeparator } from '@/components/ui/borders';

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

  /** Separator style: 'dashed' or 'solid' full line */
  separatorVariant?: 'dashed' | 'solid';
  
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

  /**
   * Visual style: roundedStyle (background, radius, inset separators) or lineStyle (no bg, full-length top/bottom borders)
   */
  listStyle?: 'roundedStyle' | 'lineStyle';

  /** Optional style override */
  style?: ViewStyle;

  /** Vertical padding applied to the wrapper itself (paddingTop and paddingBottom) */
  itemWrapperPaddingVertical?: number;
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
  separatorVariant = 'dashed',
  backgroundColor,
  borderWidth,
  borderColor,
  contentPaddingHorizontal,
  contentPaddingVertical,
  contentMinHeight,
  listStyle = 'roundedStyle',
  style,
  itemWrapperPaddingVertical,
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

  // when borderWidth is set (roundedStyle only), draw only the edges that form the group outline
  // first: top + left + right; middle: left + right; last: bottom + left + right; only: all four
  const getBorderEdgeStyle = (): ViewStyle => {
    if (listStyle === 'lineStyle' || borderWidth == null || borderWidth <= 0) return {};
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

  // lineStyle: full-length top and bottom borders on each item; first/only get top, all except last get bottom
  const getLineStyleBorders = (): ViewStyle => {
    if (listStyle !== 'lineStyle') return {};
    const c = separatorColor;
    const w = StyleSheet.hairlineWidth;
    const hasTop = position === 'first' || position === 'only';
    const hasBottom = showSeparator || position === 'only';
    return {
      ...(hasTop && { borderTopWidth: w, borderTopColor: c }),
      ...(hasBottom && { borderBottomWidth: w, borderBottomColor: c }),
    };
  };

  // outer container: background, border radius, minHeight; no overflow so separator is not clipped
  // lineStyle: transparent background, no radius, full-length top/bottom borders instead of inset separator
  // itemWrapperPaddingVertical adds vertical padding to the wrapper itself (separate from content padding)
  // when separator exists, only apply paddingTop (paddingBottom is handled by separator margin for equal spacing)
  const outerStyle: ViewStyle = {
    backgroundColor:
      listStyle === 'lineStyle'
        ? 'transparent'
        : (backgroundColor ?? themeColors.background.primarySecondaryBlend()),
    ...(listStyle === 'roundedStyle' ? getBorderRadiusStyle() : {}),
    ...getBorderEdgeStyle(),
    ...getLineStyleBorders(),
    ...(contentMinHeight != null && { minHeight: contentMinHeight }),
    // apply paddingTop to all items, paddingBottom only when no separator (last item)
    ...(itemWrapperPaddingVertical != null && {
      paddingTop: itemWrapperPaddingVertical,
      ...(!showSeparator && { paddingBottom: itemWrapperPaddingVertical }),
    }),
    ...style,
  };

  // content clip: overflow hidden + border radius clips content to rounded shape; separator stays outside to avoid clipping glitch
  // only for first/last/only - middle items skip to avoid layout flash on mount
  const needsContentClip = listStyle === 'roundedStyle' && position !== 'middle';
  const contentClipStyle: ViewStyle =
    needsContentClip
      ? { overflow: 'hidden' as const, ...getBorderRadiusStyle() }
      : {};

  // inner wrapper: same vertical and horizontal padding so content has space on all sides; separator is outside this
  // both styles use content padding; lineStyle uses borders instead of separate separator view
  // FormDetailButton content is already vertically centered via alignItems: 'center', so wrapper padding won't affect centering
  const hasContentPadding =
    contentPaddingHorizontal != null || contentPaddingVertical != null;
  const contentWrapperStyle: ViewStyle = hasContentPadding
    ? {
        ...(contentPaddingHorizontal != null && { paddingHorizontal: contentPaddingHorizontal }),
        ...(contentPaddingVertical != null && { paddingVertical: contentPaddingVertical }),
      }
    : {};

  const content = (
    <View style={contentWrapperStyle}>
      {children}
    </View>
  );

  return (
    <View style={outerStyle}>
      {needsContentClip ? (
        <View style={contentClipStyle}>{content}</View>
      ) : (
        content
      )}
      {/* roundedStyle only: separator below padded content, outside overflow container to prevent first-separator clipping glitch */}
      {/* collapsable={false} on SolidSeparator prevents view flattening that can cause flash on mount */}
      {listStyle === 'roundedStyle' && showSeparator && (
        separatorVariant === 'solid' ? (
          <SolidSeparator
            paddingLeft={separatorInsetLeft}
            paddingRight={separatorInsetRight}
            color={separatorColor}
            style={itemWrapperPaddingVertical != null ? { marginTop: itemWrapperPaddingVertical } : undefined}
            collapsable={false}
          />
        ) : (
          <DashedSeparator
            paddingLeft={separatorInsetLeft}
            paddingRight={separatorInsetRight}
            style={itemWrapperPaddingVertical != null ? { marginTop: itemWrapperPaddingVertical } : undefined}
          />
        )
      )}
    </View>
  );
};

export default GroupedListItemWrapper;

