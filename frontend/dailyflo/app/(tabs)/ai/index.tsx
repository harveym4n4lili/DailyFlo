/**
 * AI Tab Screen
 *
 * Tab bar item labeled "AI". Shows AI title with no content (placeholder for future AI features).
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { Paddings } from '@/constants/Paddings';

export default function AITabScreen() {
  const insets = useSafeAreaInsets();
  const themeColors = useThemeColors();
  const typography = useTypography();
  const styles = createStyles(themeColors, typography, insets);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AI</Text>
    </View>
  );
}

const createStyles = (
  themeColors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useTypography>,
  insets: ReturnType<typeof useSafeAreaInsets>
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background.primary(),
      paddingTop: insets.top,
      paddingHorizontal: Paddings.screen,
    },
    title: {
      ...typography.getTextStyle('heading-2'),
      color: themeColors.text.primary(),
    },
  });
