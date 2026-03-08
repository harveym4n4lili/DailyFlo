/**
 * ActivityLogLoadingState Component
 *
 * Centred loading spinner shown when the activity log is being fetched
 * and there is no cached data yet.
 */

import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useThemeColors } from '@/hooks/useColorPalette';
import { Paddings } from '@/constants/Paddings';

const HEADER_HEIGHT = 56;

export interface ActivityLogLoadingStateProps {
  /** optional top padding to account for fixed header */
  topPadding?: number;
}

export function ActivityLogLoadingState({
  topPadding = HEADER_HEIGHT,
}: ActivityLogLoadingStateProps) {
  const themeColors = useThemeColors();
  const textSecondary = themeColors.text.secondary();

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <ActivityIndicator color={textSecondary} />
    </View>
  );
}

export default ActivityLogLoadingState;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Paddings.screen,
  },
});
