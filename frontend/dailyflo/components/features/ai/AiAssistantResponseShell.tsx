/**
 * Assistant reply in session view — same liquid glass shell + grey hairline ring as ChatContainer.
 * Reply words fade in one-by-one; parent is notified when the last word finishes.
 */

import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  ScrollView,
  ActivityIndicator,
  type TextStyle,
} from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import GlassView from 'expo-glass-effect/build/GlassView';
import { useThemeColors } from '@/hooks/useColorPalette';
import { getTextStyle } from '@/constants/Typography';
import {
  CHAT_COMPOSER_SHELL_BORDER_WIDTH,
  CHAT_COMPOSER_SHELL_RADIUS,
  CHAT_COMPOSER_TEXT_BLOCK_PADDING,
  CHAT_COMPOSER_MIN_TEXT_CONTENT_HEIGHT,
  CHAT_COMPOSER_TEXT_LINE_HEIGHT,
  CHAT_COMPOSER_LAYOUT_EASING,
  CHAT_ASSISTANT_REPLY_WORD_FADE_MS,
  CHAT_ASSISTANT_REPLY_WORD_STAGGER_MS,
  CHAT_ASSISTANT_RESPONSE_SHELL_BOTTOM_LEFT_RADIUS,
  CHAT_SESSION_PROPOSAL_BADGE_HALF_HEIGHT_ESTIMATE,
  getChatComposerShellBorderColor,
  splitAssistantReplyWords,
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
  /** fires once every word has finished fading in — used to stagger proposal reveals */
  onWordsRevealComplete?: () => void;
}

type AnimatedReplyWordProps = {
  word: string;
  wordIndex: number;
  canReveal: boolean;
  isLastWord: boolean;
  onLastWordRevealComplete?: () => void;
  style: TextStyle;
};

/** one word in the reply — waits its turn, then fades in */
function AnimatedReplyWord({
  word,
  wordIndex,
  canReveal,
  isLastWord,
  onLastWordRevealComplete,
  style,
}: AnimatedReplyWordProps) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!canReveal) {
      opacity.value = 0;
      return;
    }

    opacity.value = withDelay(
      wordIndex * CHAT_ASSISTANT_REPLY_WORD_STAGGER_MS,
      withTiming(
        1,
        {
          duration: CHAT_ASSISTANT_REPLY_WORD_FADE_MS,
          easing: CHAT_COMPOSER_LAYOUT_EASING,
        },
        (finished) => {
          if (finished && isLastWord && onLastWordRevealComplete) {
            runOnJS(onLastWordRevealComplete)();
          }
        },
      ),
    );
  }, [canReveal, wordIndex, isLastWord, opacity, onLastWordRevealComplete]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return <Animated.Text style={[style, animatedStyle]}>{word}</Animated.Text>;
}

export function AiAssistantResponseShell({
  content = '',
  isLoading = false,
  onWordsRevealComplete,
}: AiAssistantResponseShellProps) {
  const themeColors = useThemeColors();
  const shellBorderColor = getChatComposerShellBorderColor(themeColors);

  const replyWords = useMemo(() => splitAssistantReplyWords(content), [content]);
  const canRevealWords = !isLoading && content.trim().length > 0;

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

  const styles = useMemo(
    () =>
      StyleSheet.create({
        outer: {
          overflow: 'visible',
          // badge headroom matches proposal cards so composer → reply spacing aligns with reply → proposals
          marginTop: CHAT_SESSION_PROPOSAL_BADGE_HALF_HEIGHT_ESTIMATE,
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
          <Text style={styles.responseText}>
            {replyWords.map((word, index) => (
              <AnimatedReplyWord
                key={`${index}-${word}`}
                word={word}
                wordIndex={index}
                canReveal={canRevealWords}
                isLastWord={index === replyWords.length - 1}
                onLastWordRevealComplete={onWordsRevealComplete}
                style={styles.responseText}
              />
            ))}
          </Text>
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
