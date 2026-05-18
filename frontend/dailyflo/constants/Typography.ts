import type { TextStyle } from 'react-native';
import { Platform as RNPlatform } from 'react-native';

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
 * Defines the primary font (Inter) and fallback fonts for different platforms.
 * Fallback fonts ensure text displays properly even if the primary font fails to load.
 */
export const FontFamily = {
  // primary font family - Inter is the main app font
  // this is the base name - we'll add specific weights when using fonts
  primary: 'undefined',
  
  // fallback fonts for different platforms
  // these are used if the primary font fails to load
  fallback: {
    // iOS — SF Pro Rounded first so onboarding + system stacks can target the same name (`ONBOARDING_FONT_FAMILY.ios`).
    ios: ['SF Pro Rounded', '-apple-system'],
    // Android fallback fonts - these are system fonts that look good on Android
    android: ['Roboto', 'sans-serif'],
    // web fallback fonts - these are web-safe fonts
    web: ['system-ui', 'sans-serif'],
  },
} as const;

/**
 * Onboarding funnel (intro + questionnaire) — one face per platform, aligned with `FontFamily.fallback`.
 * ios uses SF Pro Rounded (system on apple devices); weights still come from each `TextStyles` token.
 */
export const ONBOARDING_FONT_FAMILY = {
  ios: FontFamily.fallback.ios[0],
  android: FontFamily.fallback.android[0],
  web: FontFamily.fallback.web.join(', '),
} as const;

/**
 * Font Weight Configuration
 * 
 * Defines all available font weights using Inter's actual weight values.
 * These correspond to the actual font files loaded in _layout.tsx.
 */
export const FontWeight = {
  // light weight - used for subtle text, captions
  light: '300',
  // regular weight - used for body text, most content
  regular: '400',
  // medium weight - used for buttons, emphasized text
  medium: '500',
  // semibold weight - used for headings, important text
  semibold: '600',
  // bold weight - used for main headings, strong emphasis
  bold: '700',
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
  'large-heading-1': {
    fontSize: 90,        // extra large for date/number display
    // tight line height
    fontWeight: FontWeight.bold,
    //fontFamily: 'Inter-Bold',
  },
  'heading-1': {
    fontSize: 38,        // large title size
    fontWeight: FontWeight.bold,
    //fontFamily: 'Inter-semibold',
  },
  'heading-2': {
    fontSize: 24,        // medium title size
    fontWeight: FontWeight.semibold,
   // fontFamily: 'Inter-Bold',
  },
  'heading-3': {
    fontSize: 22,        // small title size
    fontWeight: FontWeight.semibold,
    //fontFamily: 'Inter-Bold',
  },
  'heading-4': {
    fontSize: 17,        // section header size
    fontWeight: FontWeight.medium,
    
  },

  // body text styles - for main content
  'body-large': {
    fontSize: 17,        // standard body text size
    fontWeight: FontWeight.regular,
   
  },
  'body-medium': {
    fontSize: 15,        // smaller body text
    fontWeight: FontWeight.medium,
    //fontFamily: 'Inter-Medium',
  },
  'body-small': {
    fontSize: 13,        // smallest readable text
    lineHeight: 14,
    fontWeight: FontWeight.medium,
    //fontFamily: 'Inter',
  },

  // context menu text - for ActionContextMenu, DropdownList, recurrence picker
  'context-menu': {
    fontSize: 16,
    fontWeight: FontWeight.regular,
  },

  // button text styles - for interactive elements
  'button-primary': {
    fontSize: 18,        // standard button text
    
    fontWeight: FontWeight.bold,
    fontFamily: 'Inter-Bold',
  },
  'button-secondary': {
    fontSize: 16,        // same size as primary button
    
    fontWeight: FontWeight.bold,
    fontFamily: 'Inter-Bold',
  },
  'button-text': {
    fontSize: 10,        // small button text (like links)
 
    fontWeight: FontWeight.medium,
    fontFamily: 'Inter-Medium',
  },

  // navigation text styles - for navigation elements
  'navbar': {
    fontSize: 10,        // small text for tab labels
   
    fontWeight: FontWeight.semibold,
    //fontFamily: 'Inter-Medium',
  },

  /**
   * `/(onboarding)/auth` slogan middle phrase — base size/weight; **face** comes from `getAuthLandingSloganMiddleTextStyle` in `auth/constants/typography.ts` (not Satoshi).
   * tweak here for app-wide definition; use `AUTH_LANDING_SLOGAN_MIDDLE_STYLE_OVERRIDES` in that file for funnel-only nudges without editing this table.
   */
  'auth-landing-middle-custom': {
    fontSize: 28,

    fontWeight: FontWeight.semibold,
  },

  /**
   * `/(onboarding)/auth` landing wordmark (“dailyflo”) — metrics here; **Satoshi** via `getSatoshiTypographyStyle('auth-landing-title', platform)` (**.otf** / `useFonts` keys in `app/_layout`).
   */
  'auth-landing-title': {
    fontSize: 39,
    letterSpacing: 0,
    fontWeight: 600,
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
 * Resolved font family for onboarding screens — SF Pro Rounded on ios (see `ONBOARDING_FONT_FAMILY`).
 */
export function getOnboardingFontFamily(platform: Platform = 'ios'): string {
  if (platform === 'ios') {
    return ONBOARDING_FONT_FAMILY.ios;
  }
  if (platform === 'android') {
    return ONBOARDING_FONT_FAMILY.android;
  }
  return ONBOARDING_FONT_FAMILY.web;
}

/**
 * Same sizes/weights as `getTextStyle`, but swaps in the onboarding font stack and drops embedded Inter names
 * so tokens like `button-primary` still pick a single rounded/system face for the funnel.
 */
export function getOnboardingTextStyle(
  styleName: keyof typeof TextStyles,
  platform: Platform = 'ios',
): TextStyle {
  const raw = getTextStyle(styleName);
  const { fontFamily: _omit, ...rest } = raw as TextStyle & { fontFamily?: string };
  return {
    ...rest,
    fontFamily: getOnboardingFontFamily(platform),
  };
}

// returns a token text style with the matching Inter family for the current platform
// so screens can use one typography helper and still get the correct weighted font files.
export function getTypographyStyle(
  styleName: keyof typeof TextStyles,
  platform: 'ios' | 'android' | 'web' = 'ios',
) {
  const style = getTextStyle(styleName);
  const fontWeight = `${style.fontWeight ?? FontWeight.regular}`;
  const matchedWeight = (
    Object.entries(FontWeight).find(([, value]) => value === fontWeight)?.[0] ?? 'regular'
  ) as keyof typeof FontWeight;

  return {
    ...style,
    fontFamily: getFontFamilyWithWeight(matchedWeight, platform),
  };
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
export function getFontFamilyWithWeight(weight: 'light' | 'regular' | 'medium' | 'semibold' | 'bold', platform: 'ios' | 'android' | 'web' = 'ios'): string {
  // for web, use the base font name with fallbacks
  if (platform === 'web') {
    const fallbacks = FontFamily.fallback[platform];
    return `${FontFamily.primary}, ${fallbacks.join(', ')}`;
  }
  
  // for react native, use the specific weight variant
  const weightMap = {
    light: 'Inter-Light',
    regular: 'Inter',
    medium: 'Inter-Medium',
    semibold: 'Inter-SemiBold',
    bold: 'Inter-Bold',
  };
  
  return weightMap[weight] || FontFamily.primary;
}

// satoshi: bundled in `assets/fonts` + registered in `app/_layout` — mirrors `getFontFamilyWithWeight` but uses satoshi **.otf** (one react-native `fontFamily` string per file; black may still be `.ttf` if your kit doesn’t ship black otf)
export function getSatoshiFontFamilyWithWeight(
  weight: 'light' | 'regular' | 'medium' | 'semibold' | 'bold',
  platform: 'ios' | 'android' | 'web' = 'ios',
): string {
  if (platform === 'web') {
    return FontFamily.fallback.web.join(', ');
  }
  const weightMap = {
    light: 'Satoshi-Light',
    regular: 'Satoshi-Regular',
    medium: 'Satoshi-Medium',
    semibold: 'Satoshi-Bold',
    bold: 'Satoshi-Black',
  };
  return weightMap[weight];
}

// same weight resolution as `getTypographyStyle`, but satoshi files + no `fontWeight` on ios/android so react-native doesn’t fake-thin the glyphs on top of a named font file
export function getSatoshiTypographyStyle(
  styleName: keyof typeof TextStyles,
  platform: 'ios' | 'android' | 'web' = 'ios',
): TextStyle {
  const style = getTextStyle(styleName);
  const fontWeight = `${style.fontWeight ?? FontWeight.regular}`;
  const matchedWeight = (
    Object.entries(FontWeight).find(([, value]) => value === fontWeight)?.[0] ?? 'regular'
  ) as keyof typeof FontWeight;

  const fontFamily = getSatoshiFontFamilyWithWeight(matchedWeight, platform);
  const { fontWeight: _w, fontFamily: _f, ...rest } = style as TextStyle & { fontFamily?: string };

  if (platform === 'web') {
    return { ...style, fontFamily };
  }
  return { ...rest, fontFamily };
}

/** resolved once at load from `RNPlatform.OS` — prefer `getAuthLandingPageTitleTextStyle(platform)` when platform must be exact */
export const AUTH_LANDING_PAGE_TITLE_TEXT_STYLE: TextStyle = getSatoshiTypographyStyle(
  'auth-landing-title',
  RNPlatform.OS === 'android' ? 'android' : RNPlatform.OS === 'web' ? 'web' : 'ios',
);

/** `/(onboarding)/auth` “dailyflo” headline — satoshi via `getSatoshiTypographyStyle('auth-landing-title', …)` */
export function getAuthLandingPageTitleTextStyle(
  platform: 'ios' | 'android' | 'web' = 'ios',
): TextStyle {
  return getSatoshiTypographyStyle('auth-landing-title', platform);
}

/**
 * legacy helper — landing headline now uses `getAuthLandingPageTitleTextStyle`; kept for older imports / HMR bundles.
 */
export function getAuthLandingSloganTextStyle(
  platform: 'ios' | 'android' | 'web' = 'ios',
): TextStyle {
  return getTypographyStyle('body-large', platform);
}

/** legacy alias — same object as `AUTH_LANDING_PAGE_TITLE_TEXT_STYLE` (some bundles/tools still resolve this name) */
export const AUTH_LANDING_TITLE_TEXT_STYLE: TextStyle = AUTH_LANDING_PAGE_TITLE_TEXT_STYLE;

/** legacy alias — same object as `AUTH_LANDING_PAGE_TITLE_TEXT_STYLE` */
export const AUTH_HEADLINE_TEXT_STYLE: TextStyle = AUTH_LANDING_PAGE_TITLE_TEXT_STYLE;

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
  ONBOARDING_FONT_FAMILY,
  getTextStyle,
  getOnboardingFontFamily,
  getOnboardingTextStyle,
  getTypographyStyle,
  getSatoshiFontFamilyWithWeight,
  getSatoshiTypographyStyle,
  getAuthLandingPageTitleTextStyle,
  getAuthLandingSloganTextStyle,
  AUTH_LANDING_PAGE_TITLE_TEXT_STYLE,
  AUTH_LANDING_TITLE_TEXT_STYLE,
  AUTH_HEADLINE_TEXT_STYLE,
  getFontFamily,
  getResponsiveFontSize,
  createTextStyle,
};
