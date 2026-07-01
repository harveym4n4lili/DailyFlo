/**
 * ai chat suggestion pill — title + one-line description (description becomes the prompt on tap).
 * veil fill matches ChatContainer; dashed ring is the only visible outline (no GlassView / solid ring).
 */

import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SparklesIcon } from '@/components/ui/Icon';
import { DashedRoundedBorder } from '@/components/ui/borders';
import { useThemeColors } from '@/hooks/useColorPalette';
import { getTextStyle } from '@/constants/Typography';
import {
  ONBOARDING_TASK_AGENDA_SUGGESTION_SELECT_ANIM_MS,
  ONBOARDING_TASK_TITLE_SURFACE_RADIUS,
} from '@/components/features/onboarding/onboarding/constants/pagerLayout';
import {
  taskAgendaSuggestionChipLayoutStyles as C,
  TASK_AGENDA_SUGGESTION_SPARKLES_SIZE,
} from '@/components/features/onboarding/onboarding/ui/taskAgendaTitleRowLayout';
import {
  CHAT_COMPOSER_SHELL_DASHED_STROKE_WIDTH,
  getChatComposerShellBorderColor,
} from './chatComposerUiTokens';
import { PROGRESS_BOARD_GLASS_VEIL_OPACITY } from '@/components/features/gamification/browse/progressBoardUiTokens';
import { CHAT_SUGGESTION_CHIP_MAX_WIDTH } from './aiChatSuggestionTokens';

export interface ChatSuggestionChipProps {
  title: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
  titleTextColor: string;
  /** one step down from title on the text ramp — subtitles / helper copy */
  descriptionTextColor: string;
  selectedBrandColor: string;
  sparklesIdleColor: string;
  sparklesSelectedColor: string;
}

export function ChatSuggestionChip({
  title,
  description,
  selected,
  onSelect,
  titleTextColor,
  descriptionTextColor,
  selectedBrandColor,
  sparklesIdleColor,
  sparklesSelectedColor,
}: ChatSuggestionChipProps) {
  const themeColors = useThemeColors();
  const shellBorderColor = getChatComposerShellBorderColor(themeColors);

  const shellRadius = ONBOARDING_TASK_TITLE_SURFACE_RADIUS;
  const cornerStyle = {
    borderRadius: shellRadius,
    ...(Platform.OS === 'ios' ? { borderCurve: 'continuous' as const } : null),
  };

  // same veil/tint layering as ChatContainer liquid glass shell
  const glassVeil = themeColors.withOpacity(
    themeColors.background.primary(),
    PROGRESS_BOARD_GLASS_VEIL_OPACITY,
  );

  const [shellSize, setShellSize] = useState({ width: 0, height: 0 });

  const progress = useSharedValue(selected ? 1 : 0);
  useEffect(() => {
    progress.value = withTiming(selected ? 1 : 0, {
      duration: ONBOARDING_TASK_AGENDA_SUGGESTION_SELECT_ANIM_MS,
      easing: Easing.out(Easing.cubic),
    });
  }, [selected, progress]);

  const sparklesUnselectedLayerStyle = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
  }));
  const sparklesSelectedLayerStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  const handleShellLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setShellSize((prev) =>
      prev.width === width && prev.height === height ? prev : { width, height },
    );
  };

  const select = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect();
  };

  return (
    <Pressable
      style={[C.root, styles.chipRoot]}
      onPress={select}
      accessibilityRole="button"
      accessibilityLabel={`Use suggestion: ${title}`}
      accessibilityHint={description}
      accessibilityState={{ selected }}
    >
      {/* plain view + veil only — GlassView and surfaceShell overflow:hidden both draw a solid rim behind the dashed SVG */}
      <View
        style={[styles.chipShell, cornerStyle]}
        onLayout={handleShellLayout}
      >
        <View style={[styles.innerClip, cornerStyle]}>
          <View style={[styles.glassVeil, { backgroundColor: glassVeil }]} pointerEvents="none" />
          <View style={C.surfaceInner}>
            <View style={[C.topBand, styles.topBand]}>
              <View style={[C.checkboxColumn, styles.sparklesColumn]} accessibilityElementsHidden>
                <View style={styles.sparklesStack}>
                  <Animated.View style={[styles.sparklesLayer, sparklesUnselectedLayerStyle]}>
                    <SparklesIcon size={TASK_AGENDA_SUGGESTION_SPARKLES_SIZE} color={sparklesIdleColor} />
                  </Animated.View>
                  <Animated.View style={[styles.sparklesLayer, sparklesSelectedLayerStyle]}>
                    <SparklesIcon size={TASK_AGENDA_SUGGESTION_SPARKLES_SIZE} color={sparklesSelectedColor} />
                  </Animated.View>
                </View>
              </View>

              <View style={[C.titleColumn, styles.textColumn]}>
                <Text
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={[styles.titleLabel, { color: titleTextColor }]}
                >
                  {title}
                </Text>
                <Text
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={[styles.descriptionLabel, { color: descriptionTextColor }]}
                >
                  {description}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.dashedRingLayer} pointerEvents="none">
          <DashedRoundedBorder
            width={shellSize.width}
            height={shellSize.height}
            radius={shellRadius}
            color={shellBorderColor}
            strokeWidth={CHAT_COMPOSER_SHELL_DASHED_STROKE_WIDTH}
          />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chipRoot: {
    maxWidth: CHAT_SUGGESTION_CHIP_MAX_WIDTH,
  },
  chipShell: {
    alignSelf: 'flex-start',
    maxWidth: CHAT_SUGGESTION_CHIP_MAX_WIDTH,
    position: 'relative',
    overflow: 'visible',
  },
  innerClip: {
    overflow: 'hidden',
  },
  glassVeil: {
    ...StyleSheet.absoluteFillObject,
  },
  dashedRingLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  topBand: {
    alignItems: 'center',
  },
  titleLabel: {
    ...getTextStyle('body-medium'),
    marginVertical: 0,
    flexShrink: 1,
    ...(Platform.OS === 'android'
      ? {
          includeFontPadding: false,
          textAlignVertical: 'center',
        }
      : {}),
  },
  descriptionLabel: {
    ...getTextStyle('body-small'),
    fontSize: 11,
    lineHeight: 13,
    marginTop: 2,
    flexShrink: 1,
    ...(Platform.OS === 'android'
      ? {
          includeFontPadding: false,
          textAlignVertical: 'center',
        }
      : {}),
  },
  textColumn: {
    flexShrink: 1,
    minWidth: 0,
  },
  sparklesColumn: {
    minHeight: TASK_AGENDA_SUGGESTION_SPARKLES_SIZE,
  },
  sparklesStack: {
    width: TASK_AGENDA_SUGGESTION_SPARKLES_SIZE,
    height: TASK_AGENDA_SUGGESTION_SPARKLES_SIZE,
    position: 'relative',
  },
  sparklesLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
