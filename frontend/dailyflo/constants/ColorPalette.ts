/**
 * Color Palette System
 * 
 * This file implements a comprehensive color system following the design system
 * specifications. It provides semantic color tokens, theme-aware colors, and
 * utility functions for consistent color usage throughout the app.
 * 
 * The color system is organized into:
 * - Brand colors — three green ramps (`PlantBrandColors`, `SageBrandColors`, `MossBrandColors`; same step keys as `PrimaryColors`)
 * - Primary colors (neutral grays)
 * - Semantic colors (success, error, warning, info)
 * - Task category colors
 * - Theme-aware color mappings
 * - Utility functions for color usage
 */

/**
 * Primary Color Palette
 *
 * Neutral scale for backgrounds, typography, buttons, borders, and the FAB. App code
 * uses `useThemeColors()` — not these hex values directly.
 *
 * **Light column** = colors for light mode (and for “light paper” panels when dark mode
 * needs a bright surface). **Dark column** = colors for dark mode (and for dark bars /
 * strips when light mode uses an inverted header-style block).
 */
export const PrimaryColors = {
  light: {
    // white: cards, modals, elevated sheets; FAB tint; hairline borders; label text on dark buttons/bars
    25: '#FFFFFF',
    // barely tinted screen wash between stacked sections
    50: '#FAFCFE',
    // default page / list background; soft secondary buttons; “paper” surfaces in dark mode
    100: '#F5F7FA',
    // grouped rows, tertiary panels, disabled button fills
    200: '#ECF0F5',
    // hints, placeholders, disabled + tertiary text, muted controls
    300: '#959BA5',
    // lowest-emphasis control styling
    400: '#374151',
    // subtitles, metadata, secondary line text (not main title)
    500: '#262E3B',
    // primary solid buttons; focus ring / focus border on inputs
    600: '#111827',
    // hover on primary buttons (light mode)
    700: '#0F172A',
    // pressed primary buttons (light mode)
    800: '#0C1320',
    // main titles, task titles, body text (light mode); dark text on light popovers in dark mode
    900: '#111827',
  },
  dark: {
    // root dark canvas; FAB icon color; inverted dark header/toolbar bands in light mode
    25: '#16171A',
    // subtle blend between two dark regions
    50: '#1E1E24',
    // cards, sheets, secondary dark surfaces; ghost controls on dark
    100: '#23232C',
    // nested panels, dividers, disabled fills; dark strips behind inverted light UI
    200: '#30313C',
    // tertiary labels, disabled text, muted chips on dark
    300: '#3C3E4B',
    // secondary text, helper copy; secondary / outline buttons on dark
    400: '#4E5164',
    // not wired into the theme yet (reserved)
    500: '#ADBBD5',
    // focus outline on dark UI; focus on light-on-dark strips
    600: '#BFCBE3',
    // hover on interactive controls (dark mode)
    700: '#E1E9F9',
    // pressed interactive controls (dark mode)
    800: '#C3C4CA',
    // primary readable text on dark; primary buttons on dark; light “primary” actions on inverted dark bars
    900: '#CCCFE0',
  },
} as const;

/**
 * Three botanical-green brand ramps — same 25→900 keys as `PrimaryColors`.
 * - **Plant** = fresh yellow-green (default product accent / CTAs via `getBrandColor`).
 * - **Sage** = muted blue-gray green for calmer marketing surfaces.
 * - **Moss** = deep olive / earth moss for contrast pairings.
 */
export const PlantBrandColors = {
  // muted brand chrome on dark
  200: '#0E120E',
  // tertiary brand emphasis
  300: '#46553B',
  // secondary brand icons on dark
  400: '#6E7E5C',
  // main brand accent on dark (same hue anchor as light 500)
  500: '#92a079',
  // hover / lift on dark (slightly lighter coral)
  600: '#C4C9AB',

  700: '#E8EAE0',

  800: '#f2f5e6',
} as const;

export const MossBrandColors = {
   // muted brand chrome on dark
   200: '#0E120E',
   // tertiary brand emphasis
   300: '#022E24',
   // secondary brand icons on dark
   400: '#1F4D3A',
   // main brand accent on dark (same hue anchor as light 500)
   500: '#4F8F75',
   // hover / lift on dark (slightly lighter coral)
   600: '#9FC3B2',
 
   700: '#e7f1ec',
 
   800: '#EEFAF4',
} as const;

export const SageBrandColors = {
   // muted brand chrome on dark
   200: '#1D2024',
   // tertiary brand emphasis
   300: '#343C45',
   // secondary brand icons on dark
   400: '#526272',
   // main brand accent on dark (same hue anchor as light 500)
   500: '#7B8BA5',
   // hover / lift on dark (slightly lighter coral)
   600: '#B5BFCC',
 
   700: '#D6DBE3',
 
   800: '#EFF0EB',
} as const;

/** maps string id → ramp object — used by `getBrandPaletteColor` and intro `plant:` / `sage:` / `moss:` tokens */
export const BrandPalettes = {
  plant: PlantBrandColors,
  sage: SageBrandColors,
  moss: MossBrandColors,
} as const;

export type BrandPaletteId = keyof typeof BrandPalettes;

/**
 * Semantic Color Palette
 * 
 * Colors that convey meaning and status throughout the app.
 * These colors remain consistent across light and dark themes.
 */
export const SemanticColors = {
  // success colors - for completed tasks, success states
  success: {
    25: '#ECFDF5',   // lightest green - success backgrounds
    100: '#D1FAE5',  // light green - success hover states
    500: '#10B981',  // base green - success text, icons
    600: '#059669',  // darker green - success buttons
    900: '#064E3B',  // darkest green - success text on light backgrounds
  },
  
  // error colors - for overdue tasks, error states
  error: {
    25: '#FEF2F2',   // lightest red - error backgrounds
    100: '#FEE2E2',  // light red - error hover states
    500: '#EF4444',  // base red - error text, icons
    600: '#DC2626',  // darker red - error buttons
    900: '#7F1D1D',  // darkest red - error text on light backgrounds
  },
  
  // warning colors - for warning states, caution
  warning: {
    25: '#FFFBEB',   // lightest amber - warning backgrounds
    100: '#FEF3C7',  // light amber - warning hover states
    500: '#F59E0B',  // base amber - warning text, icons
    600: '#D97706',  // darker amber - warning buttons
    900: '#78350F',  // darkest amber - warning text on light backgrounds
  },
  
  // info colors - for primary tasks, active states
  info: {
    25: '#EFF6FF',   // lightest blue - info backgrounds
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
    25: '#FEF2F2',   // lightest red - red task backgrounds
    50: '#F9E8E8',   // between 25 and 100 - light red
    100: '#FEE2E2',  // light red - red task hover states
    500: '#EF4444',  // base red - red task icons, accents
    600: '#DC2626',  // darker red - red task buttons
    900: '#7F1D1D',  // darkest red - red task text
  },
  
  // blue - primary tasks, reading category
  blue: {
    25: '#EFF6FF',   // lightest blue - blue task backgrounds
    50: '#E5EEFE',   // between 25 and 100 - light blue
    100: '#DBEAFE',  // light blue - blue task hover states
    500: '#3B82F6',  // base blue - blue task icons, accents
    600: '#2563EB',  // darker blue - blue task buttons
    900: '#1E3A8A',  // darkest blue - blue task text
  },
  
  // green - completed tasks, lifestyle category
  green: {
    25: '#ECFDF5',   // lightest green - green task backgrounds
    50: '#E2F7EE',   // between 25 and 100 - light green
    100: '#D1FAE5',  // light green - green task hover states
    500: '#10B981',  // base green - green task icons, accents
    600: '#059669',  // darker green - green task buttons
    900: '#064E3B',  // darkest green - green task text
  },
  
  // yellow - secondary tasks, meal prep
  yellow: {
    25: '#FFFBEB',   // lightest amber - yellow task backgrounds
    50: '#FFF5D8',   // between 25 and 100 - light amber
    100: '#FEF3C7',  // light amber - yellow task hover states
    500: '#F59E0B',  // base amber - yellow task icons, accents
    600: '#D97706',  // darker amber - yellow task buttons
    900: '#78350F',  // darkest amber - yellow task text
  },
  
  // purple - lifestyle category, gym tasks
  purple: {
    25: '#FAF5FF',   // lightest violet - purple task backgrounds
    50: '#F3EBFF',   // between 25 and 100 - light violet
    100: '#F3E8FF',  // light violet - purple task hover states
    500: '#8B5CF6',  // base violet - purple task icons, accents
    600: '#7C3AED',  // darker violet - purple task buttons
    900: '#4C1D95',  // darkest violet - purple task text
  },
  
  // teal - additional task categories
  teal: {
    25: '#F0FDFA',   // lightest teal - teal task backgrounds
    50: '#E5F7F2',   // between 25 and 100 - light teal
    100: '#CCFBF1',  // light teal - teal task hover states
    500: '#14B8A6',  // base teal - teal task icons, accents
    600: '#0D9488',  // darker teal - teal task buttons
    900: '#134E4A',  // darkest teal - teal task text
  },
  
  // orange - task color picker option
  orange: {
    25: '#FFF7ED',   // lightest orange - orange task backgrounds
    50: '#FFEED8',   // between 25 and 100 - light orange
    100: '#FFEDD5',  // light orange - orange task hover states
    500: '#F97316',  // base orange - orange task icons, accents
    600: '#EA580C',  // darker orange - orange task buttons
    900: '#9A3412',  // darkest orange - orange task text
  },
} as const;

/**
 * Primary button palette — solid fills and icon color for main CTAs (FAB, primary actions).
 * `fill` uses brand scale `500`; icons stay on-theme neutrals for contrast.
 * `fill` / `icon` are mapped into ThemeColors.primaryButton.
 */
export const PrimaryButtonColors = {
  light: {
    /** main solid fill — brand 500 via helper */
    fill: getBrandColor(500),
    /** label / icon on fill — same role as text.inverse on this surface */
    icon: PrimaryColors.dark[25],
  },
  dark: {
    fill: getBrandColor(500),
    /** readable on dark primary fills (matches theme text.inverse intent) */
    icon: PrimaryColors.light[25],
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
    // primary buttons — FAB, solid primary actions (see PrimaryButtonColors)
    primaryButton: {
      fill: PrimaryButtonColors.light.fill,
      icon: PrimaryButtonColors.light.icon,
    },
    // background colors - surfaces and containers
    background: {
      primary: PrimaryColors.light[100],      // white - main backgrounds
      secondary: PrimaryColors.light[100],   // light gray - secondary surfaces
      primarySecondaryBlend: PrimaryColors.light[50], // blend between primary and secondary
      tertiary: PrimaryColors.light[200],    // medium gray - tertiary surfaces
      quaternary: PrimaryColors.light[25],   // very light - quaternary surfaces
      elevated: PrimaryColors.light[25],     // white - elevated surfaces (modals, cards)
      overlay: 'rgba(0, 0, 0, 0.5)',        // black overlay - modal backdrops
      darkOverlay: 'rgba(0, 0, 0, 0.7)',    // darker black overlay - stronger backdrops
      lightOverlay: 'rgba(255, 255, 255, 0.5)', // white overlay - light backdrops
      // inverted colors - dark mode colors used in light theme
      invertedPrimary: PrimaryColors.dark[25],      // dark - inverted primary
      invertedSecondary: PrimaryColors.dark[100],   // darker - inverted secondary
      invertedTertiary: PrimaryColors.dark[200],    // medium dark - inverted tertiary
      invertedElevated: PrimaryColors.dark[100],    // darker - inverted elevated
    },
    
    // text colors - typography hierarchy
    text: {
      primary: PrimaryColors.light[900],     // dark gray - primary text
      secondary: PrimaryColors.light[500],   // medium gray - secondary text
      tertiary: PrimaryColors.light[300],    // light gray - tertiary text
      inverse: PrimaryColors.light[25],      // white - text on dark backgrounds
      disabled: PrimaryColors.light[300],    // light gray - disabled text
      // inverted colors - dark mode colors used in light theme
      invertedPrimary: PrimaryColors.dark[900],      // light - inverted primary text
      invertedSecondary: PrimaryColors.dark[400],    // medium light - inverted secondary text
      invertedTertiary: PrimaryColors.dark[300],     // darker - inverted tertiary text
      invertedDisabled: PrimaryColors.dark[300],     // darker - inverted disabled text
    },
    
    // border colors - dividers and outlines
    border: {
      primary: PrimaryColors.light[25],     // light gray - primary borders
      secondary: PrimaryColors.light[100],   // very light gray - secondary borders
      focus: PrimaryColors.light[600],       // dark gray - focused borders
      error: SemanticColors.error[500],      // red - error borders
      success: SemanticColors.success[500],  // green - success borders
      // inverted colors - dark mode colors used in light theme
      invertedPrimary: PrimaryColors.dark[200],      // medium dark - inverted primary border
      invertedSecondary: PrimaryColors.dark[100],    // darker - inverted secondary border
      invertedFocus: PrimaryColors.dark[600],        // light - inverted focus border
    },
    
    // interactive colors - buttons and controls
    interactive: {
      primary: PrimaryColors.light[600],     // dark gray - primary buttons
      secondary: PrimaryColors.light[100],   // light gray - secondary buttons
      tertiary: PrimaryColors.light[200],    // light neutral - tertiary buttons
      quaternary: PrimaryColors.light[300],  // medium neutral - quaternary buttons
      quinary: PrimaryColors.light[400],     // darker neutral - quinary buttons
      hover: PrimaryColors.light[700],       // darker gray - hover states
      active: PrimaryColors.light[800],      // darkest gray - active states
      disabled: PrimaryColors.light[200],    // light gray - disabled states
      // inverted colors - dark mode colors used in light theme
      invertedPrimary: PrimaryColors.dark[900],      // light - inverted primary interactive
      invertedSecondary: PrimaryColors.dark[600],    // medium light - inverted secondary interactive
      invertedTertiary: PrimaryColors.dark[300],     // darker - inverted tertiary interactive
      invertedQuaternary: PrimaryColors.dark[200],   // medium dark - inverted quaternary interactive
      invertedQuinary: PrimaryColors.dark[100],      // darkest - inverted quinary interactive
      invertedHover: PrimaryColors.dark[700],        // lighter - inverted hover state
      invertedActive: PrimaryColors.dark[800],       // lightest - inverted active state
      invertedDisabled: PrimaryColors.dark[200],     // medium dark - inverted disabled state
    },
  },
  
  dark: {
    primaryButton: {
      fill: PrimaryButtonColors.dark.fill,
      icon: PrimaryButtonColors.dark.icon,
    },
    // background colors - surfaces and containers
    background: {
      primary: PrimaryColors.dark[25],       // dark - main backgrounds
      secondary: PrimaryColors.dark[100],    // darker gray - secondary surfaces
      primarySecondaryBlend: PrimaryColors.dark[50], // blend between primary and secondary
      tertiary: PrimaryColors.dark[200],     // medium gray - tertiary surfaces
      quaternary: PrimaryColors.dark[300],   // darker - quaternary surfaces
      elevated: PrimaryColors.dark[100],     // darker gray - elevated surfaces
      overlay: 'rgba(0, 0, 0, 0.5)',        // black overlay - modal backdrops
      darkOverlay: 'rgba(0, 0, 0, 0.9)',    // darker black overlay - stronger backdrops
      lightOverlay: 'rgba(255, 255, 255, 0.05)', // white overlay - light backdrops
      // inverted colors - light mode colors used in dark theme
      invertedPrimary: PrimaryColors.light[100],     // white - inverted primary
      invertedSecondary: PrimaryColors.light[100],   // light gray - inverted secondary
      invertedTertiary: PrimaryColors.light[200],    // medium light gray - inverted tertiary
      invertedElevated: PrimaryColors.light[25],     // white - inverted elevated
    },
    
    // text colors - typography hierarchy
    text: {
      primary: PrimaryColors.dark[900],      // light gray - primary text
      secondary: PrimaryColors.dark[400],    // medium gray - secondary text
      tertiary: PrimaryColors.dark[300],     // darker gray - tertiary text
      quaternary: PrimaryColors.dark[200],    // medium gray - quaternary text
      inverse: PrimaryColors.dark[900],      // very light - text on dark backgrounds
      disabled: PrimaryColors.dark[300],     // darker gray - disabled text
      // inverted colors - light mode colors used in dark theme
      invertedPrimary: PrimaryColors.light[900],     // dark gray - inverted primary text
      invertedSecondary: PrimaryColors.light[400],   // medium gray - inverted secondary text
      invertedTertiary: PrimaryColors.light[300],    // light gray - inverted tertiary text
      invertedDisabled: PrimaryColors.light[300],    // light gray - inverted disabled text
    },
    
    // border colors - dividers and outlines
    border: {
      primary: PrimaryColors.dark[200],      // medium gray - primary borders
      secondary: PrimaryColors.dark[100],    // darker gray - secondary borders
      focus: PrimaryColors.dark[600],        // light gray - focused borders
      error: SemanticColors.error[500],      // red - error borders
      success: SemanticColors.success[500],  // green - success borders
      // inverted colors - light mode colors used in dark theme
      invertedPrimary: PrimaryColors.light[25],      // light gray - inverted primary border
      invertedSecondary: PrimaryColors.light[100],   // very light gray - inverted secondary border
      invertedFocus: PrimaryColors.light[600],       // dark gray - inverted focus border
    },
    
    // interactive colors - buttons and controls
    interactive: {
      primary: PrimaryColors.dark[900],      // light gray - primary buttons
      secondary: PrimaryColors.dark[400],    // medium gray - secondary buttons
      tertiary: PrimaryColors.dark[300],     // medium dark - tertiary buttons
      quaternary: PrimaryColors.dark[200],   // darker gray - quaternary buttons
      quinary: PrimaryColors.dark[100],      // darkest gray - quinary buttons
      hover: PrimaryColors.dark[700],        // lighter gray - hover states
      active: PrimaryColors.dark[800],       // lightest gray - active states
      disabled: PrimaryColors.dark[200],     // medium gray - disabled states
      // inverted colors - light mode colors used in dark theme
      invertedPrimary: PrimaryColors.light[600],     // dark gray - inverted primary interactive
      invertedSecondary: PrimaryColors.light[100],   // light gray - inverted secondary interactive
      invertedTertiary: PrimaryColors.light[200],    // light neutral - inverted tertiary interactive
      invertedQuaternary: PrimaryColors.light[300],  // medium neutral - inverted quaternary interactive
      invertedQuinary: PrimaryColors.light[400],     // darker neutral - inverted quinary interactive
      invertedHover: PrimaryColors.light[700],       // darker gray - inverted hover state
      invertedActive: PrimaryColors.light[800],      // darkest gray - inverted active state
      invertedDisabled: PrimaryColors.light[200],    // light gray - inverted disabled state
    },
  },
} as const;

/**
 * FAB (Floating Action Button) — legacy constants
 *
 * Prefer `ThemeColors[theme].primaryButton.*` / `useThemeColors().primaryButton` for tint + icon.
 * `glassBorder`: semi-transparent white for glass-like border ring (Android fallback).
 */
export const FABColors = {
  // legacy export now resolves tint through brand helper to avoid hardcoded brand references
  tint: getBrandColor(500),
  icon: PrimaryButtonColors.light.icon,
  glassBorder: 'rgba(255, 255, 255, 0.5)',
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
 * Pick one botanical ramp + step — returns a hex string; invalid shade falls back to 500 on that ramp.
 */
export function getBrandPaletteColor(palette: BrandPaletteId, shade: BrandColorShade = 500): string {
  const ramp = BrandPalettes[palette];
  return ramp[shade] ?? ramp[500];
}

/** plant ramp — same hues as default `getBrandColor` */
export function getPlantBrandColor(shade: BrandColorShade = 500): string {
  return getBrandPaletteColor('plant', shade);
}

export function getSageBrandColor(shade: BrandColorShade = 500): string {
  return getBrandPaletteColor('sage', shade);
}

export function getMossBrandColor(shade: BrandColorShade = 500): string {
  return getBrandPaletteColor('moss', shade);
}

/**
 * Parses intro / config strings like `brand:500`, `plant:300`, `sage:100` — `brand` is an alias for **plant**.
 * Returns null if the string is not that pattern (so callers can fall through to theme keys or raw hex).
 */
export function resolveBrandStyleToken(token: string): string | null {
  const match = /^(brand|plant|sage|moss):(\d+)$/.exec(token);
  if (!match) return null;
  const prefix = match[1] as 'brand' | 'plant' | 'sage' | 'moss';
  const shade = Number(match[2]) as BrandColorShade;
  const palette: BrandPaletteId = prefix === 'brand' || prefix === 'plant' ? 'plant' : prefix;
  return getBrandPaletteColor(palette, shade);
}

/**
 * Default product accent — uses **plant** ramp (primary CTAs / FAB).
 * For sage or moss, call `getSageBrandColor` / `getMossBrandColor` or `getBrandPaletteColor('sage', shade)`.
 */
export function getBrandColor(shade: BrandColorShade = 500): string {
  return getPlantBrandColor(shade);
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
 *    - Backgrounds: ThemeColors[theme].background.primary (main)
 *    - Secondary: ThemeColors[theme].background.secondary (light gray)
 *    - Tertiary: ThemeColors[theme].background.tertiary (medium gray)
 *    - Quaternary: ThemeColors[theme].background.quaternary (very light/dark)
 *    - Elevated: ThemeColors[theme].background.elevated (modals, cards)
 *    - Text: ThemeColors[theme].text.primary
 *    - Borders: ThemeColors[theme].border.primary
 * 
 * 2. Inverted Colors (for contrast within a theme):
 *    - Inverted Backgrounds: ThemeColors[theme].background.invertedPrimary
 *    - Inverted Text: ThemeColors[theme].text.invertedPrimary
 *    - Inverted Borders: ThemeColors[theme].border.invertedPrimary
 *    - Inverted Interactive: ThemeColors[theme].interactive.invertedPrimary
 *    
 *    Example use case: Light theme using dark colors for a header section
 *    backgroundColor: ThemeColors.light.background.invertedPrimary (gives dark background in light theme)
 *    color: ThemeColors.light.text.invertedPrimary (gives light text in light theme)
 * 
 * 3. Semantic Colors:
 *    - Success: getSemanticColor('success', 500)
 *    - Error: getSemanticColor('error', 500)
 *    - Warning: getSemanticColor('warning', 500)
 *    - Info: getSemanticColor('info', 500)
 * 
 * 4. Task Category Colors:
 *    - Task icons: getTaskCategoryColor('red', 500)
 *    - Task backgrounds: getTaskCategoryColor('red', 50)
 *    - Task hover states: getTaskCategoryColor('red', 100)
 * 
 * 4b. Brand Colors (three green ramps — plant default for CTAs):
 *    - Primary accent: getBrandColor(500)  → plant 500
 *    - Other ramps: getBrandPaletteColor('sage', 500), getMossBrandColor(100), etc.
 *    - In components: useColorPalette().plantBrand[500] / .sageBrand / .mossBrand
 * 
 * 5. Overlay Colors:
 *    - Standard overlay: ThemeColors[theme].background.overlay
 *    - Dark overlay: ThemeColors[theme].background.darkOverlay (stronger dark backdrop)
 *    - Light overlay: ThemeColors[theme].background.lightOverlay (subtle light backdrop)
 * 
 * 6. With Opacity:
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
 * 
 * // Using inverted colors for contrast sections (e.g., header with opposite theme)
 * const headerStyle = {
 *   backgroundColor: getThemeColor(theme, 'background', 'invertedPrimary'),
 *   color: getThemeColor(theme, 'text', 'invertedPrimary'),
 *   borderColor: getThemeColor(theme, 'border', 'invertedPrimary'),
 * };
 */

/**
 * Type definitions for color system
 */
export type PrimaryColorShade = keyof typeof PrimaryColors.light;
export type BrandColorShade = keyof typeof PlantBrandColors;
export type SemanticColorName = keyof typeof SemanticColors;
export type TaskCategoryColorName = keyof typeof TaskCategoryColors;
export type ThemeColorCategory = keyof typeof ThemeColors.light;
export type ThemeColorVariant = string;

/**
 * Default export for convenience
 */
export default {
  PrimaryColors,
  PlantBrandColors,
  SageBrandColors,
  MossBrandColors,
  BrandPalettes,
  SemanticColors,
  TaskCategoryColors,
  PrimaryButtonColors,
  ThemeColors,
  getColorValue,
  getSemanticColor,
  getTaskCategoryColor,
  getBrandPaletteColor,
  getPlantBrandColor,
  getSageBrandColor,
  getMossBrandColor,
  getBrandColor,
  getThemeColor,
  withOpacity,
  resolveBrandStyleToken,
};
