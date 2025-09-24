/**
 * Typography Hook
 * 
 * This hook provides easy access to the typography system in components.
 * It automatically handles platform detection and provides type-safe typography access.
 * 
 * Usage:
 * const typography = useTypography();
 * const headingStyle = typography.getTextStyle('heading-1');
 * const fontFamily = typography.getFontFamily();
 */

import { Platform } from 'react-native';
import {
  FontFamily,
  FontWeight,
  TextStyles,
  LineHeight,
  LetterSpacing,
  ResponsiveTypography,
  getTextStyle,
  getFontFamily,
  getResponsiveFontSize,
  createTextStyle,
  type TextStyleName,
  type FontWeightValue,
  type LineHeightValue,
  type LetterSpacingValue,
  type ResponsiveScale,
  type Platform as TypographyPlatform,
} from '@/constants/Typography';

/**
 * Typography hook return type
 */
export interface TypographyReturn {
  // platform information
  platform: TypographyPlatform;
  isIOS: boolean;
  isAndroid: boolean;
  isWeb: boolean;
  
  // typography constants
  fontFamily: typeof FontFamily;
  fontWeight: typeof FontWeight;
  textStyles: typeof TextStyles;
  lineHeight: typeof LineHeight;
  letterSpacing: typeof LetterSpacing;
  responsive: typeof ResponsiveTypography;
  
  // utility functions
  getTextStyle: (styleName: TextStyleName) => typeof TextStyles[TextStyleName];
  getFontFamily: (platform?: TypographyPlatform) => string;
  getResponsiveFontSize: (baseSize: number, screenSize?: ResponsiveScale) => number;
  createTextStyle: (fontSize: number, lineHeight?: number, fontWeight?: string, letterSpacing?: number) => any;
}

/**
 * useTypography Hook
 * 
 * Provides access to the complete typography system with platform awareness.
 * Automatically detects the current platform and provides appropriate font families.
 * 
 * @returns Typography object with all typography constants and utility functions
 */
export function useTypography(): TypographyReturn {
  // detect current platform
  const currentPlatform = Platform.OS as TypographyPlatform;
  
  return {
    // platform information
    platform: currentPlatform,
    isIOS: currentPlatform === 'ios',
    isAndroid: currentPlatform === 'android',
    isWeb: currentPlatform === 'web',
    
    // typography constants
    fontFamily: FontFamily,
    fontWeight: FontWeight,
    textStyles: TextStyles,
    lineHeight: LineHeight,
    letterSpacing: LetterSpacing,
    responsive: ResponsiveTypography,
    
    // utility functions with platform context
    getTextStyle: (styleName: TextStyleName) => getTextStyle(styleName),
    
    getFontFamily: (platform?: TypographyPlatform) => 
      getFontFamily(platform || currentPlatform),
    
    getResponsiveFontSize: (baseSize: number, screenSize: ResponsiveScale = 'mobile') => 
      getResponsiveFontSize(baseSize, screenSize),
    
    createTextStyle: (fontSize: number, lineHeight?: number, fontWeight?: string, letterSpacing?: number) => 
      createTextStyle(fontSize, lineHeight, fontWeight, letterSpacing),
  };
}

/**
 * useTextStyles Hook
 * 
 * Simplified hook for accessing text styles only.
 * Useful when you only need predefined text styles.
 * 
 * @returns Object with text style getter functions
 */
export function useTextStyles() {
  const { getTextStyle } = useTypography();
  
  return {
    // direct access to common text styles
    heading1: () => getTextStyle('heading-1'),
    heading2: () => getTextStyle('heading-2'),
    heading3: () => getTextStyle('heading-3'),
    heading4: () => getTextStyle('heading-4'),
    bodyLarge: () => getTextStyle('body-large'),
    bodyMedium: () => getTextStyle('body-medium'),
    bodySmall: () => getTextStyle('body-small'),
    buttonPrimary: () => getTextStyle('button-primary'),
    buttonSecondary: () => getTextStyle('button-secondary'),
    buttonText: () => getTextStyle('button-text'),
    navbar: () => getTextStyle('navbar'),
    
    // utility function
    getTextStyle,
  };
}

/**
 * useFontFamily Hook
 * 
 * Simplified hook for accessing font family information only.
 * Useful when you only need font family with fallbacks.
 * 
 * @returns Object with font family getter functions
 */
export function useFontFamily() {
  const { getFontFamily, platform, isIOS, isAndroid, isWeb } = useTypography();
  
  return {
    // platform information
    platform,
    isIOS,
    isAndroid,
    isWeb,
    
    // direct access to font family
    primary: () => getFontFamily(),
    ios: () => getFontFamily('ios'),
    android: () => getFontFamily('android'),
    web: () => getFontFamily('web'),
    
    // utility function
    getFontFamily,
  };
}

/**
 * useResponsiveTypography Hook
 * 
 * Simplified hook for accessing responsive typography only.
 * Useful when you need to scale typography for different screen sizes.
 * 
 * @returns Object with responsive typography functions
 */
export function useResponsiveTypography() {
  const { getResponsiveFontSize, responsive } = useTypography();
  
  return {
    // responsive scaling factors
    mobile: responsive.mobile.scale,
    tablet: responsive.tablet.scale,
    desktop: responsive.desktop.scale,
    
    // direct access to responsive font sizes
    getMobileSize: (baseSize: number) => getResponsiveFontSize(baseSize, 'mobile'),
    getTabletSize: (baseSize: number) => getResponsiveFontSize(baseSize, 'tablet'),
    getDesktopSize: (baseSize: number) => getResponsiveFontSize(baseSize, 'desktop'),
    
    // utility function
    getResponsiveFontSize,
  };
}

/**
 * Typography Hook Usage Examples
 * 
 * BASIC USAGE:
 * ```tsx
 * import { useTypography } from '@/hooks/useTypography';
 * 
 * function MyComponent() {
 *   const typography = useTypography();
 *   
 *   return (
 *     <Text style={{
 *       ...typography.getTextStyle('heading-1'),
 *       fontFamily: typography.getFontFamily(),
 *     }}>
 *       Main Title
 *     </Text>
 *   );
 * }
 * ```
 * 
 * TEXT STYLES ONLY:
 * ```tsx
 * import { useTextStyles } from '@/hooks/useTypography';
 * 
 * function Heading({ children }) {
 *   const textStyles = useTextStyles();
 *   
 *   return (
 *     <Text style={textStyles.heading2()}>
 *       {children}
 *     </Text>
 *   );
 * }
 * ```
 * 
 * FONT FAMILY ONLY:
 * ```tsx
 * import { useFontFamily } from '@/hooks/useTypography';
 * 
 * function CustomText({ children }) {
 *   const fontFamily = useFontFamily();
 *   
 *   return (
 *     <Text style={{ fontFamily: fontFamily.primary() }}>
 *       {children}
 *     </Text>
 *   );
 * }
 * ```
 * 
 * RESPONSIVE TYPOGRAPHY:
 * ```tsx
 * import { useResponsiveTypography } from '@/hooks/useTypography';
 * 
 * function ResponsiveText({ children }) {
 *   const responsive = useResponsiveTypography();
 *   
 *   return (
 *     <Text style={{ 
 *       fontSize: responsive.getTabletSize(16) 
 *     }}>
 *       {children}
 *     </Text>
 *   );
 * }
 * ```
 * 
 * COMBINED WITH COLORS:
 * ```tsx
 * import { useTypography } from '@/hooks/useTypography';
 * import { useColorPalette } from '@/hooks/useColorPalette';
 * 
 * function StyledText({ children, variant = 'body-large' }) {
 *   const typography = useTypography();
 *   const colors = useColorPalette();
 *   
 *   return (
 *     <Text style={{
 *       ...typography.getTextStyle(variant),
 *       fontFamily: typography.getFontFamily(),
 *       color: colors.themeColors.text.primary,
 *     }}>
 *       {children}
 *     </Text>
 *   );
 * }
 * ```
 */

/**
 * Default export for convenience
 */
export default useTypography;
