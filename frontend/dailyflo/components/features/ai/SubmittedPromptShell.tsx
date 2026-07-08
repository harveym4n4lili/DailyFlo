/**
 * read-only submitted user prompt — lives in the session ScrollView under the header.
 * brand border + glow; no input row. parent handles fade-in.
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, Platform, Text, ScrollView } from 'react-native';
import GlassView from 'expo-glass-effect/build/GlassView';
import { useThemeColors, useBrandColors } from '@/hooks/useColorPalette';
import {
  CHAT_COMPOSER_SHELL_RADIUS,
  CHAT_COMPOSER_MIN_TEXT_CONTENT_HEIGHT,
  CHAT_COMPOSER_TEXT_LINE_HEIGHT,
  CHAT_SUBMITTED_SHELL_BORDER_WIDTH,
  CHAT_SUBMITTED_SHELL_GLOW_SHADOW_RADIUS,
  CHAT_SUBMITTED_SHELL_GLOW_SHADOW_OPACITY,
  CHAT_SUBMITTED_SHELL_GLOW_ELEVATION,
} from './chatComposerUiTokens';
import { getTextStyle } from '@/constants/Typography';
import { Paddings } from '@/constants/Paddings';
import {
  PROGRESS_BOARD_GLASS_TINT_OPACITY,
  PROGRESS_BOARD_GLASS_VEIL_OPACITY,
} from '@/components/features/gamification/browse/progressBoardUiTokens';

export type SubmittedPromptShellProps = {
  prompt: string;
};

export function SubmittedPromptShell({ prompt }: SubmittedPromptShellProps) {
  const themeColors = useThemeColors();
  const { getMarpleBrandColor } = useBrandColors();
  const brandBorderColor = useMemo(() => getMarpleBrandColor(500), [getMarpleBrandColor]);

  const shellRadius = CHAT_COMPOSER_SHELL_RADIUS;
  const cornerStyle = {
    borderRadius: shellRadius,
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
    <View style={[styles.innerClip, cornerStyle]}>
      <View style={[styles.glassVeil, { backgroundColor: glassVeil }]} pointerEvents="none" />
      <View style={styles.promptContent}>
        <Text style={[styles.promptLabel, { color: themeColors.text.secondary() }]}>
          Your prompt:
        </Text>
        <ScrollView
          style={{ minHeight: CHAT_COMPOSER_MIN_TEXT_CONTENT_HEIGHT }}
          contentContainerStyle={styles.submittedScrollContent}
          showsVerticalScrollIndicator
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
        >
          <Text style={[styles.promptText, { color: themeColors.text.secondary() }]}>
            {prompt}
          </Text>
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
      <View style={[styles.glassShell, cornerStyle]}>{inner}</View>
    );

  return (
    <View style={styles.outerMargin}>
      <View
        style={[
          styles.brandGlowHost,
          cornerStyle,
          {
            shadowColor: brandBorderColor,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: CHAT_SUBMITTED_SHELL_GLOW_SHADOW_OPACITY,
            shadowRadius: CHAT_SUBMITTED_SHELL_GLOW_SHADOW_RADIUS,
            ...(Platform.OS === 'android'
              ? { elevation: CHAT_SUBMITTED_SHELL_GLOW_ELEVATION }
              : null),
          },
        ]}
      >
        <View
          style={[
            styles.brandBorderShell,
            cornerStyle,
            {
              borderColor: brandBorderColor,
              borderWidth: CHAT_SUBMITTED_SHELL_BORDER_WIDTH,
            },
          ]}
        >
          {shellBody}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerMargin: {
    overflow: 'visible',
  },
  brandGlowHost: {
    overflow: 'visible',
    backgroundColor: 'transparent',
  },
  brandBorderShell: {
    overflow: 'hidden',
  },
  glassShell: {
    overflow: 'visible',
  },
  innerClip: {
    position: 'relative',
    overflow: 'visible',
  },
  glassVeil: {
    ...StyleSheet.absoluteFillObject,
  },
  promptContent: {
    paddingLeft: Paddings.groupedListContentHorizontal,
    paddingTop: Paddings.groupedListChildContentVertical,
    paddingBottom: Paddings.formDataPillHorizontal,
    paddingRight: Paddings.groupedListContentHorizontal,
  },
  promptLabel: {
    ...getTextStyle('heading-4'),
    marginBottom: Paddings.formDataPillHorizontal,
  },
  submittedScrollContent: {
    flexGrow: 1,
  },
  promptText: {
    ...getTextStyle('body-large'),
    lineHeight: CHAT_COMPOSER_TEXT_LINE_HEIGHT,
  },
});
