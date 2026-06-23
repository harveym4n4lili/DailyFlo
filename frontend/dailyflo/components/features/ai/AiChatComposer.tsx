/**
 * AI chat composer — text field + send button (extracted from AI tab).
 */

import React from 'react';
import { View, TextInput, Pressable, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useColorPalette';
import { getTextStyle } from '@/constants/Typography';
import { Paddings } from '@/constants/Paddings';

export interface AiChatComposerProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  isLoading?: boolean;
  bottomPaddingAboveTabBar: number;
}

export function AiChatComposer({
  value,
  onChangeText,
  onSend,
  isLoading = false,
  bottomPaddingAboveTabBar,
}: AiChatComposerProps) {
  const themeColors = useThemeColors();
  const trimmed = value.trim();
  const canSend = trimmed.length > 0 && !isLoading;

  return (
    <View style={[styles.inputSection, { marginBottom: bottomPaddingAboveTabBar }]}>
      <View
        style={[
          styles.inputShell,
          {
            backgroundColor: themeColors.background.primarySecondaryBlend(),
            borderColor: themeColors.border.primary(),
          },
        ]}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder="Message…"
          placeholderTextColor={themeColors.text.tertiary()}
          style={[styles.textInput, { color: themeColors.text.primary() }]}
          multiline
          maxLength={8000}
          returnKeyType="default"
          blurOnSubmit={false}
          editable={!isLoading}
          accessibilityLabel="AI message"
          accessibilityHint="Type a message for the AI assistant"
        />
      </View>

      <Pressable
        onPress={onSend}
        disabled={!canSend}
        accessibilityRole="button"
        accessibilityLabel="Send message"
        accessibilityState={{ disabled: !canSend }}
        style={({ pressed }) => [
          styles.sendButton,
          {
            backgroundColor: canSend
              ? themeColors.background.invertedPrimary()
              : themeColors.background.primarySecondaryBlend(),
          },
          pressed && canSend && styles.sendButtonPressed,
        ]}
      >
        {isLoading ? (
          <ActivityIndicator color={themeColors.text.invertedPrimary()} size="small" />
        ) : (
          <Ionicons
            name="send"
            size={20}
            color={canSend ? themeColors.text.invertedPrimary() : themeColors.text.tertiary()}
          />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  inputSection: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Paddings.groupedListIconTextSpacing,
  },
  inputShell: {
    flex: 1,
    minHeight: 48,
    maxHeight: 140,
    borderRadius: 22,
    paddingHorizontal: Paddings.groupedListContentHorizontal,
    paddingVertical: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  textInput: {
    ...getTextStyle('body-large'),
    padding: 0,
    margin: 0,
    ...(Platform.OS === 'android' && { textAlignVertical: 'top' }),
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonPressed: {
    opacity: 0.85,
  },
});
