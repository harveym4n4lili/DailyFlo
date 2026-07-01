/**
 * chat composer trailing utility — mic when empty (attach chip colors), upload arrow when typing (marple send).
 * crossfades + scales between the two states; mic press is a no-op until voice input is wired.
 */

import React, { useEffect } from 'react';
import {
  View,
  Pressable,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  DynamicColorIOS,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import GlassView from 'expo-glass-effect/build/GlassView';
import { useColorPalette, useThemeColors } from '@/hooks/useColorPalette';
import { Paddings } from '@/constants/Paddings';
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

  const micGlassTint =
    Platform.OS === 'ios'
      ? DynamicColorIOS({ light: attachChip.background, dark: attachChip.background })
      : attachChip.background;
  const sendGlassTint =
    Platform.OS === 'ios'
      ? DynamicColorIOS({ light: sendColors.fill, dark: sendColors.fill })
      : sendColors.fill;

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

  const micPressable = (
    <Pressable
      onPress={() => {
        // voice input placeholder — intentionally no-op for now
      }}
      disabled={isLoading}
      accessibilityRole="button"
      accessibilityLabel="Voice message"
      accessibilityHint="Voice input coming soon"
      style={[styles.glassSurfaceInner, { borderRadius: BUTTON_RADIUS, opacity: disabledOpacity }]}
    >
      {micIcon}
    </Pressable>
  );

  const sendPressable = (
    <Pressable
      onPress={onSend}
      disabled={!canSend}
      accessibilityRole="button"
      accessibilityLabel="Send message"
      accessibilityState={{ disabled: !canSend }}
      style={[styles.glassSurfaceInner, { borderRadius: BUTTON_RADIUS }]}
    >
      {sendIcon}
    </Pressable>
  );

  const micSurface =
    Platform.OS === 'ios' ? (
      <GlassView
        style={[styles.glassSurface, circleDimensions]}
        glassEffectStyle="clear"
        tintColor={micGlassTint as any}
        isInteractive
      >
        {micPressable}
      </GlassView>
    ) : (
      <TouchableOpacity
        style={[
          styles.androidFallback,
          circleDimensions,
          {
            backgroundColor: attachChip.background,
            borderColor: themeColors.border.secondary(),
            opacity: disabledOpacity,
          },
        ]}
        activeOpacity={0.85}
        disabled={isLoading}
        onPress={() => {
          // voice input placeholder — intentionally no-op for now
        }}
        accessibilityRole="button"
        accessibilityLabel="Voice message"
      >
        {micIcon}
      </TouchableOpacity>
    );

  const sendSurface =
    Platform.OS === 'ios' ? (
      <GlassView
        style={[styles.glassSurface, circleDimensions]}
        glassEffectStyle="regular"
        tintColor={sendGlassTint as any}
        isInteractive
      >
        {sendPressable}
      </GlassView>
    ) : (
      <TouchableOpacity
        style={[
          styles.androidFallback,
          circleDimensions,
          {
            backgroundColor: sendGlassTint as string,
            borderColor: themeColors.border.primary(),
          },
        ]}
        onPress={onSend}
        disabled={!canSend}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Send message"
        accessibilityState={{ disabled: !canSend }}
      >
        {sendIcon}
      </TouchableOpacity>
    );

  return (
    <View style={styles.glassBleedSlot}>
      <View style={[styles.stackHost, circleDimensions]}>
        <Animated.View
          style={[styles.stackLayer, micLayerStyle]}
          pointerEvents={hasText ? 'none' : 'auto'}
        >
          {micSurface}
        </Animated.View>
        <Animated.View
          style={[styles.stackLayer, sendLayerStyle]}
          pointerEvents={hasText ? 'auto' : 'none'}
        >
          {sendSurface}
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  glassBleedSlot: {
    margin: -Paddings.liquidGlassBleed,
    padding: Paddings.liquidGlassBleed,
    overflow: 'visible',
  },
  stackHost: {
    position: 'relative',
    overflow: 'visible',
  },
  stackLayer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glassSurface: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
  },
  glassSurfaceInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  androidFallback: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
});
