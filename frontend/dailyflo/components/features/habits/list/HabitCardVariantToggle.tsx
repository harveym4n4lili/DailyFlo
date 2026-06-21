/**
 * chevron row on HabitCard — toggles heatmap (expanded) vs simplified (minimized) layout.
 * matches GroupedListHeader / ListCard group chevron rotation (down = expanded).
 */

import React, { useEffect, useMemo } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated as RNAnimated, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Reanimated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { useDropdownArrowAnimation } from '@/hooks/useDropdownArrowAnimation';
import { Paddings } from '@/constants/Paddings';
import {
  HABIT_CARD_VARIANT_FADE_MS,
  HABIT_CARD_VARIANT_TOGGLE_MARGIN_TOP,
} from './habitCardUiTokens';
import { HabitHeatmapLegend } from '../detail/HabitHeatmapLegend';
import type { HabitCardVariant } from './HabitCard';
import type { HabitColor } from '@/types/api/habits';

type HabitCardVariantToggleProps = {
  variant: HabitCardVariant;
  onPress: () => void;
  /** habit color — legend on the left when heatmap form is expanded */
  color?: HabitColor;
};

export function HabitCardVariantToggle({ variant, onPress, color }: HabitCardVariantToggleProps) {
  const themeColors = useThemeColors();
  const typography = useTypography();
  const isHeatmapExpanded = variant === 'heatmap';
  const { arrowRotation, toggle } = useDropdownArrowAnimation(isHeatmapExpanded);

  const styles = useMemo(() => createStyles(typography), [typography]);

  // keep chevron in sync when parent variant changes
  useEffect(() => {
    toggle(isHeatmapExpanded);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync on variant only
  }, [isHeatmapExpanded]);

  const label = isHeatmapExpanded ? 'Minimize' : 'Consistency';

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
      {isHeatmapExpanded && color ? (
        <Reanimated.View
          entering={FadeIn.duration(HABIT_CARD_VARIANT_FADE_MS)}
          exiting={FadeOut.duration(HABIT_CARD_VARIANT_FADE_MS)}
        >
          <HabitHeatmapLegend color={color} compact />
        </Reanimated.View>
      ) : (
        <View style={styles.flexSpacer} />
      )}
      <View style={styles.toggleCluster}>
        <Reanimated.View
          key={label}
          entering={FadeIn.duration(HABIT_CARD_VARIANT_FADE_MS)}
          exiting={FadeOut.duration(HABIT_CARD_VARIANT_FADE_MS)}
        >
          <Text style={[styles.label, { color: chevronColor }]}>{label}</Text>
        </Reanimated.View>
        <RNAnimated.View style={{ transform: [{ rotate: arrowRotation }] }}>
          <Ionicons name="chevron-down" size={20} color={chevronColor} />
        </RNAnimated.View>
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (typography: ReturnType<typeof useTypography>) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: HABIT_CARD_VARIANT_TOGGLE_MARGIN_TOP,
      paddingVertical: Paddings.touchTargetSmall,
    },
    toggleCluster: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    flexSpacer: {
      flex: 1,
    },
    label: {
      ...typography.getTextStyle('body-small'),
    },
  });
