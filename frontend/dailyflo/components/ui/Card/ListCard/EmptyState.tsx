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
import { Paddings } from '@/constants/Paddings';

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
      ...typography.getTextStyle('heading-3'),
      color: themeColors.text.secondary(),
      textAlign: 'center',
      lineHeight: 24,
    },
  });

