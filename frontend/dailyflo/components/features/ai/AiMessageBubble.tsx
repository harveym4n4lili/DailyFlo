/**
 * Single chat bubble — user (right-aligned feel) vs assistant.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { Paddings } from '@/constants/Paddings';
import type { ChatMessageRole } from '@/types/api/llm';

export interface AiMessageBubbleProps {
  role: ChatMessageRole;
  content: string;
}

export function AiMessageBubble({ role, content }: AiMessageBubbleProps) {
  const themeColors = useThemeColors();
  const typography = useTypography();
  const isUser = role === 'user';

  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          alignItems: isUser ? 'flex-end' : 'flex-start',
          marginBottom: Paddings.groupedListIconTextSpacing,
        },
        bubble: {
          maxWidth: '88%',
          borderRadius: 18,
          paddingHorizontal: Paddings.groupedListContentHorizontal,
          paddingVertical: 10,
          backgroundColor: isUser
            ? themeColors.background.invertedPrimary()
            : themeColors.background.primarySecondaryBlend(),
          borderWidth: isUser ? 0 : StyleSheet.hairlineWidth,
          borderColor: themeColors.border.primary(),
        },
        text: {
          ...typography.getTextStyle('body-large'),
          color: isUser ? themeColors.text.invertedPrimary() : themeColors.text.primary(),
        },
        label: {
          ...typography.getTextStyle('body-small'),
          color: themeColors.text.tertiary(),
          marginBottom: 4,
        },
      }),
    [isUser, themeColors, typography]
  );

  return (
    <View style={styles.row}>
      {!isUser ? <Text style={styles.label}>Assistant</Text> : null}
      <View style={styles.bubble}>
        <Text style={styles.text}>{content}</Text>
      </View>
    </View>
  );
}
