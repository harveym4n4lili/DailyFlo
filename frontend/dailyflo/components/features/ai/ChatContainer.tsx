/**
 * AI chat container — liquid glass shell with a fixed utility row (attach + send/mic).
 * collapsed: text section height 0 — preview sits inline between attach and send.
 * expanded: multiline text grows above the utility row when there is input and the keyboard is open.
 * session morph: slides to header slot — utility row shrinks, border turns brand, read-only submitted text.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  Pressable,
  Text,
  ScrollView,
  type LayoutChangeEvent,
} from 'react-native';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import GlassView from 'expo-glass-effect/build/GlassView';
import { CustomTextInput } from '@/components/ui/TextInput';
import { ChatAttachMenu } from './ChatAttachMenu';
import { ChatSendMicButton } from './ChatSendMicButton';
import { useThemeColors, useColorPalette, useBrandColors } from '@/hooks/useColorPalette';
import {
  getChatSendButtonColors,
  CHAT_COMPOSER_LAYOUT_TRANSITION_MS,
  CHAT_COMPOSER_LAYOUT_EASING,
  CHAT_COMPOSER_SHELL_BORDER_WIDTH,
  CHAT_COMPOSER_SHELL_RADIUS,
  getChatComposerShellBorderColor,
  CHAT_COMPOSER_COLLAPSED_TEXT_HEIGHT_ESTIMATE,
  CHAT_COMPOSER_EXPANDED_TEXT_HEIGHT_ESTIMATE,
  CHAT_INPUT_MIN_VISIBLE_LINES,
  CHAT_COMPOSER_MIN_TEXT_CONTENT_HEIGHT,
  CHAT_COMPOSER_TEXT_LINE_HEIGHT,
  CHAT_COMPOSER_UTILITY_ROW_HEIGHT_ESTIMATE,
  CHAT_SUBMITTED_SHELL_CONTENT_HEIGHT,
  getChatComposerExpandedTextInputMaxHeight,
} from './chatComposerUiTokens';
import { getTextStyle } from '@/constants/Typography';
import { Paddings } from '@/constants/Paddings';
import {
  PROGRESS_BOARD_GLASS_TINT_OPACITY,
  PROGRESS_BOARD_GLASS_VEIL_OPACITY,
} from '@/components/features/gamification/browse/progressBoardUiTokens';

export interface ChatContainerProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  isLoading?: boolean;
  /** false when the keyboard hides — collapses the text section even if text remains */
  isKeyboardVisible?: boolean;
  /** true while greeting ↔ session slide morph is running — keeps expand height locked on send */
  isSessionTransitioning?: boolean;
  /** true while sliding back to greeting — collapses to minimized composer during the slide */
  isSessionReturningToGreeting?: boolean;
  /** max height for the expanding text section — derived from screen layout on the ai tab */
  maxExpandedTextSectionHeight?: number;
  /** 0 = bottom composer, 1 = submitted shell at header — drives morph + slide on the ai tab */
  sessionProgress?: SharedValue<number>;
  /** read-only prompt shown during session morph */
  submittedText?: string;
  /** locks editing when session animation completes */
  isSessionMode?: boolean;
}

export function ChatContainer({
  value,
  onChangeText,
  onSend,
  isLoading = false,
  isKeyboardVisible = false,
  isSessionTransitioning = false,
  isSessionReturningToGreeting = false,
  maxExpandedTextSectionHeight,
  sessionProgress,
  submittedText = '',
  isSessionMode = false,
}: ChatContainerProps) {
  const themeColors = useThemeColors();
  const colors = useColorPalette();
  const { getMarpleBrandColor } = useBrandColors();
  const trimmed = value.trim();
  const hasText = trimmed.length > 0;

  // text section expands when typing + keyboard open — not during session slide morph
  const isTextExpanded =
    value.length > 0 && isKeyboardVisible && !isSessionMode && !isSessionTransitioning;

  const [pendingFocus, setPendingFocus] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);

  const expandedTextHeightSv = useSharedValue(CHAT_COMPOSER_EXPANDED_TEXT_HEIGHT_ESTIMATE);
  const expandProgress = useSharedValue(0);
  const fallbackSessionProgress = useSharedValue(0);
  const activeSessionProgress = sessionProgress ?? fallbackSessionProgress;

  const shellBorderColor = getChatComposerShellBorderColor(themeColors);
  const brandBorderColor = useMemo(() => getMarpleBrandColor(500), [getMarpleBrandColor]);

  useEffect(() => {
    // back slide — shrink to minimized composer in sync with sessionProgress returning to 0
    if (isSessionReturningToGreeting) {
      expandProgress.value = withTiming(0, {
        duration: CHAT_COMPOSER_LAYOUT_TRANSITION_MS,
        easing: CHAT_COMPOSER_LAYOUT_EASING,
      });
      return;
    }
    // send slide — keep expanded height locked while morphing into the submitted shell
    if (isSessionMode || isSessionTransitioning) return;
    expandProgress.value = withTiming(isTextExpanded ? 1 : 0, {
      duration: CHAT_COMPOSER_LAYOUT_TRANSITION_MS,
      easing: CHAT_COMPOSER_LAYOUT_EASING,
    });
  }, [
    isTextExpanded,
    isSessionMode,
    isSessionTransitioning,
    isSessionReturningToGreeting,
    expandProgress,
  ]);

  // keyboard / rotation can shrink the allowed text section — clamp animated height
  useEffect(() => {
    if (!isTextExpanded || maxExpandedTextSectionHeight == null) return;
    if (expandedTextHeightSv.value > maxExpandedTextSectionHeight) {
      expandedTextHeightSv.value = maxExpandedTextSectionHeight;
    }
  }, [isTextExpanded, maxExpandedTextSectionHeight, expandedTextHeightSv]);

  const handleComposerFocus = useCallback(() => {
    setIsInputFocused(true);
    setPendingFocus(false);
  }, []);

  const handleComposerBlur = useCallback(() => {
    setIsInputFocused(false);
    setPendingFocus(false);
  }, []);

  const handleExpandComposer = () => {
    if (
      isLoading ||
      isTextExpanded ||
      isSessionMode ||
      (isSessionTransitioning && !isSessionReturningToGreeting)
    ) {
      return;
    }
    setPendingFocus(true);
  };

  const handleExpandedTextLayout = useCallback(
    (event: LayoutChangeEvent) => {
      if (!isTextExpanded) return;
      const naturalHeight = event.nativeEvent.layout.height;
      const cappedHeight =
        maxExpandedTextSectionHeight != null
          ? Math.min(naturalHeight, maxExpandedTextSectionHeight)
          : naturalHeight;
      expandedTextHeightSv.value = cappedHeight;
    },
    [isTextExpanded, expandedTextHeightSv, maxExpandedTextSectionHeight],
  );

  const expandedTextInputMaxHeight =
    maxExpandedTextSectionHeight != null
      ? getChatComposerExpandedTextInputMaxHeight(maxExpandedTextSectionHeight)
      : undefined;

  const animatedTextSectionStyle = useAnimatedStyle(() => {
    const session = activeSessionProgress.value;
    const composerTextHeight = interpolate(
      expandProgress.value,
      [0, 1],
      [CHAT_COMPOSER_COLLAPSED_TEXT_HEIGHT_ESTIMATE, expandedTextHeightSv.value],
    );

    if (session > 0) {
      return {
        height: interpolate(
          session,
          [0, 1],
          [composerTextHeight, CHAT_SUBMITTED_SHELL_CONTENT_HEIGHT],
        ),
        overflow: 'hidden' as const,
      };
    }

    return {
      height: composerTextHeight,
      overflow: 'hidden' as const,
    };
  });

  const expandedTextLayerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(activeSessionProgress.value, [0, 0.35], [expandProgress.value, 0]),
  }));

  const submittedTextLayerStyle = useAnimatedStyle(() => ({
    opacity: activeSessionProgress.value,
  }));

  const inlinePreviewStyle = useAnimatedStyle(() => ({
    opacity: (1 - expandProgress.value) * (1 - activeSessionProgress.value),
  }));

  const animatedUtilityRowStyle = useAnimatedStyle(() => ({
    height: interpolate(
      activeSessionProgress.value,
      [0, 1],
      [CHAT_COMPOSER_UTILITY_ROW_HEIGHT_ESTIMATE, 0],
    ),
    opacity: interpolate(activeSessionProgress.value, [0, 0.6], [1, 0]),
    overflow: 'hidden' as const,
  }));

  const brandBorderShellStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      activeSessionProgress.value,
      [0, 1],
      ['transparent', brandBorderColor],
    ),
    borderWidth: interpolate(
      activeSessionProgress.value,
      [0, 1],
      [0, CHAT_COMPOSER_SHELL_BORDER_WIDTH],
    ),
  }));

  // route touches to the multiline input while the keyboard is opening — before expansion kicks in
  const showMultilineInput =
    !isSessionMode &&
    !isSessionReturningToGreeting &&
    !isSessionTransitioning &&
    (isTextExpanded || pendingFocus || isInputFocused);

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
      disabled={
        isLoading ||
        isTextExpanded ||
        isInputFocused ||
        isSessionMode ||
        (isSessionTransitioning && !isSessionReturningToGreeting)
      }
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
          { borderColor: shellBorderColor },
        ]}
        pointerEvents="none"
      />

      {/* grows upward from 0 — multiline input only lives here when expanded */}
      <Animated.View style={animatedTextSectionStyle}>
        <Animated.View
          style={[styles.textLayer, expandedTextLayerStyle]}
          pointerEvents={showMultilineInput ? 'box-none' : 'none'}
        >
          <View
            style={[
              styles.expandedTextColumn,
              maxExpandedTextSectionHeight != null && {
                maxHeight: maxExpandedTextSectionHeight,
                overflow: 'hidden',
              },
            ]}
            onLayout={handleExpandedTextLayout}
          >
            <CustomTextInput
              value={value}
              onChangeText={onChangeText}
              placeholder="Message…"
              editable={
                !isLoading &&
                !isSessionMode &&
                !(isSessionTransitioning && !isSessionReturningToGreeting)
              }
              maxLength={8000}
              multiline
              autoFocus={pendingFocus}
              onFocus={handleComposerFocus}
              onBlur={handleComposerBlur}
              compactInitialHeight
              minimumLineCount={CHAT_INPUT_MIN_VISIBLE_LINES}
              maxVisibleHeight={expandedTextInputMaxHeight}
              cursorColor={marpleFill}
              containerStyle={styles.textInputContainer}
              inputStyle={styles.chatInputPadding}
            />
          </View>
        </Animated.View>

        {/* read-only submitted prompt — fades in during session morph */}
        <Animated.View
          style={[styles.submittedTextLayer, submittedTextLayerStyle]}
          pointerEvents={isSessionMode ? 'auto' : 'none'}
        >
          <Text style={[styles.promptLabel, { color: themeColors.text.secondary() }]}>
            Your prompt:
          </Text>
          <ScrollView
            style={{ minHeight: CHAT_COMPOSER_MIN_TEXT_CONTENT_HEIGHT }}
            contentContainerStyle={styles.submittedScrollContent}
            showsVerticalScrollIndicator
            keyboardShouldPersistTaps="handled"
          >
            <Text style={[styles.promptText, { color: themeColors.text.secondary() }]}>
              {submittedText}
            </Text>
          </ScrollView>
        </Animated.View>
      </Animated.View>

      {/* fixed row — collapsed preview sits between attach and send; shrinks during session morph */}
      <Animated.View
        style={[styles.utilityRowWrap, animatedUtilityRowStyle]}
        pointerEvents={
          isSessionMode || (isSessionTransitioning && !isSessionReturningToGreeting)
            ? 'none'
            : 'box-none'
        }
      >
        <View style={styles.utilityRow}>
          <ChatAttachMenu
            disabled={
              isLoading ||
              isSessionMode ||
              (isSessionTransitioning && !isSessionReturningToGreeting)
            }
          />
          <Animated.View
            style={[styles.inlinePreviewSlot, inlinePreviewStyle]}
            pointerEvents={showMultilineInput ? 'none' : 'box-none'}
          >
            {inlinePreview}
          </Animated.View>
          <ChatSendMicButton
            hasText={hasText}
            isLoading={isLoading}
            onSend={onSend}
          />
        </View>
      </Animated.View>
    </View>
  );

  const shellBody = Platform.OS === 'ios' ? (
    <GlassView
      style={[styles.glassShell, cornerStyle]}
      glassEffectStyle="regular"
      tintColor={glassTint as any}
      isInteractive={
        !isSessionMode && !(isSessionTransitioning && !isSessionReturningToGreeting)
      }
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
      <Animated.View style={[styles.brandBorderShell, cornerStyle, brandBorderShellStyle]}>
        <View style={styles.glassBleedSlot}>{shellBody}</View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerMargin: {
    overflow: 'visible',
    zIndex: 0,
  },
  brandBorderShell: {
    overflow: 'hidden',
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
  submittedTextLayer: {
    ...StyleSheet.absoluteFillObject,
    top: 0,
    left: 0,
    right: 0,
    paddingLeft: Paddings.groupedListContentHorizontal,
    paddingTop: Paddings.groupedListChildContentVertical,
    paddingBottom: Paddings.formDataPillHorizontal,
    paddingRight: Paddings.groupedListContentHorizontal,
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
  utilityRowWrap: {
    overflow: 'hidden',
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
    lineHeight: CHAT_COMPOSER_TEXT_LINE_HEIGHT,
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
