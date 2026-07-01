/**
 * AI chat container — liquid glass shell with a fixed utility row (attach + send/mic).
 * collapsed: text section height 0 — preview sits inline between attach and send.
 * expanded: multiline text grows above the utility row when there is input and the keyboard is open.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, Platform, Pressable, Text, type LayoutChangeEvent } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import GlassView from 'expo-glass-effect/build/GlassView';
import { CustomTextInput } from '@/components/ui/TextInput';
import { ChatAttachMenu } from './ChatAttachMenu';
import { ChatSendMicButton } from './ChatSendMicButton';
import { useThemeColors, useColorPalette } from '@/hooks/useColorPalette';
import {
  getChatSendButtonColors,
  CHAT_COMPOSER_LAYOUT_TRANSITION_MS,
  CHAT_COMPOSER_LAYOUT_EASING,
  CHAT_COMPOSER_SHELL_BORDER_WIDTH,
  CHAT_COMPOSER_SHELL_RADIUS,
  getChatComposerShellBorderColor,
  CHAT_COMPOSER_COLLAPSED_TEXT_HEIGHT_ESTIMATE,
  CHAT_COMPOSER_EXPANDED_TEXT_HEIGHT_ESTIMATE,
} from './chatComposerUiTokens';
import { getTextStyle } from '@/constants/Typography';
import { Paddings } from '@/constants/Paddings';
import {
  PROGRESS_BOARD_GLASS_TINT_OPACITY,
  PROGRESS_BOARD_GLASS_VEIL_OPACITY,
} from '@/components/features/gamification/browse/progressBoardUiTokens';

const CHAT_INPUT_MIN_VISIBLE_LINES = 3;

export interface ChatContainerProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  isLoading?: boolean;
  /** false when the keyboard hides — collapses the text section even if text remains */
  isKeyboardVisible?: boolean;
}

export function ChatContainer({
  value,
  onChangeText,
  onSend,
  isLoading = false,
  isKeyboardVisible = false,
}: ChatContainerProps) {
  const themeColors = useThemeColors();
  const colors = useColorPalette();
  const trimmed = value.trim();
  const hasText = trimmed.length > 0;

  // text section expands only when typing and the keyboard is open
  const isTextExpanded = value.length > 0 && isKeyboardVisible;

  const [pendingFocus, setPendingFocus] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);

  const expandedTextHeightSv = useSharedValue(CHAT_COMPOSER_EXPANDED_TEXT_HEIGHT_ESTIMATE);
  const expandProgress = useSharedValue(0);

  useEffect(() => {
    expandProgress.value = withTiming(isTextExpanded ? 1 : 0, {
      duration: CHAT_COMPOSER_LAYOUT_TRANSITION_MS,
      easing: CHAT_COMPOSER_LAYOUT_EASING,
    });
  }, [isTextExpanded, expandProgress]);

  const handleComposerFocus = useCallback(() => {
    setIsInputFocused(true);
    setPendingFocus(false);
  }, []);

  const handleComposerBlur = useCallback(() => {
    setIsInputFocused(false);
    setPendingFocus(false);
  }, []);

  const handleExpandedTextLayout = useCallback(
    (event: LayoutChangeEvent) => {
      if (!isTextExpanded) return;
      expandedTextHeightSv.value = event.nativeEvent.layout.height;
    },
    [isTextExpanded, expandedTextHeightSv],
  );

  const handleExpandComposer = () => {
    if (isLoading || isTextExpanded) return;
    setPendingFocus(true);
  };

  const animatedTextSectionStyle = useAnimatedStyle(() => ({
    height: interpolate(
      expandProgress.value,
      [0, 1],
      [CHAT_COMPOSER_COLLAPSED_TEXT_HEIGHT_ESTIMATE, expandedTextHeightSv.value],
    ),
    overflow: 'hidden' as const,
  }));

  const expandedTextLayerStyle = useAnimatedStyle(() => ({
    opacity: expandProgress.value,
  }));

  const inlinePreviewStyle = useAnimatedStyle(() => ({
    opacity: 1 - expandProgress.value,
  }));

  // route touches to the multiline input while the keyboard is opening — before expansion kicks in
  const showMultilineInput = isTextExpanded || pendingFocus || isInputFocused;

  const marpleFill = getChatSendButtonColors(colors).fill;
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

  const inlinePreview = (
    <Pressable
      style={styles.inlinePreviewTap}
      onPress={handleExpandComposer}
      disabled={isLoading || isTextExpanded || isInputFocused}
      accessibilityRole="button"
      accessibilityLabel="AI message"
      accessibilityHint="Tap to type a message for the AI assistant"
    >
      <Text
        numberOfLines={1}
        ellipsizeMode="tail"
        style={[
          styles.inlinePreviewText,
          {
            color: hasText ? themeColors.text.primary() : themeColors.text.tertiary(),
          },
        ]}
      >
        {hasText ? value.replace(/\n/g, ' ') : 'Message…'}
      </Text>
    </Pressable>
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

      {/* grows upward from 0 — multiline input only lives here when expanded */}
      <Animated.View style={animatedTextSectionStyle}>
        <Animated.View
          style={[styles.textLayer, expandedTextLayerStyle]}
          pointerEvents={showMultilineInput ? 'box-none' : 'none'}
        >
          <View style={styles.expandedTextColumn} onLayout={handleExpandedTextLayout}>
            <CustomTextInput
              value={value}
              onChangeText={onChangeText}
              placeholder="Message…"
              editable={!isLoading}
              maxLength={8000}
              multiline
              autoFocus={pendingFocus}
              onFocus={handleComposerFocus}
              onBlur={handleComposerBlur}
              compactInitialHeight
              minimumLineCount={CHAT_INPUT_MIN_VISIBLE_LINES}
              cursorColor={marpleFill}
              containerStyle={styles.textInputContainer}
              inputStyle={styles.chatInputPadding}
            />
          </View>
        </Animated.View>
      </Animated.View>

      {/* fixed row — collapsed preview sits between attach and send */}
      <View style={styles.utilityRow}>
        <ChatAttachMenu disabled={isLoading} />
        <Animated.View
          style={[styles.inlinePreviewSlot, inlinePreviewStyle]}
          pointerEvents={showMultilineInput ? 'none' : 'box-none'}
        >
          {inlinePreview}
        </Animated.View>
        <ChatSendMicButton hasText={hasText} isLoading={isLoading} onSend={onSend} />
      </View>
    </View>
  );

  const shellBody = Platform.OS === 'ios' ? (
    <GlassView
      style={[styles.glassShell, cornerStyle]}
      glassEffectStyle="regular"
      tintColor={glassTint as any}
      isInteractive
    >
      {inner}
    </GlassView>
  ) : (
    <View style={[styles.glassShell, cornerStyle]}>
      {inner}
    </View>
  );

  return (
    <View style={styles.outerMargin}>
      <View style={styles.glassBleedSlot}>{shellBody}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerMargin: {
    overflow: 'visible',
    zIndex: 0,
  },
  // bleed sideways + bottom only — top bleed painted over suggestions above the composer
  glassBleedSlot: {
    marginTop: 0,
    marginBottom: -Paddings.liquidGlassBleed,
    marginHorizontal: -Paddings.liquidGlassBleed,
    paddingTop: 0,
    paddingBottom: Paddings.liquidGlassBleed,
    paddingHorizontal: Paddings.liquidGlassBleed,
    overflow: 'visible',
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
  innerBorderRing: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: CHAT_COMPOSER_SHELL_BORDER_WIDTH,
  },
  textLayer: {
    ...StyleSheet.absoluteFillObject,
    top: 0,
    left: 0,
    right: 0,
  },
  expandedTextColumn: {
    paddingLeft: Paddings.groupedListContentHorizontal,
    paddingTop: Paddings.groupedListChildContentVertical,
    paddingBottom: Paddings.formDataPillHorizontal,
  },
  textInputContainer: {
    alignSelf: 'stretch',
    minWidth: 0,
  },
  chatInputPadding: {
    paddingTop: Paddings.none,
    paddingBottom: Paddings.none,
    paddingLeft: Paddings.none,
    paddingRight: Paddings.groupedListContentHorizontal,
  },
  utilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Paddings.formDataPillHorizontal,
    paddingLeft: Paddings.formDataPillHorizontal,
    paddingRight: Paddings.formDataPillHorizontal,
    gap: Paddings.formDataPillHorizontal,
    overflow: 'visible',
  },
  inlinePreviewSlot: {
    flex: 1,
    minWidth: 0,
  },
  inlinePreviewTap: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    minHeight: 20,
  },
  inlinePreviewText: {
    ...getTextStyle('body-large'),
    lineHeight: 20,
  },
});
