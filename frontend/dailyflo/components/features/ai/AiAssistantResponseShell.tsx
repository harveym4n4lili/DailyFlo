/**
 * Assistant reply in session view — flat lighter-primary panel (no liquid glass).
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
import { useThemeColors } from '@/hooks/useColorPalette';
import { getTextStyle } from '@/constants/Typography';
import { AI_EMPTY_STATE_GREETING_FADE_MS } from './aiEmptyStateIntroTokens';
import {
  CHAT_COMPOSER_SHELL_RADIUS,
  CHAT_ASSISTANT_RESPONSE_SHELL_BOTTOM_LEFT_RADIUS,
  CHAT_COMPOSER_TEXT_BLOCK_PADDING,
  CHAT_COMPOSER_MIN_TEXT_CONTENT_HEIGHT,
  CHAT_COMPOSER_TEXT_LINE_HEIGHT,
  CHAT_COMPOSER_LAYOUT_EASING,
} from './chatComposerUiTokens';

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
  // lighter step of the primary ramp — not glass, not the main screen fill
  const shellBackground = themeColors.background.primarySecondaryBlend();
  const textOpacity = useSharedValue(0);

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
        shell: {
          borderTopLeftRadius: CHAT_COMPOSER_SHELL_RADIUS,
          borderTopRightRadius: CHAT_COMPOSER_SHELL_RADIUS,
          borderBottomRightRadius: CHAT_COMPOSER_SHELL_RADIUS,
          borderBottomLeftRadius: CHAT_ASSISTANT_RESPONSE_SHELL_BOTTOM_LEFT_RADIUS,
          backgroundColor: shellBackground,
          overflow: 'hidden',
          ...(Platform.OS === 'ios' ? { borderCurve: 'continuous' as const } : null),
        },
        scroll: {
          minHeight: CHAT_COMPOSER_MIN_TEXT_CONTENT_HEIGHT,
          backgroundColor: shellBackground,
        },
        scrollContent: {
          paddingLeft: CHAT_COMPOSER_TEXT_BLOCK_PADDING.horizontal,
          paddingTop: CHAT_COMPOSER_TEXT_BLOCK_PADDING.top,
          paddingBottom: CHAT_COMPOSER_TEXT_BLOCK_PADDING.bottom,
          paddingRight: CHAT_COMPOSER_TEXT_BLOCK_PADDING.horizontal,
          backgroundColor: shellBackground,
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
          backgroundColor: shellBackground,
        },
        loadingLabel: {
          ...getTextStyle('body-medium'),
          color: themeColors.text.tertiary(),
        },
      }),
    [shellBackground, themeColors],
  );

  if (!isLoading && !content.trim()) {
    return null;
  }

  return (
    <View style={styles.shell}>
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
}
