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
import { Paddings } from '@/constants/Paddings';

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
    // --- PADDING STYLES ---
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: Paddings.contentHorizontal,
      paddingVertical: Paddings.contentVertical,
    },

    // --- TYPOGRAPHY STYLES ---
    message: {
      ...typography.getTextStyle('body-large'),
      color: themeColors.text.secondary(),
      textAlign: 'center',
    },
  });

