/**
 * body copy paragraph for one intro carousel beat.
 */

import React from 'react';
import { Text, StyleSheet } from 'react-native';

import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';

export type IntroSlideBodySectionProps = {
  text: string;
};

export function IntroSlideBodySection({ text }: IntroSlideBodySectionProps) {
  const themeColors = useThemeColors();
  const typography = useTypography();
  return (
    <Text
      style={[
        typography.getTextStyle('body-large'),
        styles.body,
        { color: themeColors.text.secondary() },
      ]}
    >
      {text}
    </Text>
  );
}

const styles = StyleSheet.create({
  body: {
    lineHeight: 24,
  },
});
