/**
 * habit progress subtitle — tertiary prefix + secondary score (matches HabitCard / detail layout).
 */

import React, { useMemo } from 'react';
import { Text, StyleSheet, type StyleProp, type TextStyle } from 'react-native';

import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import {
  getHabitProgressLabelPrefix,
  type HabitProgressLabelVariant,
} from './habitProgressLabel';

type HabitProgressScoreLabelProps = {
  variant: HabitProgressLabelVariant;
  scoreLabel: string;
  /** defaults to body-small — detail sheet passes body-medium */
  textStyle?: StyleProp<TextStyle>;
};

export function HabitProgressScoreLabel({
  variant,
  scoreLabel,
  textStyle,
}: HabitProgressScoreLabelProps) {
  const themeColors = useThemeColors();
  const typography = useTypography();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        base: {
          ...typography.getTextStyle('body-small'),
          fontVariant: ['tabular-nums'],
        },
      }),
    [typography],
  );

  return (
    <Text style={[styles.base, textStyle]}>
      <Text style={{ color: themeColors.text.tertiary() }}>
        {getHabitProgressLabelPrefix(variant)}
      </Text>
      <Text style={{ color: themeColors.text.secondary() }}>{scoreLabel}</Text>
    </Text>
  );
}
