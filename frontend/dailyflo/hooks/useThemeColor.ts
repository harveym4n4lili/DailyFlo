/**
 * Theme Color Hook
 * 
 * This hook provides access to the global theme color that users can select.
 * The theme color is used throughout the UI for interactive elements like buttons,
 * navigation, and accents.
 * 
 * TODO: Backend implementation will be added later to persist theme color selection
 * For now, theme color is stored in local state/AsyncStorage
 * 
 * Theme color options are the same as task category colors:
 * - red, blue, green, yellow, purple, teal, orange
 * 
 * Default theme color: red
 */

import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TaskColor } from '@/types';
import { getTaskCategoryColor } from '@/constants/ColorPalette';

const THEME_COLOR_STORAGE_KEY = '@DailyFlo:themeColor';

/**
 * Hook to get and set the global theme color
 * 
 * @returns Object with themeColor, setThemeColor, and getThemeColorValue function
 */
export function useThemeColor() {
  // Default theme color is red
  const [themeColor, setThemeColorState] = useState<TaskColor>('red');

  // Load theme color from storage on mount
  useEffect(() => {
    const loadThemeColor = async () => {
      try {
        const stored = await AsyncStorage.getItem(THEME_COLOR_STORAGE_KEY);
        if (stored) {
          const color = stored as TaskColor;
          // Validate that it's a valid task color
          const validColors: TaskColor[] = ['red', 'blue', 'green', 'yellow', 'purple', 'teal', 'orange'];
          if (validColors.includes(color)) {
            setThemeColorState(color);
          }
        }
      } catch (error) {
        console.error('Failed to load theme color:', error);
      }
    };

    loadThemeColor();
  }, []);

  // Set theme color and persist to storage
  const setThemeColor = async (color: TaskColor) => {
    try {
      setThemeColorState(color);
      await AsyncStorage.setItem(THEME_COLOR_STORAGE_KEY, color);
      // TODO: Backend implementation - sync theme color to user preferences
    } catch (error) {
      console.error('Failed to save theme color:', error);
    }
  };

  // Get the actual color value (hex) for the theme color
  const getThemeColorValue = (shade: keyof ReturnType<typeof getTaskCategoryColor> = 500): string => {
    return getTaskCategoryColor(themeColor, shade);
  };

  return {
    themeColor,
    setThemeColor,
    getThemeColorValue,
  };
}

