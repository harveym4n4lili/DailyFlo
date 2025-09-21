/**
 * Color Palette System
 * 
 * This file implements a comprehensive color system following the design system
 * specifications. It provides semantic color tokens, theme-aware colors, and
 * utility functions for consistent color usage throughout the app.
 * 
 * The color system is organized into:
 * - Primary colors (neutral grays)
 * - Semantic colors (success, error, warning, info)
 * - Task category colors
 * - Theme-aware color mappings
 * - Utility functions for color usage
 */

/**
 * Primary Color Palette
 * 
 * Neutral grays that form the foundation of the design system.
 * These colors adapt between light and dark themes.
 */
export const PrimaryColors = {
  light: {
    // light mode primary colors (from design system specs)
    50: '#FFFFFF',   // pure white - light backgrounds, modal surfaces
    100: '#F5F7FA',  // subtle off-white - page backgrounds, settings panels
    200: '#ECF0F5',  // light neutral - secondary backgrounds
    300: '#959BA5',  // medium neutral - secondary buttons, inactive elements
    400: '#374151',  // dark neutral - secondary text, labels
    500: '#262E3B',  // base brand color - primary text, headings
    600: '#111827',  // darker brand - primary buttons, active states
    700: '#0F172A',  // deep neutral - navigation headers
    800: '#0C1320',  // strong base for text in dark mode
    900: '#111827',  // near-black - dark mode backgrounds, overlays
  },
  dark: {
    // dark mode primary colors (from design system specs)
    50: '#111111',   // pure white - light backgrounds, modal surfaces
    100: '#141414',  // subtle off-white - page backgrounds, settings panels
    200: '#1C1C1C',  // light neutral - secondary backgrounds
    300: '#555555',  // medium neutral - secondary buttons, inactive elements
    400: '#9BA2B1',  // dark neutral - secondary text, labels
    500: '#ADBBD5',  // base brand color - primary text, headings
    600: '#BFCBE3',  // darker brand - primary buttons, active states
    700: '#E1E9F9',  // deep neutral - navigation headers
    800: '#ECF1FB',  // strong base for text in dark mode
    900: '#f5f8ff',  // near-black - dark mode backgrounds, overlays
  },
} as const;

/**
 * Semantic Color Palette
 * 
 * Colors that convey meaning and status throughout the app.
 * These colors remain consistent across light and dark themes.
 */
export const SemanticColors = {
  // success colors - for completed tasks, success states
  success: {
    50: '#ECFDF5',   // lightest green - success backgrounds
    100: '#D1FAE5',  // light green - success hover states
    500: '#10B981',  // base green - success text, icons
    600: '#059669',  // darker green - success buttons
    900: '#064E3B',  // darkest green - success text on light backgrounds
  },
  
  // error colors - for overdue tasks, error states
  error: {
    50: '#FEF2F2',   // lightest red - error backgrounds
    100: '#FEE2E2',  // light red - error hover states
    500: '#EF4444',  // base red - error text, icons
    600: '#DC2626',  // darker red - error buttons
    900: '#7F1D1D',  // darkest red - error text on light backgrounds
  },
  
  // warning colors - for warning states, caution
  warning: {
    50: '#FFFBEB',   // lightest amber - warning backgrounds
    100: '#FEF3C7',  // light amber - warning hover states
    500: '#F59E0B',  // base amber - warning text, icons
    600: '#D97706',  // darker amber - warning buttons
    900: '#78350F',  // darkest amber - warning text on light backgrounds
  },
  
  // info colors - for primary tasks, active states
  info: {
    50: '#EFF6FF',   // lightest blue - info backgrounds
    100: '#DBEAFE',  // light blue - info hover states
    500: '#3B82F6',  // base blue - info text, icons
    600: '#2563EB',  // darker blue - info buttons
    900: '#1E3A8A',  // darkest blue - info text on light backgrounds
  },
} as const;

/**
 * Task Category Colors
 * 
 * Colors specifically for task categorization and visual organization.
 * These colors provide visual distinction between different task types.
 */
export const TaskCategoryColors = {
  // red - overdue tasks, urgent items
  red: {
    50: '#FEF2F2',   // lightest red - red task backgrounds
    100: '#FEE2E2',  // light red - red task hover states
    500: '#EF4444',  // base red - red task icons, accents
    600: '#DC2626',  // darker red - red task buttons
    900: '#7F1D1D',  // darkest red - red task text
  },
  
  // blue - primary tasks, reading category
  blue: {
    50: '#EFF6FF',   // lightest blue - blue task backgrounds
    100: '#DBEAFE',  // light blue - blue task hover states
    500: '#3B82F6',  // base blue - blue task icons, accents
    600: '#2563EB',  // darker blue - blue task buttons
    900: '#1E3A8A',  // darkest blue - blue task text
  },
  
  // green - completed tasks, lifestyle category
  green: {
    50: '#ECFDF5',   // lightest green - green task backgrounds
    100: '#D1FAE5',  // light green - green task hover states
    500: '#10B981',  // base green - green task icons, accents
    600: '#059669',  // darker green - green task buttons
    900: '#064E3B',  // darkest green - green task text
  },
  
  // yellow - secondary tasks, meal prep
  yellow: {
    50: '#FFFBEB',   // lightest amber - yellow task backgrounds
    100: '#FEF3C7',  // light amber - yellow task hover states
    500: '#F59E0B',  // base amber - yellow task icons, accents
    600: '#D97706',  // darker amber - yellow task buttons
    900: '#78350F',  // darkest amber - yellow task text
  },
  
  // purple - lifestyle category, gym tasks
  purple: {
    50: '#FAF5FF',   // lightest violet - purple task backgrounds
    100: '#F3E8FF',  // light violet - purple task hover states
    500: '#8B5CF6',  // base violet - purple task icons, accents
    600: '#7C3AED',  // darker violet - purple task buttons
    900: '#4C1D95',  // darkest violet - purple task text
  },
  
  // teal - additional task categories
  teal: {
    50: '#F0FDFA',   // lightest teal - teal task backgrounds
    100: '#CCFBF1',  // light teal - teal task hover states
    500: '#14B8A6',  // base teal - teal task icons, accents
    600: '#0D9488',  // darker teal - teal task buttons
    900: '#134E4A',  // darkest teal - teal task text
  },
  
  // orange - task color picker option
  orange: {
    50: '#FFF7ED',   // lightest orange - orange task backgrounds
    100: '#FFEDD5',  // light orange - orange task hover states
    500: '#F97316',  // base orange - orange task icons, accents
    600: '#EA580C',  // darker orange - orange task buttons
    900: '#9A3412',  // darkest orange - orange task text
  },
} as const;

/**
 * Theme-Aware Color Mappings
 * 
 * Semantic color mappings that automatically adapt to light/dark themes.
 * These provide consistent color usage across different themes.
 */
export const ThemeColors = {
  light: {
    // background colors - surfaces and containers
    background: {
      primary: PrimaryColors.light[100],      // white - main backgrounds
      secondary: PrimaryColors.light[100],   // light gray - secondary surfaces
      tertiary: PrimaryColors.light[200],    // medium gray - tertiary surfaces
      elevated: PrimaryColors.light[50],     // white - elevated surfaces (modals, cards)
      overlay: 'rgba(0, 0, 0, 0.5)',        // black overlay - modal backdrops
    },
    
    // text colors - typography hierarchy
    text: {
      primary: PrimaryColors.light[900],     // dark gray - primary text
      secondary: PrimaryColors.light[400],   // medium gray - secondary text
      tertiary: PrimaryColors.light[300],    // light gray - tertiary text
      inverse: PrimaryColors.light[50],      // white - text on dark backgrounds
      disabled: PrimaryColors.light[300],    // light gray - disabled text
    },
    
    // border colors - dividers and outlines
    border: {
      primary: PrimaryColors.light[200],     // light gray - primary borders
      secondary: PrimaryColors.light[100],   // very light gray - secondary borders
      focus: PrimaryColors.light[600],       // dark gray - focused borders
      error: SemanticColors.error[500],      // red - error borders
      success: SemanticColors.success[500],  // green - success borders
    },
    
    // interactive colors - buttons and controls
    interactive: {
      primary: PrimaryColors.light[600],     // dark gray - primary buttons
      secondary: PrimaryColors.light[100],   // light gray - secondary buttons
      tertiary: 'transparent',               // transparent - tertiary buttons
      hover: PrimaryColors.light[700],       // darker gray - hover states
      active: PrimaryColors.light[800],      // darkest gray - active states
      disabled: PrimaryColors.light[200],    // light gray - disabled states
    },
  },
  
  dark: {
    // background colors - surfaces and containers
    background: {
      primary: PrimaryColors.dark[50],       // dark - main backgrounds
      secondary: PrimaryColors.dark[100],    // darker gray - secondary surfaces
      tertiary: PrimaryColors.dark[200],     // medium gray - tertiary surfaces
      elevated: PrimaryColors.dark[100],     // darker gray - elevated surfaces
      overlay: 'rgba(0, 0, 0, 0.8)',        // black overlay - modal backdrops
    },
    
    // text colors - typography hierarchy
    text: {
      primary: PrimaryColors.dark[900],      // light gray - primary text
      secondary: PrimaryColors.dark[400],    // medium gray - secondary text
      tertiary: PrimaryColors.dark[300],     // darker gray - tertiary text
      inverse: PrimaryColors.dark[900],      // very light - text on dark backgrounds
      disabled: PrimaryColors.dark[300],     // darker gray - disabled text
    },
    
    // border colors - dividers and outlines
    border: {
      primary: PrimaryColors.dark[200],      // medium gray - primary borders
      secondary: PrimaryColors.dark[100],    // darker gray - secondary borders
      focus: PrimaryColors.dark[600],        // light gray - focused borders
      error: SemanticColors.error[500],      // red - error borders
      success: SemanticColors.success[500],  // green - success borders
    },
    
    // interactive colors - buttons and controls
    interactive: {
      primary: PrimaryColors.dark[900],      // light gray - primary buttons
      secondary: PrimaryColors.dark[200],    // medium gray - secondary buttons
      tertiary: 'transparent',               // transparent - tertiary buttons
      hover: PrimaryColors.dark[700],        // lighter gray - hover states
      active: PrimaryColors.dark[800],       // lightest gray - active states
      disabled: PrimaryColors.dark[200],     // medium gray - disabled states
    },
  },
} as const;

/**
 * Color Utility Functions
 * 
 * Helper functions for working with colors in components.
 * These provide type-safe access to colors and common color operations.
 */

/**
 * Get a color value from a color palette
 * @param palette - The color palette object
 * @param shade - The shade key (50, 100, 500, etc.)
 * @returns The color value as a string
 */
export function getColorValue<T extends Record<string, string>>(
  palette: T,
  shade: keyof T
): string {
  return palette[shade] as string;
}

/**
 * Get a semantic color value
 * @param color - The semantic color name (success, error, warning, info)
 * @param shade - The shade key (50, 100, 500, etc.)
 * @returns The color value as a string
 */
export function getSemanticColor(
  color: keyof typeof SemanticColors,
  shade: keyof typeof SemanticColors.success = 500
): string {
  return SemanticColors[color][shade];
}

/**
 * Get a task category color value
 * @param color - The task category color name (red, blue, green, etc.)
 * @param shade - The shade key (50, 100, 500, etc.)
 * @returns The color value as a string
 */
export function getTaskCategoryColor(
  color: keyof typeof TaskCategoryColors,
  shade: keyof typeof TaskCategoryColors.red = 500
): string {
  return TaskCategoryColors[color][shade];
}

/**
 * Get a theme-aware color value
 * @param theme - The current theme ('light' or 'dark')
 * @param category - The color category (background, text, border, interactive)
 * @param variant - The color variant within the category
 * @returns The color value as a string
 */
export function getThemeColor(
  theme: 'light' | 'dark',
  category: keyof typeof ThemeColors.light,
  variant: string
): string {
  return (ThemeColors[theme][category] as Record<string, string>)[variant];
}

/**
 * Get a color with opacity
 * @param color - The base color value
 * @param opacity - The opacity value (0-1)
 * @returns The color value with opacity
 */
export function withOpacity(color: string, opacity: number): string {
  // if color is already rgba, extract rgb values
  if (color.startsWith('rgba')) {
    const rgb = color.slice(5, -1).split(',').slice(0, 3).join(',');
    return `rgba(${rgb}, ${opacity})`;
  }
  
  // if color is hex, convert to rgba
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  
  // fallback for other color formats
  return color;
}

/**
 * Color Usage Examples and Guidelines
 * 
 * USAGE EXAMPLES:
 * 
 * 1. Primary Colors:
 *    - Backgrounds: ThemeColors[theme].background.primary
 *    - Text: ThemeColors[theme].text.primary
 *    - Borders: ThemeColors[theme].border.primary
 * 
 * 2. Semantic Colors:
 *    - Success: getSemanticColor('success', 500)
 *    - Error: getSemanticColor('error', 500)
 *    - Warning: getSemanticColor('warning', 500)
 *    - Info: getSemanticColor('info', 500)
 * 
 * 3. Task Category Colors:
 *    - Task icons: getTaskCategoryColor('red', 500)
 *    - Task backgrounds: getTaskCategoryColor('red', 50)
 *    - Task hover states: getTaskCategoryColor('red', 100)
 * 
 * 4. With Opacity:
 *    - Semi-transparent overlays: withOpacity(ThemeColors[theme].background.primary, 0.5)
 *    - Subtle backgrounds: withOpacity(getSemanticColor('success', 500), 0.1)
 * 
 * COMPONENT USAGE:
 * 
 * // Button component
 * const buttonStyle = {
 *   backgroundColor: getThemeColor(theme, 'interactive', 'primary'),
 *   borderColor: getThemeColor(theme, 'border', 'primary'),
 *   color: getThemeColor(theme, 'text', 'inverse'),
 * };
 * 
 * // Task card component
 * const taskCardStyle = {
 *   backgroundColor: getThemeColor(theme, 'background', 'elevated'),
 *   borderColor: getTaskCategoryColor(task.color, 100),
 *   color: getThemeColor(theme, 'text', 'primary'),
 * };
 * 
 * // Status indicator
 * const statusStyle = {
 *   backgroundColor: getSemanticColor(task.isCompleted ? 'success' : 'error', 500),
 *   color: getSemanticColor(task.isCompleted ? 'success' : 'error', 50),
 * };
 */

/**
 * Type definitions for color system
 */
export type PrimaryColorShade = keyof typeof PrimaryColors.light;
export type SemanticColorName = keyof typeof SemanticColors;
export type TaskCategoryColorName = keyof typeof TaskCategoryColors;
export type ThemeColorCategory = keyof typeof ThemeColors.light;
export type ThemeColorVariant = string;

/**
 * Default export for convenience
 */
export default {
  PrimaryColors,
  SemanticColors,
  TaskCategoryColors,
  ThemeColors,
  getColorValue,
  getSemanticColor,
  getTaskCategoryColor,
  getThemeColor,
  withOpacity,
};
