/**
 * Assistant reply in session view — same liquid glass shell + grey hairline ring as ChatContainer.
 * Text fades in when the api response arrives.
 */

import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import GlassView from 'expo-glass-effect/build/GlassView';
import { useThemeColors } from '@/hooks/useColorPalette';
import { getTextStyle } from '@/constants/Typography';
import { AI_EMPTY_STATE_GREETING_FADE_MS } from './aiEmptyStateIntroTokens';
import {
  CHAT_COMPOSER_SHELL_BORDER_WIDTH,
  CHAT_COMPOSER_SHELL_RADIUS,
  CHAT_COMPOSER_TEXT_BLOCK_PADDING,
  CHAT_COMPOSER_MIN_TEXT_CONTENT_HEIGHT,
  CHAT_COMPOSER_TEXT_LINE_HEIGHT,
  CHAT_COMPOSER_LAYOUT_EASING,
  getChatComposerShellBorderColor,
  CHAT_ASSISTANT_RESPONSE_SHELL_BOTTOM_LEFT_RADIUS,
} from './chatComposerUiTokens';
import {
  PROGRESS_BOARD_GLASS_TINT_OPACITY,
  PROGRESS_BOARD_GLASS_VEIL_OPACITY,
} from '@/components/features/gamification/browse/progressBoardUiTokens';

export interface AiAssistantResponseShellProps {
  /** latest assistant reply — proposals are not shown in this pass */
  content?: string;
  /** true while waiting for the llm api */
  isLoading?: boolean;
}

export function AiAssistantResponseShell({
  content = '',
  isLoading = false,
}: AiAssistantResponseShellProps) {
  const themeColors = useThemeColors();
  const shellBorderColor = getChatComposerShellBorderColor(themeColors);
  const textOpacity = useSharedValue(0);

  const shellRadius = CHAT_COMPOSER_SHELL_RADIUS;
  const borderInset = CHAT_COMPOSER_SHELL_BORDER_WIDTH;
  const shellCurve = Platform.OS === 'ios' ? { borderCurve: 'continuous' as const } : null;
  // tighter bottom-left — chat-bubble tail feel; other corners match ChatContainer
  const cornerStyle = {
    borderTopLeftRadius: shellRadius,
    borderTopRightRadius: shellRadius,
    borderBottomRightRadius: shellRadius,
    borderBottomLeftRadius: CHAT_ASSISTANT_RESPONSE_SHELL_BOTTOM_LEFT_RADIUS,
    ...shellCurve,
  };
  const innerCornerStyle = {
    borderTopLeftRadius: Math.max(shellRadius - borderInset, 0),
    borderTopRightRadius: Math.max(shellRadius - borderInset, 0),
    borderBottomRightRadius: Math.max(shellRadius - borderInset, 0),
    borderBottomLeftRadius: Math.max(
      CHAT_ASSISTANT_RESPONSE_SHELL_BOTTOM_LEFT_RADIUS - borderInset,
      0,
    ),
    ...shellCurve,
  };

  // same veil/tint layering as ChatContainer — frosted primary wash + native glass on ios
  const glassVeil = themeColors.withOpacity(
    themeColors.background.primary(),
    PROGRESS_BOARD_GLASS_VEIL_OPACITY,
  );
  const glassTint = themeColors.withOpacity(
    themeColors.background.primary(),
    PROGRESS_BOARD_GLASS_TINT_OPACITY,
  );

  useEffect(() => {
    if (!content.trim() || isLoading) {
      textOpacity.value = 0;
      return;
    }
    textOpacity.value = withTiming(1, {
      duration: AI_EMPTY_STATE_GREETING_FADE_MS,
      easing: CHAT_COMPOSER_LAYOUT_EASING,
    });
  }, [content, isLoading, textOpacity]);

  const animatedTextStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  const styles = useMemo(
    () =>
      StyleSheet.create({
        outer: {
          overflow: 'visible',
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
        scroll: {
          minHeight: CHAT_COMPOSER_MIN_TEXT_CONTENT_HEIGHT,
        },
        scrollContent: {
          paddingLeft: CHAT_COMPOSER_TEXT_BLOCK_PADDING.horizontal,
          paddingTop: CHAT_COMPOSER_TEXT_BLOCK_PADDING.top,
          paddingBottom: CHAT_COMPOSER_TEXT_BLOCK_PADDING.bottom,
          paddingRight: CHAT_COMPOSER_TEXT_BLOCK_PADDING.horizontal,
        },
        responseText: {
          ...getTextStyle('body-large'),
          lineHeight: CHAT_COMPOSER_TEXT_LINE_HEIGHT,
          color: themeColors.text.primary(),
        },
        loadingRow: {
          minHeight: CHAT_COMPOSER_MIN_TEXT_CONTENT_HEIGHT,
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: CHAT_COMPOSER_TEXT_BLOCK_PADDING.top,
          gap: 8,
        },
        loadingLabel: {
          ...getTextStyle('body-medium'),
          color: themeColors.text.tertiary(),
        },
      }),
    [themeColors],
  );

  if (!isLoading && !content.trim()) {
    return null;
  }

  const inner = (
    <View style={[styles.innerClip, innerCornerStyle]}>
      <View style={[styles.glassVeil, { backgroundColor: glassVeil }]} pointerEvents="none" />
      <View
        style={[styles.innerBorderRing, innerCornerStyle, { borderColor: shellBorderColor }]}
        pointerEvents="none"
      />

      {isLoading && !content.trim() ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={themeColors.text.secondary()} />
          <Text style={styles.loadingLabel}>Thinking…</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator
          keyboardShouldPersistTaps="handled"
        >
          <Animated.Text style={[styles.responseText, animatedTextStyle]}>{content}</Animated.Text>
        </ScrollView>
      )}
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

  return <View style={styles.outer}>{shellBody}</View>;
}
