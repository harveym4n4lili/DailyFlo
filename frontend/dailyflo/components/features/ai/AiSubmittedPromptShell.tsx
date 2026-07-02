/**
 * read-only submitted prompt — matches the chat composer text section styling
 * with a marple brand 500 border. shown at the top of the ai session view.
 */

import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform } from 'react-native';
import GlassView from 'expo-glass-effect/build/GlassView';
import { useThemeColors, useBrandColors } from '@/hooks/useColorPalette';
import { getTextStyle } from '@/constants/Typography';
import { Paddings } from '@/constants/Paddings';
import {
  CHAT_COMPOSER_SHELL_BORDER_WIDTH,
  CHAT_COMPOSER_SHELL_RADIUS,
  CHAT_COMPOSER_MIN_TEXT_CONTENT_HEIGHT,
  CHAT_COMPOSER_TEXT_LINE_HEIGHT,
  getChatComposerShellBorderColor,
} from './chatComposerUiTokens';
import {
  PROGRESS_BOARD_GLASS_TINT_OPACITY,
  PROGRESS_BOARD_GLASS_VEIL_OPACITY,
} from '@/components/features/gamification/browse/progressBoardUiTokens';

type AiSubmittedPromptShellProps = {
  text: string;
  /** caps height before the text area scrolls internally */
  maxTextHeight?: number;
};

export function AiSubmittedPromptShell({ text, maxTextHeight = 220 }: AiSubmittedPromptShellProps) {
  const themeColors = useThemeColors();
  const { getMarpleBrandColor } = useBrandColors();
  // marple brand 500 — solid accent ring on the submitted prompt shell
  const brandBorderColor = useMemo(() => getMarpleBrandColor(500), [getMarpleBrandColor]);

  const shellRadius = CHAT_COMPOSER_SHELL_RADIUS;
  const innerRadius = Math.max(shellRadius - CHAT_COMPOSER_SHELL_BORDER_WIDTH, 0);
  const cornerStyle = {
    borderRadius: shellRadius,
    ...(Platform.OS === 'ios' ? { borderCurve: 'continuous' as const } : null),
  };
  const innerCornerStyle = {
    borderRadius: innerRadius,
    ...(Platform.OS === 'ios' ? { borderCurve: 'continuous' as const } : null),
  };

  const glassVeil = themeColors.withOpacity(
    themeColors.background.primary(),
    PROGRESS_BOARD_GLASS_VEIL_OPACITY,
  );
  const glassTint = themeColors.withOpacity(
    themeColors.background.primary(),
    PROGRESS_BOARD_GLASS_TINT_OPACITY,
  );

  const inner = (
    <View style={[styles.innerClip, innerCornerStyle]}>
      <View style={[styles.glassVeil, { backgroundColor: glassVeil }]} pointerEvents="none" />
      <View
        style={[
          styles.innerBorderRing,
          innerCornerStyle,
          { borderColor: getChatComposerShellBorderColor(themeColors) },
        ]}
        pointerEvents="none"
      />
      <View style={styles.textColumn}>
        <Text style={[styles.promptLabel, { color: themeColors.text.secondary() }]}>
          Your prompt:
        </Text>
        <ScrollView
          style={{
            minHeight: CHAT_COMPOSER_MIN_TEXT_CONTENT_HEIGHT,
            maxHeight: maxTextHeight,
          }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.promptText, { color: themeColors.text.secondary() }]}>{text}</Text>
        </ScrollView>
      </View>
    </View>
  );

  const shellBody =
    Platform.OS === 'ios' ? (
      <GlassView
        style={[styles.glassShell, cornerStyle]}
        glassEffectStyle="regular"
        tintColor={glassTint as any}
        isInteractive={false}
      >
        {inner}
      </GlassView>
    ) : (
      <View style={[styles.glassShell, cornerStyle, { backgroundColor: glassTint }]}>
        {inner}
      </View>
    );

  return (
    <View
      style={[
        styles.brandBorderShell,
        { borderColor: brandBorderColor },
      ]}
    >
      {shellBody}
    </View>
  );
}

const styles = StyleSheet.create({
  brandBorderShell: {
    borderWidth: CHAT_COMPOSER_SHELL_BORDER_WIDTH,
    borderRadius: CHAT_COMPOSER_SHELL_RADIUS,
    overflow: 'hidden',
  },
  glassShell: {
    overflow: 'hidden',
  },
  innerClip: {
    position: 'relative',
    overflow: 'hidden',
  },
  glassVeil: {
    ...StyleSheet.absoluteFillObject,
  },
  innerBorderRing: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: CHAT_COMPOSER_SHELL_BORDER_WIDTH,
  },
  textColumn: {
    paddingLeft: Paddings.groupedListContentHorizontal,
    paddingTop: Paddings.groupedListChildContentVertical,
    paddingBottom: Paddings.formDataPillHorizontal,
    paddingRight: Paddings.groupedListContentHorizontal,
  },
  scrollContent: {
    flexGrow: 1,
  },
  promptLabel: {
    ...getTextStyle('heading-4'),
    marginBottom: Paddings.formDataPillHorizontal,
  },
  promptText: {
    ...getTextStyle('body-large'),
    lineHeight: CHAT_COMPOSER_TEXT_LINE_HEIGHT,
  },
});
