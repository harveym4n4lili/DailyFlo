/**
 * LoadingState Component
 * 
 * Displays a loading state message when tasks are being fetched.
 * Used to provide user feedback during data loading.
 * 
 * This component is used by ListCard to display loading states.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';

interface LoadingStateProps {
  // message to display
  message?: string;
}

/**
 * LoadingState Component
 * 
 * Renders a loading state message centered on the screen.
 */
export default function LoadingState({ message = 'Loading tasks...' }: LoadingStateProps) {
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
    // loading state container
    container: {
      flex: 1, // take up available space
      justifyContent: 'center', // center vertically
      alignItems: 'center', // center horizontally
      paddingHorizontal: 32, // horizontal padding
      paddingVertical: 64, // vertical padding
    },

    // loading message text styling
    // using typography system for consistent text styling
    message: {
      // use the body-large text style from typography system (14px, regular, satoshi font)
      ...typography.getTextStyle('body-large'),
      // use theme-aware secondary text color from color system
      color: themeColors.text.secondary(),
      textAlign: 'center', // center the text
    },
  });

