/**
 * chevron row on HabitCard — toggles heatmap (expanded) vs simplified (minimized) layout.
 * sits at the bottom of the animated footer block so it moves with the card edge.
 */

import React, { useEffect, useMemo } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated as RNAnimated, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Reanimated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { useDropdownArrowAnimation } from '@/hooks/useDropdownArrowAnimation';
import { Paddings } from '@/constants/Paddings';
import {
  HABIT_CARD_VARIANT_FADE_MS,
  HABIT_CARD_VARIANT_TIMING_CONFIG,
} from './habitCardUiTokens';
import { HabitHeatmapLegend } from '../detail/HabitHeatmapLegend';
import type { HabitCardVariant } from './HabitCard';
import type { HabitColor } from '@/types/api/habits';

type HabitCardVariantToggleProps = {
  /** chevron rotation — updates immediately on tap */
  variant: HabitCardVariant;
  /** label + legend — follows body content so the row stays glued to the footer edge */
  displayVariant: HabitCardVariant;
  onPress: () => void;
  color?: HabitColor;
};

export function HabitCardVariantToggle({
  variant,
  displayVariant,
  onPress,
  color,
}: HabitCardVariantToggleProps) {
  const themeColors = useThemeColors();
  const typography = useTypography();
  const isHeatmapExpanded = variant === 'heatmap';
  const isHeatmapDisplay = displayVariant === 'heatmap';
  const { arrowRotation, toggle } = useDropdownArrowAnimation(isHeatmapExpanded, HABIT_CARD_VARIANT_FADE_MS);

  const legendOpacity = useSharedValue(isHeatmapDisplay ? 1 : 0);

  const styles = useMemo(() => createStyles(typography), [typography]);

  useEffect(() => {
    toggle(isHeatmapExpanded);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync on variant only
  }, [isHeatmapExpanded]);

  const label = isHeatmapDisplay ? 'Minimize' : 'Consistency';

  // opacity-only legend — fixed slot height so the row never jumps during footer resize
  useEffect(() => {
    legendOpacity.value = withTiming(isHeatmapDisplay ? 1 : 0, HABIT_CARD_VARIANT_TIMING_CONFIG);
  }, [isHeatmapDisplay, legendOpacity]);

  const legendAnimatedStyle = useAnimatedStyle(() => ({
    opacity: legendOpacity.value,
  }));

  const chevronColor = themeColors.text.tertiary();

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={
        isHeatmapExpanded ? 'Minimize habit card' : 'Expand habit card to show consistency heatmap'
      }
      accessibilityState={{ expanded: isHeatmapExpanded }}
    >
      <View style={styles.legendSlot}>
        {color ? (
          <Reanimated.View
            style={[styles.legendLayer, legendAnimatedStyle]}
            pointerEvents={isHeatmapDisplay ? 'auto' : 'none'}
          >
            <HabitHeatmapLegend color={color} compact />
          </Reanimated.View>
        ) : null}
      </View>
      <View style={styles.toggleCluster}>
        <Text style={[styles.label, { color: chevronColor }]}>{label}</Text>
        <RNAnimated.View style={{ transform: [{ rotate: arrowRotation }] }}>
          <Ionicons name="chevron-down" size={20} color={chevronColor} />
        </RNAnimated.View>
      </View>
    </TouchableOpacity>
  );
}

const LEGEND_SLOT_HEIGHT = 14;

const createStyles = (typography: ReturnType<typeof useTypography>) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: Paddings.touchTargetSmall,
      flexShrink: 0,
    },
    legendSlot: {
      flex: 1,
      height: LEGEND_SLOT_HEIGHT,
      justifyContent: 'center',
    },
    legendLayer: {
      alignSelf: 'flex-start',
    },
    toggleCluster: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      flexShrink: 0,
    },
    label: {
      ...typography.getTextStyle('body-small'),
    },
  });
