/**
 * single habit dashboard stat tile — primary fill + border, same radius as habit board cards.
 * title typography matches habit board card titles (heading-4 + secondary).
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform, type StyleProp, type ViewStyle } from 'react-native';

import {
  PROGRESS_BOARD_CARD_BORDER_RADIUS,
  PROGRESS_BOARD_GLASS_BORDER_WIDTH,
} from '@/components/features/gamification/browse/progressBoardUiTokens';
import { getTypographyStyle } from '@/constants/Typography';
import { useThemeColors } from '@/hooks/useColorPalette';
import {
  HABIT_DASHBOARD_SECTION_LABEL_MARGIN_BOTTOM,
  HABIT_DASHBOARD_TILE_MIN_HEIGHT,
  HABIT_DASHBOARD_TILE_PADDING_HORIZONTAL,
  HABIT_DASHBOARD_TILE_PADDING_VERTICAL,
} from './habitDashboardUiTokens';

type HabitDashboardTileProps = {
  label: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function HabitDashboardTile({ label, children, style }: HabitDashboardTileProps) {
  const themeColors = useThemeColors();
  // same token as HabitBoardCard title — heading-4 with Inter medium
  const titleStyle = getTypographyStyle('heading-4', Platform.OS as 'ios' | 'android' | 'web');

  const styles = useMemo(
    () =>
      StyleSheet.create({
        shell: {
          flex: 1,
          minHeight: HABIT_DASHBOARD_TILE_MIN_HEIGHT,
          backgroundColor: themeColors.background.primary(),
          borderRadius: PROGRESS_BOARD_CARD_BORDER_RADIUS,
          borderWidth: PROGRESS_BOARD_GLASS_BORDER_WIDTH,
          borderColor: themeColors.border.secondary(),
          paddingHorizontal: HABIT_DASHBOARD_TILE_PADDING_HORIZONTAL,
          paddingVertical: HABIT_DASHBOARD_TILE_PADDING_VERTICAL,
          overflow: 'hidden',
          ...(Platform.OS === 'ios' ? { borderCurve: 'continuous' as const } : null),
        },
        label: {
          ...titleStyle,
          color: themeColors.text.secondary(),
          marginBottom: HABIT_DASHBOARD_SECTION_LABEL_MARGIN_BOTTOM,
        },
        body: {
          flex: 1,
          justifyContent: 'center',
        },
      }),
    [themeColors, titleStyle],
  );

  return (
    <View style={[styles.shell, style]}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.body}>{children}</View>
    </View>
  );
}
