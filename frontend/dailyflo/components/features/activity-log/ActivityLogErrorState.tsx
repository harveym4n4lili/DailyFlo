/**
 * ActivityLogErrorState Component
 *
 * Centred error message with a retry button when the activity log fetch fails.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { getFontFamilyWithWeight } from '@/constants/Typography';
import { Paddings } from '@/constants/Paddings';

const HEADER_HEIGHT = 56;

export interface ActivityLogErrorStateProps {
  /** the error message to display */
  error: string;
  /** called when the user taps the retry button */
  onRetry: () => void;
  /** optional top padding to account for fixed header */
  topPadding?: number;
}

export function ActivityLogErrorState({
  error,
  onRetry,
  topPadding = HEADER_HEIGHT,
}: ActivityLogErrorStateProps) {
  const themeColors = useThemeColors();
  const typography = useTypography();
  const textSecondary = themeColors.text.secondary();

  const errorTextStyle = {
    ...typography.getTextStyle('body-large'),
    fontFamily: getFontFamilyWithWeight('regular'),
    textAlign: 'center' as const,
    color: textSecondary,
  };
  const retryTextStyle = {
    ...typography.getTextStyle('body-medium'),
    fontFamily: getFontFamilyWithWeight('medium'),
    color: textSecondary,
  };

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <Text style={errorTextStyle}>{error}</Text>
      <TouchableOpacity onPress={onRetry} style={styles.retryButton}>
        <Text style={retryTextStyle}>Tap to retry</Text>
      </TouchableOpacity>
    </View>
  );
}

export default ActivityLogErrorState;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Paddings.screen,
  },
  retryButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
});
