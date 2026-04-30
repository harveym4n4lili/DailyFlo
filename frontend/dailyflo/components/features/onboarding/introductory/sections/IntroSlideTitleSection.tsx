/**
 * headline for one intro carousel beat.
 */

import React from 'react';
import { Text, StyleSheet } from 'react-native';

import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';

export type IntroSlideTitleSectionProps = {
  title: string;
};

export function IntroSlideTitleSection({ title }: IntroSlideTitleSectionProps) {
  const themeColors = useThemeColors();
  const typography = useTypography();
  return (
    <Text style={[styles.title, typography.getTextStyle('heading-2'), { color: themeColors.text.primary() }]}>
      {title}
    </Text>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: 12,
  },
});
