/**
 * ActivityLogEmptyState Component
 *
 * Centred empty state message when the user has no activity logs yet.
 * Shown when the fetch succeeded but returned an empty array.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { getFontFamilyWithWeight } from '@/constants/Typography';
import { Paddings } from '@/constants/Paddings';

const HEADER_HEIGHT = 56;

export interface ActivityLogEmptyStateProps {
  /** optional custom message (default: standard empty message) */
  message?: string;
  /** optional top padding to account for fixed header */
  topPadding?: number;
}

const DEFAULT_MESSAGE =
  "No activity yet.\nComplete, edit or delete a task to see it here.";

export function ActivityLogEmptyState({
  message = DEFAULT_MESSAGE,
  topPadding = HEADER_HEIGHT,
}: ActivityLogEmptyStateProps) {
  const themeColors = useThemeColors();
  const typography = useTypography();

  const textStyle = {
    ...typography.getTextStyle('body-large'),
    fontFamily: getFontFamilyWithWeight('regular'),
    textAlign: 'center' as const,
    color: themeColors.text.secondary(),
  };

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <Text style={textStyle}>{message}</Text>
    </View>
  );
}

export default ActivityLogEmptyState;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Paddings.screen,
  },
});
