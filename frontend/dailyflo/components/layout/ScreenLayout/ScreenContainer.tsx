/**
 * ScreenContainer Component
 * 
 * This component provides a consistent layout wrapper for all screens in the app.
 * It handles safe area insets, background colors, and provides a standardized
 * container structure that follows the app's design system.
 * 
 * Key features:
 * - Safe area handling for different devices (iPhone notch, Android status bar)
 * - Theme-aware background colors
 * - Consistent padding and margins
 * - Scrollable content support
 * - Customizable styling through props
 */

import React from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  ViewProps, 
  ScrollViewProps,
  Platform 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// import theme colors for consistent styling
import { useThemeColors } from '@/hooks/useColorPalette';

/**
 * Props for the ScreenContainer component
 * 
 * These props allow customization while maintaining consistency
 */
export interface ScreenContainerProps extends ViewProps {
  // content props - determines if content should be scrollable
  scrollable?: boolean;
  
  // safe area props - control safe area behavior
  safeAreaTop?: boolean;        // whether to apply top safe area inset
  safeAreaBottom?: boolean;     // whether to apply bottom safe area inset
  
  // styling props - customize appearance
  backgroundColor?: string;     // custom background color (overrides theme)
  padding?: number;            // custom padding (default: 20)
  paddingHorizontal?: number;  // custom horizontal padding
  paddingVertical?: number;    // custom vertical padding
  
  // scroll view props - passed through when scrollable is true
  scrollViewProps?: ScrollViewProps;
  
  
  // children - the content to display inside the container
  children: React.ReactNode;
}

/**
 * ScreenContainer Component
 * 
 * A wrapper component that provides consistent layout and safe area handling
 * for all screens in the app. This ensures a uniform user experience across
 * different devices and screen sizes.
 */
export function ScreenContainer({
  // destructure props with default values
  scrollable = false,
  safeAreaTop = true,
  safeAreaBottom = true,
  backgroundColor,
  padding = 20,
  paddingHorizontal,
  paddingVertical,
  scrollViewProps,
  children,
  style,
  ...otherProps
}: ScreenContainerProps) {
  
  // get safe area insets for current device
  // these values represent the space taken by status bar, notch, home indicator, etc.
  const insets = useSafeAreaInsets();
  
  // get theme-aware background color
  // this ensures the container adapts to light/dark mode automatically
  const themeColors = useThemeColors();
  const themeBackgroundColor = themeColors.background.primary();
  
  // determine the actual background color to use
  // custom backgroundColor prop takes precedence over theme color
  const finalBackgroundColor = backgroundColor || themeBackgroundColor;
  
  // calculate safe area padding
  // only apply safe area insets if the respective props are true
  const topPadding = safeAreaTop ? insets.top : 0;
  const bottomPadding = safeAreaBottom ? insets.bottom : 0;
  
  // calculate content padding
  // use custom padding values if provided, otherwise use default padding
  const horizontalPadding = paddingHorizontal !== undefined ? paddingHorizontal : padding;
  const verticalPadding = paddingVertical !== undefined ? paddingVertical : padding;
  
  
  // create the main container styles
  // this combines all the calculated padding and background color
  const containerStyle = [
    styles.container,
    {
      backgroundColor: finalBackgroundColor,
      paddingTop: topPadding + verticalPadding,
      paddingBottom: bottomPadding + verticalPadding,
      paddingHorizontal,
    },
    style, // allow custom styles to override defaults
  ];
  
  
  // render the content based on whether it should be scrollable
  const renderContent = () => {
    if (scrollable) {
      // render scrollable content with ScrollView
      return (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingHorizontal: horizontalPadding }
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          {...scrollViewProps}
        >
          {children}
        </ScrollView>
      );
    } else {
      // render static content with View
      return (
        <View style={[styles.content, { paddingHorizontal: horizontalPadding }]}>
          {children}
        </View>
      );
    }
  };
  
  return (
    <View style={containerStyle} {...otherProps}>
      {/* render the main content */}
      {renderContent()}
    </View>
  );
}

/**
 * StyleSheet for ScreenContainer
 * 
 * These styles provide the base structure for the container.
 * Additional styling is applied through props and calculated values.
 */
const styles = StyleSheet.create({
  // main container that takes up full screen
  container: {
    flex: 1,
  },
  
  // content area for non-scrollable content
  content: {
    flex: 1,
  },
  
  // scroll view container
  scrollView: {
    flex: 1,
  },
  
  // scroll view content container
  scrollContent: {
    flexGrow: 1,
  },
});

export default ScreenContainer;
