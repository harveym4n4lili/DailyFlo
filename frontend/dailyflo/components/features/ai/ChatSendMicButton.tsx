/**
 * chat composer trailing utility — mic when empty (attach chip colors), upload arrow when typing (marple send).
 * crossfades + scales between the two states; mic press is a no-op until voice input is wired.
 */

import React, { useEffect } from 'react';
import {
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useColorPalette, useThemeColors } from '@/hooks/useColorPalette';
import {
  CHAT_UTILITY_BUTTON_SIZE,
  getChatAttachChipColors,
  getChatSendButtonColors,
} from './chatComposerUiTokens';

const BUTTON_SIZE = CHAT_UTILITY_BUTTON_SIZE;
const BUTTON_RADIUS = BUTTON_SIZE / 2;
const STATE_TRANSITION_MS = 220;

export interface ChatSendMicButtonProps {
  /** true when trimmed input has characters — drives send vs mic presentation */
  hasText: boolean;
  isLoading?: boolean;
  onSend: () => void;
}

export function ChatSendMicButton({ hasText, isLoading = false, onSend }: ChatSendMicButtonProps) {
  const colors = useColorPalette();
  const themeColors = useThemeColors();
  const attachChip = getChatAttachChipColors(colors);
  const sendColors = getChatSendButtonColors(colors);

  const canSend = hasText && !isLoading;
  const disabledOpacity = isLoading ? 0.4 : 1;

  // 0 = mic visible, 1 = send visible — animated when user types or clears the field
  const sendReveal = useSharedValue(hasText ? 1 : 0);
  useEffect(() => {
    sendReveal.value = withTiming(hasText ? 1 : 0, {
      duration: STATE_TRANSITION_MS,
      easing: Easing.out(Easing.cubic),
    });
  }, [hasText, sendReveal]);

  const micLayerStyle = useAnimatedStyle(() => {
    const micVisible = 1 - sendReveal.value;
    return {
      opacity: micVisible,
      transform: [{ scale: 0.9 + micVisible * 0.1 }],
    };
  });

  const sendLayerStyle = useAnimatedStyle(() => ({
    opacity: sendReveal.value,
    transform: [{ scale: 0.9 + sendReveal.value * 0.1 }],
  }));

  const circleDimensions = {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_RADIUS,
  };

  const micIcon = <Ionicons name="mic" size={20} color={attachChip.icon} />;
  const sendIcon = isLoading ? (
    <ActivityIndicator color={sendColors.icon} size="small" />
  ) : (
    <Ionicons name="arrow-up" size={18} color={sendColors.icon} />
  );

  return (
    <Animated.View style={[styles.stackHost, circleDimensions]}>
      <Animated.View
        style={[styles.stackLayer, micLayerStyle]}
        pointerEvents={hasText ? 'none' : 'auto'}
      >
        <Pressable
          onPress={() => {
            // voice input placeholder — intentionally no-op for now
          }}
          disabled={isLoading}
          accessibilityRole="button"
          accessibilityLabel="Voice message"
          accessibilityHint="Voice input coming soon"
          style={({ pressed }) => [
            styles.circleButton,
            circleDimensions,
            {
              backgroundColor: attachChip.background,
              borderColor: themeColors.border.secondary(),
              opacity: disabledOpacity * (pressed ? 0.85 : 1),
            },
          ]}
        >
          {micIcon}
        </Pressable>
      </Animated.View>
      <Animated.View
        style={[styles.stackLayer, sendLayerStyle]}
        pointerEvents={hasText ? 'auto' : 'none'}
      >
        <Pressable
          onPress={onSend}
          disabled={!canSend}
          accessibilityRole="button"
          accessibilityLabel="Send message"
          accessibilityState={{ disabled: !canSend }}
          style={({ pressed }) => [
            styles.circleButton,
            circleDimensions,
            {
              backgroundColor: sendColors.fill,
              borderColor: themeColors.border.primary(),
              opacity: canSend && pressed ? 0.85 : 1,
            },
          ]}
        >
          {sendIcon}
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  stackHost: {
    position: 'relative',
  },
  stackLayer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleButton: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
});
