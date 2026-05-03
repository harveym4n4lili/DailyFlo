/**
 * placeholder block that lives inside the horizontal carousel — moves on swipe so motion is obvious.
 * headline + subtext stay fixed above; only this (and backgrounds) ride the pager.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Paddings } from '@/constants/Paddings';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';

export type IntroSlideSampleContentProps = {
  /** 0-based index — used to vary the sample card slightly per slide */
  pageIndex: number;
};

export function IntroSlideSampleContent({ pageIndex }: IntroSlideSampleContentProps) {
  const themeColors = useThemeColors();
  const typography = useTypography();

  return (
    <View style={styles.root}>
      <Text style={[typography.getTextStyle('body-small'), styles.hint, { color: themeColors.text.tertiary() }]}>
        This block scrolls sideways with the slide — swipe to see it move.
      </Text>
      <View style={[styles.card, { borderColor: themeColors.border.primary(), backgroundColor: themeColors.background.elevated() }]}>
        <View style={[styles.accent, { backgroundColor: themeColors.primaryButton.fill() }]} />
        <Text style={[typography.getTextStyle('heading-3'), { color: themeColors.text.primary() }]}>
          Sample content · slide {pageIndex + 1}
        </Text>
        <View style={styles.row}>
          <View style={[styles.pill, { backgroundColor: themeColors.background.tertiary() }]} />
          <View style={[styles.pillWide, { backgroundColor: themeColors.background.secondary() }]} />
        </View>
        <View style={styles.row}>
          <View style={[styles.pillWide, { backgroundColor: themeColors.background.secondary() }]} />
          <View style={[styles.pill, { backgroundColor: themeColors.background.tertiary() }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    marginTop: Paddings.screen,
    gap: 12,
  },
  hint: {
    lineHeight: 20,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: Paddings.screen,
    gap: 14,
  },
  accent: {
    height: 4,
    width: 48,
    borderRadius: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pill: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  pillWide: {
    flex: 1,
    height: 44,
    borderRadius: 10,
  },
});
