/**
 * body copy paragraph for one intro carousel beat.
 */

import React from 'react';
import { Text, StyleSheet } from 'react-native';

import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';

import type { IntroThemeTextColorKey } from '@/components/features/onboarding/introductory/constants';

export type IntroSlideBodySectionProps = {
  text: string;
  /** theme text token — set per slide via `INTRO_PAGE_SLIDE_UI` in onboarding constants */
  textColorKey?: IntroThemeTextColorKey;
};

export function IntroSlideBodySection({ text, textColorKey = 'secondary' }: IntroSlideBodySectionProps) {
  const themeColors = useThemeColors();
  const typography = useTypography();
  return (
    <Text
      style={[
        typography.getTextStyle('body-large'),
        styles.body,
        { color: themeColors.text[textColorKey]() },
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
