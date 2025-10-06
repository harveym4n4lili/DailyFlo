/**
 * Typography System Constants
 * 
 * This file implements the complete typography system following the design system
 * specifications. It provides font families, weights, text styles, and utility
 * functions for consistent typography usage throughout the app.
 * 
 * The typography system is organized into:
 * - Font families (primary and fallback fonts)
 * - Font weights (light, regular, medium, semibold, bold)
 * - Text styles (headings, body text, buttons, navigation)
 * - Line heights and letter spacing
 * - Responsive typography scaling
 * - Utility functions for typography usage
 */

/**
 * Font Family Configuration
 * 
 * Defines the primary font (Satoshi) and fallback fonts for different platforms.
 * Fallback fonts ensure text displays properly even if the primary font fails to load.
 */
export const FontFamily = {
  // primary font family - Satoshi is the main brand font
  // this is the base name - we'll add specific weights when using fonts
  primary: 'Satoshi',
  
  // fallback fonts for different platforms
  // these are used if the primary font fails to load
  fallback: {
    // iOS fallback fonts - these are system fonts that look good on iOS
    ios: ['SF Pro Display', '-apple-system'],
    // Android fallback fonts - these are system fonts that look good on Android
    android: ['Roboto', 'sans-serif'],
    // web fallback fonts - these are web-safe fonts
    web: ['system-ui', 'sans-serif'],
  },
} as const;

/**
 * Font Weight Configuration
 * 
 * Defines all available font weights using Satoshi's actual weight values.
 * These correspond to the actual font files you'll need to include.
 */
export const FontWeight = {
  // light weight - used for subtle text, captions
  light: '400',
  // regular weight - used for body text, most content
  regular: '500',
  // medium weight - used for buttons, emphasized text
  medium: '600',
  // semibold weight - used for headings, important text
  semibold: '700',
  // bold weight - used for main headings, strong emphasis
  bold: '900',
} as const;

/**
 * Text Style Definitions
 * 
 * These are the predefined text styles that match your design system.
 * Each style includes fontSize, lineHeight, and fontWeight properties.
 * Use these instead of writing custom styles to maintain consistency.
 */
export const TextStyles = {
  // heading styles - for titles and section headers
  'heading-1': {
    fontSize: 36,        // large title size
    lineHeight: 40,      // tight line height for headings
    fontWeight: FontWeight.bold,  // bold weight for emphasis
    fontFamily: 'Satoshi-Bold',  // specific font family for react native
  },
  'heading-2': {
    fontSize: 24,        // medium title size
    lineHeight: 28,      // slightly tighter than body text
    fontWeight: FontWeight.bold,  // bold weight for emphasis
    fontFamily: 'Satoshi-Bold',  // specific font family for react native
  },
  'heading-3': {
    fontSize: 18,        // small title size
    lineHeight: 22,      // comfortable line height
    fontWeight: FontWeight.bold,  // bold for medium emphasis
    fontFamily: 'Satoshi-Bold',  // specific font family for react native
  },
  'heading-4': {
    fontSize: 16,        // section header size
    lineHeight: 20,      // standard line height
    fontWeight: FontWeight.bold,  // bold for emphasis
    fontFamily: 'Satoshi-Bold',  // specific font family for react native
  },
  
  // body text styles - for main content
  'body-large': {
    fontSize: 14,        // standard body text size
    lineHeight: 18,      // comfortable reading line height
    fontWeight: FontWeight.regular,  // regular weight for readability
    fontFamily: 'Satoshi',  // specific font family for react native
  },
  'body-medium': {
    fontSize: 12,        // smaller body text
    lineHeight: 16,      // tighter line height
    fontWeight: FontWeight.regular,  // regular weight
    fontFamily: 'Satoshi',  // specific font family for react native
  },
  'body-small': {
    fontSize: 10,        // smallest readable text
    lineHeight: 14,      // tight line height
    fontWeight: FontWeight.regular,  // regular weight
    fontFamily: 'Satoshi',  // specific font family for react native
  },
  
  // button text styles - for interactive elements
  'button-primary': {
    fontSize: 18,        // standard button text
    lineHeight: 20,      // comfortable line height for buttons
    fontWeight: FontWeight.bold,  // medium weight for emphasis
    fontFamily: 'Satoshi-Bold',  // specific font family for react native
  },
  'button-secondary': {
    fontSize: 16,        // same size as primary button
    lineHeight: 18,      // slightly tighter line height
    fontWeight: FontWeight.bold,  // medium weight
    fontFamily: 'Satoshi-Bold',  // specific font family for react native
  },
  'button-text': {
    fontSize: 10,        // small button text (like links)
    lineHeight: 14,      // tight line height
    fontWeight: FontWeight.medium,  // medium weight for emphasis
    fontFamily: 'Satoshi-Medium',  // specific font family for react native
  },
  
  // navigation text styles - for navigation elements
  'navbar': {
    fontSize: 10,        // small text for tab labels
    lineHeight: 12,      // very tight line height
    fontWeight: FontWeight.medium,  // medium weight for readability
    fontFamily: 'Satoshi-Medium',  // specific font family for react native
  },
} as const;

/**
 * Line Height Configuration
 * 
 * Defines standard line height values for different types of content.
 * Line height affects readability and visual spacing between lines.
 */
export const LineHeight = {
  // tight line height - used for headings and titles
  tight: 1.25,    // 25% extra space above the text
  // normal line height - used for body text
  normal: 1.5,    // 50% extra space above the text
  // relaxed line height - used for long form content
  relaxed: 1.75,  // 75% extra space above the text
} as const;

/**
 * Letter Spacing Configuration
 * 
 * Defines letter spacing values for different text sizes.
 * Letter spacing affects readability and visual appearance.
 */
export const LetterSpacing = {
  // tight letter spacing - used for large headings
  tight: -0.025,  // slightly closer letters for large text
  // normal letter spacing - used for body text
  normal: 0,      // no adjustment to default spacing
  // wide letter spacing - used for small text and caps
  wide: 0.025,    // slightly more space between letters
} as const;

/**
 * Responsive Typography Configuration
 * 
 * Defines scaling factors for different screen sizes.
 * This allows text to scale appropriately on different devices.
 */
export const ResponsiveTypography = {
  // scale factors for different screen sizes
  mobile: { 
    scale: 1,      // no scaling on mobile (base size)
  },
  tablet: { 
    scale: 1.125,  // 12.5% larger on tablets
  },
  desktop: { 
    scale: 1.25,   // 25% larger on desktop
  },
} as const;

/**
 * Typography Utility Functions
 * 
 * Helper functions for working with typography in components.
 * These provide type-safe access to typography values and common operations.
 */

/**
 * Get a text style by name
 * @param styleName - The name of the text style (e.g., 'heading-1', 'body-large')
 * @returns The text style object with fontSize, lineHeight, and fontWeight
 */
export function getTextStyle(styleName: keyof typeof TextStyles) {
  return TextStyles[styleName];
}

/**
 * Get font family with fallbacks
 * @param platform - The platform ('ios', 'android', 'web')
 * @returns The font family string with fallbacks
 */
export function getFontFamily(platform: 'ios' | 'android' | 'web' = 'ios'): string {
  // for web, we can use the full font stack with fallbacks
  if (platform === 'web') {
    const fallbacks = FontFamily.fallback[platform];
    return `${FontFamily.primary}, ${fallbacks.join(', ')}`;
  }
  
  // for react native (ios/android), we need to use the base font name
  // react native will automatically use the correct weight variant
  return FontFamily.primary;
}

/**
 * Get font family with specific weight for React Native
 * @param weight - The font weight ('light', 'regular', 'medium', 'bold')
 * @param platform - The platform ('ios', 'android', 'web')
 * @returns The font family string with specific weight
 */
export function getFontFamilyWithWeight(weight: 'light' | 'regular' | 'medium' | 'bold', platform: 'ios' | 'android' | 'web' = 'ios'): string {
  // for web, use the base font name with fallbacks
  if (platform === 'web') {
    const fallbacks = FontFamily.fallback[platform];
    return `${FontFamily.primary}, ${fallbacks.join(', ')}`;
  }
  
  // for react native, use the specific weight variant
  const weightMap = {
    light: 'Satoshi-Light',
    regular: 'Satoshi',
    medium: 'Satoshi-Medium',
    bold: 'Satoshi-Bold',
  };
  
  return weightMap[weight] || FontFamily.primary;
}

/**
 * Get responsive font size
 * @param baseSize - The base font size
 * @param screenSize - The screen size ('mobile', 'tablet', 'desktop')
 * @returns The scaled font size
 */
export function getResponsiveFontSize(
  baseSize: number, 
  screenSize: keyof typeof ResponsiveTypography = 'mobile'
): number {
  const scale = ResponsiveTypography[screenSize].scale;
  return Math.round(baseSize * scale);
}

/**
 * Create a custom text style
 * @param fontSize - The font size
 * @param lineHeight - The line height (optional)
 * @param fontWeight - The font weight (optional)
 * @param letterSpacing - The letter spacing (optional)
 * @returns A custom text style object
 */
export function createTextStyle(
  fontSize: number,
  lineHeight?: number,
  fontWeight?: string,
  letterSpacing?: number
) {
  return {
    fontSize,
    ...(lineHeight && { lineHeight }),
    ...(fontWeight && { fontWeight }),
    ...(letterSpacing && { letterSpacing }),
  };
}

/**
 * Typography Usage Examples and Guidelines
 * 
 * USAGE EXAMPLES:
 * 
 * 1. Using Predefined Text Styles:
 *    ```tsx
 *    import { getTextStyle } from '@/constants/Typography';
 *    
 *    <Text style={getTextStyle('heading-1')}>
 *      Main Title
 *    </Text>
 *    ```
 * 
 * 2. Using Font Family with Fallbacks:
 *    ```tsx
 *    import { getFontFamily } from '@/constants/Typography';
 *    
 *    <Text style={{ fontFamily: getFontFamily('ios') }}>
 *      Text with fallback fonts
 *    </Text>
 *    ```
 * 
 * 3. Creating Custom Text Styles:
 *    ```tsx
 *    import { createTextStyle } from '@/constants/Typography';
 *    
 *    <Text style={createTextStyle(20, 24, '600')}>
 *      Custom styled text
 *    </Text>
 *    ```
 * 
 * 4. Responsive Typography:
 *    ```tsx
 *    import { getResponsiveFontSize } from '@/constants/Typography';
 *    
 *    const fontSize = getResponsiveFontSize(16, 'tablet');
 *    <Text style={{ fontSize }}>
 *      Responsive text
 *    </Text>
 *    ```
 * 
 * COMPONENT USAGE:
 * 
 * // Button component
 * const buttonStyle = {
 *   ...getTextStyle('button-primary'),
 *   fontFamily: getFontFamily('ios'),
 * };
 * 
 * // Heading component
 * const headingStyle = {
 *   ...getTextStyle('heading-2'),
 *   fontFamily: getFontFamily('ios'),
 *   color: colors.text.primary,
 * };
 * 
 * // Body text component
 * const bodyStyle = {
 *   ...getTextStyle('body-large'),
 *   fontFamily: getFontFamily('ios'),
 *   color: colors.text.primary,
 * };
 */

/**
 * Type definitions for typography system
 */
export type TextStyleName = keyof typeof TextStyles;
export type FontWeightValue = keyof typeof FontWeight;
export type LineHeightValue = keyof typeof LineHeight;
export type LetterSpacingValue = keyof typeof LetterSpacing;
export type ResponsiveScale = keyof typeof ResponsiveTypography;
export type Platform = 'ios' | 'android' | 'web';

/**
 * Default export for convenience
 */
export default {
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
};
