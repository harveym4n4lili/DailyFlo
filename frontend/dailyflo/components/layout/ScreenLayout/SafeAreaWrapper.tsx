/**
 * SafeAreaWrapper Component
 * 
 * This component provides safe area handling for specific parts of the UI
 * that need to respect device-specific safe areas (notches, status bars, etc.).
 * It's more focused than ScreenContainer and can be used for individual
 * components or sections within a screen.
 * 
 * Key features:
 * - Targeted safe area handling (top, bottom, left, right)
 * - Theme-aware background colors
 * - Flexible padding options
 * - Can be nested within other containers
 */

import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// import theme colors for consistent styling
import { useThemeColors } from '@/hooks/useColorPalette';

/**
 * Props for the SafeAreaWrapper component
 */
export interface SafeAreaWrapperProps extends ViewProps {
  // safe area props - control which safe areas to apply
  safeAreaTop?: boolean;        // whether to apply top safe area inset
  safeAreaBottom?: boolean;     // whether to apply bottom safe area inset
  safeAreaLeft?: boolean;       // whether to apply left safe area inset
  safeAreaRight?: boolean;      // whether to apply right safe area inset
  
  // styling props - customize appearance
  backgroundColor?: string;     // custom background color (overrides theme)
  padding?: number;            // additional padding beyond safe area
  
  // children - the content to display inside the wrapper
  children: React.ReactNode;
}

/**
 * SafeAreaWrapper Component
 * 
 * A focused component for handling safe areas in specific UI sections.
 * Use this when you need safe area handling for individual components
 * rather than entire screens.
 */
export function SafeAreaWrapper({
  // destructure props with default values
  safeAreaTop = false,
  safeAreaBottom = false,
  safeAreaLeft = false,
  safeAreaRight = false,
  backgroundColor,
  padding = 0,
  children,
  style,
  ...otherProps
}: SafeAreaWrapperProps) {
  
  // get safe area insets for current device
  const insets = useSafeAreaInsets();
  
  // get theme-aware background color
  const themeColors = useThemeColors();
  const themeBackgroundColor = themeColors.background.primary();
  
  // determine the actual background color to use
  const finalBackgroundColor = backgroundColor || themeBackgroundColor;
  
  // calculate safe area padding
  const topPadding = safeAreaTop ? insets.top : 0;
  const bottomPadding = safeAreaBottom ? insets.bottom : 0;
  const leftPadding = safeAreaLeft ? insets.left : 0;
  const rightPadding = safeAreaRight ? insets.right : 0;
  
  // create the wrapper styles
  const wrapperStyle = [
    styles.wrapper,
    {
      backgroundColor: finalBackgroundColor,
      paddingTop: topPadding + padding,
      paddingBottom: bottomPadding + padding,
      paddingLeft: leftPadding + padding,
      paddingRight: rightPadding + padding,
    },
    style, // allow custom styles to override defaults
  ];
  
  return (
    <View style={wrapperStyle} {...otherProps}>
      {children}
    </View>
  );
}

/**
 * StyleSheet for SafeAreaWrapper
 */
const styles = StyleSheet.create({
  // wrapper container
  wrapper: {
    // flex: 1 is not set by default to allow flexible sizing
  },
});

/**
 * Default export for convenience
 */
export default SafeAreaWrapper;
