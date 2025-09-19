/**
 * Color Palette Hook
 * 
 * This hook provides easy access to the color palette system in components.
 * It automatically handles theme switching and provides type-safe color access.
 * 
 * Usage:
 * const colors = useColorPalette();
 * const primaryColor = colors.semantic.success[500];
 * const backgroundColor = colors.theme.background.primary;
 */

import { useColorScheme } from 'react-native';
import {
  PrimaryColors,
  SemanticColors,
  TaskCategoryColors,
  ThemeColors,
  getSemanticColor,
  getTaskCategoryColor,
  getThemeColor,
  withOpacity,
  type PrimaryColorShade,
  type SemanticColorName,
  type TaskCategoryColorName,
  type ThemeColorCategory,
  type ThemeColorVariant,
} from '@/constants/ColorPalette';

/**
 * Color palette hook return type
 */
export interface ColorPaletteReturn {
  // theme information
  theme: 'light' | 'dark';
  isDark: boolean;
  isLight: boolean;
  
  // color palettes
  primary: typeof PrimaryColors.light | typeof PrimaryColors.dark;
  semantic: typeof SemanticColors;
  taskCategory: typeof TaskCategoryColors;
  themeColors: typeof ThemeColors.light | typeof ThemeColors.dark;
  
  // utility functions
  getSemanticColor: (color: SemanticColorName, shade?: keyof typeof SemanticColors.success) => string;
  getTaskCategoryColor: (color: TaskCategoryColorName, shade?: keyof typeof TaskCategoryColors.red) => string;
  getThemeColor: (category: ThemeColorCategory, variant: ThemeColorVariant) => string;
  withOpacity: (color: string, opacity: number) => string;
}

/**
 * useColorPalette Hook
 * 
 * Provides access to the complete color palette system with theme awareness.
 * Automatically updates when the system theme changes.
 * 
 * @returns Color palette object with all colors and utility functions
 */
export function useColorPalette(): ColorPaletteReturn {
  // get current system theme
  const systemTheme = useColorScheme();
  const theme = systemTheme === 'dark' ? 'dark' : 'light';
  
  // get theme-specific colors
  const primary = PrimaryColors[theme];
  const themeColors = ThemeColors[theme];
  
  return {
    // theme information
    theme,
    isDark: theme === 'dark',
    isLight: theme === 'light',
    
    // color palettes
    primary,
    semantic: SemanticColors,
    taskCategory: TaskCategoryColors,
    themeColors,
    
    // utility functions with theme context
    getSemanticColor: (color: SemanticColorName, shade = 500) => 
      getSemanticColor(color, shade),
    
    getTaskCategoryColor: (color: TaskCategoryColorName, shade = 500) => 
      getTaskCategoryColor(color, shade),
    
    getThemeColor: (category: ThemeColorCategory, variant: ThemeColorVariant) => 
      getThemeColor(theme, category, variant),
    
    withOpacity: (color: string, opacity: number) => 
      withOpacity(color, opacity),
  };
}

/**
 * useSemanticColors Hook
 * 
 * Simplified hook for accessing semantic colors only.
 * Useful when you only need status colors (success, error, warning, info).
 * 
 * @returns Object with semantic color getter functions
 */
export function useSemanticColors() {
  const { getSemanticColor, withOpacity } = useColorPalette();
  
  return {
    // direct access to common semantic colors
    success: (shade: keyof typeof SemanticColors.success = 500) => getSemanticColor('success', shade),
    error: (shade: keyof typeof SemanticColors.error = 500) => getSemanticColor('error', shade),
    warning: (shade: keyof typeof SemanticColors.warning = 500) => getSemanticColor('warning', shade),
    info: (shade: keyof typeof SemanticColors.info = 500) => getSemanticColor('info', shade),
    
    // utility functions
    getSemanticColor,
    withOpacity,
  };
}

/**
 * useTaskColors Hook
 * 
 * Simplified hook for accessing task category colors only.
 * Useful when working with task-related components.
 * 
 * @returns Object with task color getter functions
 */
export function useTaskColors() {
  const { getTaskCategoryColor, withOpacity } = useColorPalette();
  
  return {
    // direct access to common task colors
    red: (shade: keyof typeof TaskCategoryColors.red = 500) => getTaskCategoryColor('red', shade),
    blue: (shade: keyof typeof TaskCategoryColors.blue = 500) => getTaskCategoryColor('blue', shade),
    green: (shade: keyof typeof TaskCategoryColors.green = 500) => getTaskCategoryColor('green', shade),
    yellow: (shade: keyof typeof TaskCategoryColors.yellow = 500) => getTaskCategoryColor('yellow', shade),
    purple: (shade: keyof typeof TaskCategoryColors.purple = 500) => getTaskCategoryColor('purple', shade),
    teal: (shade: keyof typeof TaskCategoryColors.teal = 500) => getTaskCategoryColor('teal', shade),
    orange: (shade: keyof typeof TaskCategoryColors.orange = 500) => getTaskCategoryColor('orange', shade),
    
    // utility functions
    getTaskCategoryColor,
    withOpacity,
  };
}

/**
 * useThemeColors Hook
 * 
 * Simplified hook for accessing theme-aware colors only.
 * Useful for basic UI components that need theme-adaptive colors.
 * 
 * @returns Object with theme color getter functions
 */
export function useThemeColors() {
  const { getThemeColor, withOpacity, theme, isDark, isLight } = useColorPalette();
  
  return {
    // theme information
    theme,
    isDark,
    isLight,
    
    // direct access to common theme colors
    background: {
      primary: () => getThemeColor('background', 'primary'),
      secondary: () => getThemeColor('background', 'secondary'),
      tertiary: () => getThemeColor('background', 'tertiary'),
      elevated: () => getThemeColor('background', 'elevated'),
      overlay: () => getThemeColor('background', 'overlay'),
    },
    
    text: {
      primary: () => getThemeColor('text', 'primary'),
      secondary: () => getThemeColor('text', 'secondary'),
      tertiary: () => getThemeColor('text', 'tertiary'),
    },
    
    border: {
      primary: () => getThemeColor('border', 'primary'),
      secondary: () => getThemeColor('border', 'secondary'),
    },
    
    interactive: {
      primary: () => getThemeColor('interactive', 'primary'),
      secondary: () => getThemeColor('interactive', 'secondary'),
      tertiary: () => getThemeColor('interactive', 'tertiary'),
    },
    
    // utility functions
    getThemeColor,
    withOpacity,
  };
}

/**
 * Color Palette Hook Usage Examples
 * 
 * BASIC USAGE:
 * ```tsx
 * import { useColorPalette } from '@/hooks/useColorPalette';
 * 
 * function MyComponent() {
 *   const colors = useColorPalette();
 *   
 *   return (
 *     <View style={{
 *       backgroundColor: colors.themeColors.background.primary,
 *       color: colors.themeColors.text.primary,
 *     }}>
 *       Content
 *     </View>
 *   );
 * }
 * ```
 * 
 * SEMANTIC COLORS:
 * ```tsx
 * import { useSemanticColors } from '@/hooks/useColorPalette';
 * 
 * function StatusIndicator({ type }) {
 *   const semanticColors = useSemanticColors();
 *   
 *   const getStatusColor = () => {
 *     switch (type) {
 *       case 'success': return semanticColors.success();
 *       case 'error': return semanticColors.error();
 *       case 'warning': return semanticColors.warning();
 *       default: return semanticColors.info();
 *     }
 *   };
 *   
 *   return (
 *     <View style={{
 *       backgroundColor: getStatusColor(),
 *       borderColor: semanticColors.withOpacity(getStatusColor(), 0.3),
 *     }} />
 *   );
 * }
 * ```
 * 
 * TASK COLORS:
 * ```tsx
 * import { useTaskColors } from '@/hooks/useColorPalette';
 * 
 * function TaskCard({ task }) {
 *   const taskColors = useTaskColors();
 *   
 *   return (
 *     <View style={{
 *       backgroundColor: taskColors.withOpacity(taskColors[task.color](), 0.1),
 *       borderColor: taskColors[task.color](100),
 *       borderLeftColor: taskColors[task.color](),
 *     }}>
 *       <Text style={{ color: taskColors[task.color]() }}>
 *         {task.title}
 *       </Text>
 *     </View>
 *   );
 * }
 * ```
 * 
 * THEME COLORS:
 * ```tsx
 * import { useThemeColors } from '@/hooks/useColorPalette';
 * 
 * function Button({ variant = 'primary' }) {
 *   const themeColors = useThemeColors();
 *   
 *   const getButtonStyle = () => {
 *     switch (variant) {
 *       case 'primary':
 *         return {
 *           backgroundColor: themeColors.interactive.primary(),
 *           color: themeColors.text.inverse(),
 *         };
 *       case 'secondary':
 *         return {
 *           backgroundColor: themeColors.interactive.secondary(),
 *           color: themeColors.text.primary(),
 *         };
 *       default:
 *         return {
 *           backgroundColor: 'transparent',
 *           color: themeColors.text.primary(),
 *         };
 *     }
 *   };
 *   
 *   return <View style={getButtonStyle()}>Button</View>;
 * }
 * ```
 */

/**
 * Default export for convenience
 */
export default useColorPalette;
