/**
 * Theme Slice - Redux State Management for Theme and Preferences
 * 
 * This file defines the Redux slice for managing theme-related state.
 * It handles dark/light mode, color schemes, and user preferences.
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * Define the shape of the theme state
 */
interface ThemeState {
  // Theme mode
  mode: 'light' | 'dark' | 'system'; // Current theme mode
  
  // Color scheme
  colors: {
    primary: string;                 // Primary brand color
    secondary: string;               // Secondary brand color
    accent: string;                  // Accent color
    background: string;              // Background color
    surface: string;                 // Surface color (cards, modals)
    text: string;                    // Primary text color
    textSecondary: string;           // Secondary text color
    border: string;                  // Border color
    error: string;                   // Error color
    warning: string;                 // Warning color
    success: string;                 // Success color
    info: string;                    // Info color
  };
  
  // Typography
  typography: {
    fontFamily: string;              // Primary font family
    fontSize: {
      xs: number;                    // Extra small font size
      sm: number;                    // Small font size
      md: number;                    // Medium font size
      lg: number;                    // Large font size
      xl: number;                    // Extra large font size
      xxl: number;                   // Extra extra large font size
    };
    fontWeight: {
      light: string;                 // Light font weight
      normal: string;                // Normal font weight
      medium: string;                // Medium font weight
      semibold: string;              // Semi-bold font weight
      bold: string;                  // Bold font weight
    };
  };
  
  // Spacing
  spacing: {
    xs: number;                      // Extra small spacing
    sm: number;                      // Small spacing
    md: number;                      // Medium spacing
    lg: number;                      // Large spacing
    xl: number;                      // Extra large spacing
    xxl: number;                     // Extra extra large spacing
  };
  
  // Border radius
  borderRadius: {
    sm: number;                      // Small border radius
    md: number;                      // Medium border radius
    lg: number;                      // Large border radius
    xl: number;                      // Extra large border radius
    full: number;                    // Full border radius (circular)
  };
  
  // Shadows
  shadows: {
    sm: string;                      // Small shadow
    md: string;                      // Medium shadow
    lg: string;                      // Large shadow
    xl: string;                      // Extra large shadow
  };
  
  // Animation settings
  animations: {
    duration: {
      fast: number;                  // Fast animation duration
      normal: number;                // Normal animation duration
      slow: number;                  // Slow animation duration
    };
    easing: {
      easeIn: string;                // Ease in animation
      easeOut: string;               // Ease out animation
      easeInOut: string;             // Ease in-out animation
    };
  };
  
  // User preferences
  preferences: {
    reducedMotion: boolean;          // Whether to reduce motion
    highContrast: boolean;           // Whether to use high contrast
    fontSize: 'small' | 'medium' | 'large'; // Font size preference
  };
}

/**
 * Define color schemes for different themes
 */
const lightColors = {
  primary: '#007AFF',
  secondary: '#5856D6',
  accent: '#FF9500',
  background: '#FFFFFF',
  surface: '#F2F2F7',
  text: '#000000',
  textSecondary: '#6D6D70',
  border: '#C6C6C8',
  error: '#FF3B30',
  warning: '#FF9500',
  success: '#34C759',
  info: '#007AFF',
};

const darkColors = {
  primary: '#0A84FF',
  secondary: '#5E5CE6',
  accent: '#FF9F0A',
  background: '#000000',
  surface: '#1C1C1E',
  text: '#FFFFFF',
  textSecondary: '#8E8E93',
  border: '#38383A',
  error: '#FF453A',
  warning: '#FF9F0A',
  success: '#30D158',
  info: '#0A84FF',
};

/**
 * Initial state - the default state when the app starts
 */
const initialState: ThemeState = {
  // Start with system theme
  mode: 'system',
  
  // Start with light colors (will be updated based on system preference)
  colors: lightColors,
  
  // Typography settings
  typography: {
    fontFamily: 'System',
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
    },
    fontWeight: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
  
  // Spacing settings
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  // Border radius settings
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  
  // Shadow settings
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.1)',
  },
  
  // Animation settings
  animations: {
    duration: {
      fast: 150,
      normal: 300,
      slow: 500,
    },
    easing: {
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
  
  // User preferences
  preferences: {
    reducedMotion: false,
    highContrast: false,
    fontSize: 'medium',
  },
};

/**
 * Create the theme slice
 */
const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    /**
     * Theme mode management actions
     */
    
    // Set theme mode
    setThemeMode: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.mode = action.payload;
      
      // Update colors based on theme mode
      if (action.payload === 'light') {
        state.colors = lightColors;
      } else if (action.payload === 'dark') {
        state.colors = darkColors;
      } else {
        // System mode - will be handled by the app based on system preference
        // For now, default to light
        state.colors = lightColors;
      }
    },
    
    // Toggle between light and dark mode
    toggleTheme: (state) => {
      if (state.mode === 'light') {
        state.mode = 'dark';
        state.colors = darkColors;
      } else if (state.mode === 'dark') {
        state.mode = 'light';
        state.colors = lightColors;
      } else {
        // If system mode, toggle to light
        state.mode = 'light';
        state.colors = lightColors;
      }
    },
    
    /**
     * Color customization actions
     */
    
    // Set custom colors
    setCustomColors: (state, action: PayloadAction<Partial<ThemeState['colors']>>) => {
      state.colors = { ...state.colors, ...action.payload };
    },
    
    // Reset colors to default
    resetColors: (state) => {
      if (state.mode === 'dark') {
        state.colors = darkColors;
      } else {
        state.colors = lightColors;
      }
    },
    
    /**
     * Typography customization actions
     */
    
    // Set font family
    setFontFamily: (state, action: PayloadAction<string>) => {
      state.typography.fontFamily = action.payload;
    },
    
    // Set font sizes
    setFontSizes: (state, action: PayloadAction<Partial<ThemeState['typography']['fontSize']>>) => {
      state.typography.fontSize = { ...state.typography.fontSize, ...action.payload };
    },
    
    // Set font weights
    setFontWeights: (state, action: PayloadAction<Partial<ThemeState['typography']['fontWeight']>>) => {
      state.typography.fontWeight = { ...state.typography.fontWeight, ...action.payload };
    },
    
    /**
     * Spacing customization actions
     */
    
    // Set spacing values
    setSpacing: (state, action: PayloadAction<Partial<ThemeState['spacing']>>) => {
      state.spacing = { ...state.spacing, ...action.payload };
    },
    
    /**
     * Border radius customization actions
     */
    
    // Set border radius values
    setBorderRadius: (state, action: PayloadAction<Partial<ThemeState['borderRadius']>>) => {
      state.borderRadius = { ...state.borderRadius, ...action.payload };
    },
    
    /**
     * Shadow customization actions
     */
    
    // Set shadow values
    setShadows: (state, action: PayloadAction<Partial<ThemeState['shadows']>>) => {
      state.shadows = { ...state.shadows, ...action.payload };
    },
    
    /**
     * Animation customization actions
     */
    
    // Set animation durations
    setAnimationDurations: (state, action: PayloadAction<Partial<ThemeState['animations']['duration']>>) => {
      state.animations.duration = { ...state.animations.duration, ...action.payload };
    },
    
    // Set animation easing
    setAnimationEasing: (state, action: PayloadAction<Partial<ThemeState['animations']['easing']>>) => {
      state.animations.easing = { ...state.animations.easing, ...action.payload };
    },
    
    /**
     * User preferences actions
     */
    
    // Set user preferences
    setPreferences: (state, action: PayloadAction<Partial<ThemeState['preferences']>>) => {
      state.preferences = { ...state.preferences, ...action.payload };
    },
    
    // Toggle reduced motion
    toggleReducedMotion: (state) => {
      state.preferences.reducedMotion = !state.preferences.reducedMotion;
    },
    
    // Toggle high contrast
    toggleHighContrast: (state) => {
      state.preferences.highContrast = !state.preferences.highContrast;
    },
    
    // Set font size preference
    setFontSizePreference: (state, action: PayloadAction<'small' | 'medium' | 'large'>) => {
      state.preferences.fontSize = action.payload;
      
      // Adjust font sizes based on preference
      const multiplier = action.payload === 'small' ? 0.9 : action.payload === 'large' ? 1.1 : 1;
      state.typography.fontSize = {
        xs: Math.round(12 * multiplier),
        sm: Math.round(14 * multiplier),
        md: Math.round(16 * multiplier),
        lg: Math.round(18 * multiplier),
        xl: Math.round(20 * multiplier),
        xxl: Math.round(24 * multiplier),
      };
    },
    
    /**
     * Utility actions
     */
    
    // Reset theme to initial state
    resetTheme: () => initialState,
    
    // Apply system theme (called when system theme changes)
    applySystemTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      if (state.mode === 'system') {
        state.colors = action.payload === 'dark' ? darkColors : lightColors;
      }
    },
  },
});

/**
 * Export actions and reducer
 */
export const {
  // Theme mode actions
  setThemeMode,
  toggleTheme,
  
  // Color actions
  setCustomColors,
  resetColors,
  
  // Typography actions
  setFontFamily,
  setFontSizes,
  setFontWeights,
  
  // Spacing actions
  setSpacing,
  
  // Border radius actions
  setBorderRadius,
  
  // Shadow actions
  setShadows,
  
  // Animation actions
  setAnimationDurations,
  setAnimationEasing,
  
  // Preferences actions
  setPreferences,
  toggleReducedMotion,
  toggleHighContrast,
  setFontSizePreference,
  
  // Utility actions
  resetTheme,
  applySystemTheme,
} = themeSlice.actions;

export default themeSlice.reducer;
