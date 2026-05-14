/**
 * suggestion chip — blend surface + sparkles + label; idle ring uses `border.secondary`, selected animates ring + sparkles to the slide continue color (`plant:500` on post-picker task steps), not global FAB fill.
 * `useSharedValue` + `withTiming` drive border `interpolateColor` and a two-layer sparkles crossfade.
 */

import * as Haptics from 'expo-haptics';
import React, { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { SparklesIcon } from '@/components/ui/Icon';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';

import {
  ONBOARDING_TASK_AGENDA_SURFACE_BORDER_WIDTH,
  ONBOARDING_TASK_AGENDA_SUGGESTION_SELECT_ANIM_MS,
  ONBOARDING_TASK_TITLE_SURFACE_RADIUS,
} from '../constants/pagerLayout';
import { taskAgendaSuggestionChipLayoutStyles as C, TASK_AGENDA_ROW_ICON_SIZE } from './taskAgendaTitleRowLayout';

export type OnboardingTaskAgendaSuggestionRowProps = {
  label: string;
  /** true when this suggestion matches the live task title (trimmed) */
  selected: boolean;
  onSelect: () => void;
  titleTextColor: string;
  /** blended slide `continueButtonBackground` — selected border + sparkles (`plant:500` on post-picker task steps) */
  selectedBrandColor: string;
};

export function OnboardingTaskAgendaSuggestionRow({
  label,
  selected,
  onSelect,
  titleTextColor,
  selectedBrandColor,
}: OnboardingTaskAgendaSuggestionRowProps) {
  const themeColors = useThemeColors();
  const typography = useTypography();
  // cache strings for worklets — border + slide brand come from JS; `selectedBrandColor` updates when questionnaire blend moves
  const borderSecondary = themeColors.border.secondary();
  const sparklesIdle = themeColors.text.tertiary();

  const progress = useSharedValue(selected ? 1 : 0);
  useEffect(() => {
    progress.value = withTiming(selected ? 1 : 0, {
      duration: ONBOARDING_TASK_AGENDA_SUGGESTION_SELECT_ANIM_MS,
      easing: Easing.out(Easing.cubic),
    });
  }, [selected, progress]);

  const animatedBorderStyle = useAnimatedStyle(
    () => ({
      borderColor: interpolateColor(progress.value, [0, 1], [borderSecondary, selectedBrandColor]),
    }),
    [borderSecondary, selectedBrandColor],
  );

  const sparklesUnselectedLayerStyle = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
  }));
  const sparklesSelectedLayerStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  const select = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect();
  };

  return (
    <Pressable
      style={C.root}
      onPress={select}
      accessibilityRole="button"
      accessibilityLabel={`Use suggestion: ${label}`}
      accessibilityState={{ selected }}
    >
      <Animated.View
        style={[
          C.surfaceShell,
          {
            backgroundColor: themeColors.background.primarySecondaryBlend(),
            borderRadius: ONBOARDING_TASK_TITLE_SURFACE_RADIUS,
            borderWidth: ONBOARDING_TASK_AGENDA_SURFACE_BORDER_WIDTH,
            overflow: 'hidden',
          },
          animatedBorderStyle,
        ]}
      >
        <View style={C.surfaceInner}>
          <View style={C.topBand}>
            <View style={[C.checkboxColumn, styles.sparklesColumn]} accessibilityElementsHidden>
              <View style={styles.sparklesStack}>
                <Animated.View style={[styles.sparklesLayer, sparklesUnselectedLayerStyle]}>
                  <SparklesIcon size={TASK_AGENDA_ROW_ICON_SIZE} color={sparklesIdle} />
                </Animated.View>
                <Animated.View style={[styles.sparklesLayer, sparklesSelectedLayerStyle]}>
                  <SparklesIcon size={TASK_AGENDA_ROW_ICON_SIZE} color={selectedBrandColor} />
                </Animated.View>
              </View>
            </View>

            <View style={C.titleColumn}>
              <Text
                style={[
                  typography.getTextStyle('heading-4'),
                  styles.titleLabel,
                  {
                    color: titleTextColor,
                    ...(Platform.OS === 'android'
                      ? {
                          includeFontPadding: false,
                          textAlignVertical: 'center',
                        }
                      : {}),
                  },
                ]}
              >
                {label}
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  titleLabel: {
    marginVertical: 0,
    flexShrink: 1,
  },
  sparklesColumn: {
    minHeight: TASK_AGENDA_ROW_ICON_SIZE,
  },
  sparklesStack: {
    width: TASK_AGENDA_ROW_ICON_SIZE,
    height: TASK_AGENDA_ROW_ICON_SIZE,
    position: 'relative',
  },
  sparklesLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
