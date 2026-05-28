/**
 * Large "Today" title that fades out on scroll — shared by Today list (ListCard) and timeline layout.
 * Parent owns scrollY SharedValue; mini header in topSectionAnchor appears once this fades (scrollY > 48).
 */

import React, { useMemo } from 'react';
import { Text, StyleSheet } from 'react-native';
import AnimatedReanimated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';

import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';

export type TodayBigScrollHeaderProps = {
  scrollY: SharedValue<number>;
  label?: string;
};

export function TodayBigScrollHeader({ scrollY, label = 'Today' }: TodayBigScrollHeaderProps) {
  const themeColors = useThemeColors();
  const typography = useTypography();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrapper: {
          marginBottom: 8,
        },
        title: {
          ...typography.getTextStyle('heading-1'),
          color: themeColors.text.primary(),
        },
      }),
    [themeColors, typography]
  );

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 48], [1, 0], Extrapolation.CLAMP),
  }));

  return (
    <AnimatedReanimated.View style={[styles.wrapper, animatedStyle]}>
      <Text style={styles.title}>{label}</Text>
    </AnimatedReanimated.View>
  );
}

export default TodayBigScrollHeader;
