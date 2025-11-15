/**
 * EmptyState Component
 * 
 * Displays an empty state message when there are no tasks to display.
 * Used to provide user feedback when lists are empty.
 * 
 * This component is used by ListCard to display empty states.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';

interface EmptyStateProps {
  // message to display
  message?: string;
}

/**
 * EmptyState Component
 * 
 * Renders an empty state message centered on the screen.
 */
export default function EmptyState({ message = 'No tasks available' }: EmptyStateProps) {
  const themeColors = useThemeColors();
  const typography = useTypography();

  // create dynamic styles using theme colors and typography
  const styles = createStyles(themeColors, typography);

  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

// create dynamic styles using theme colors and typography
const createStyles = (
  themeColors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useTypography>
) =>
  StyleSheet.create({
    // empty state container
    container: {
      flex: 1, // take up available space
      justifyContent: 'center', // center vertically
      alignItems: 'center', // center horizontally
      paddingHorizontal: 32, // horizontal padding
      paddingVertical: 64, // vertical padding
    },

    // empty message text styling
    // using typography system for consistent text styling
    message: {
      // use the heading-3 text style from typography system (18px, bold, satoshi font)
      ...typography.getTextStyle('heading-3'),
      // use theme-aware secondary text color from color system
      color: themeColors.text.secondary(),
      textAlign: 'center', // center the text
      lineHeight: 24, // better readability
    },
  });

