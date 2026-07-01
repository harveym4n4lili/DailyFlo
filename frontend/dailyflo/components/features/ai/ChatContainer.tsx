/**
 * AI chat container — liquid glass shell split into two stacked sections:
 * message text field on top, bottom utility row (send button + room for more actions).
 */

import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import GlassView from 'expo-glass-effect/build/GlassView';
import { CustomTextInput } from '@/components/ui/TextInput';
import { ChatAttachMenu } from './ChatAttachMenu';
import { ChatSendMicButton } from './ChatSendMicButton';
import { useThemeColors, useColorPalette } from '@/hooks/useColorPalette';
import { getChatSendButtonColors } from './chatComposerUiTokens';
import { Paddings } from '@/constants/Paddings';
import {
  PROGRESS_BOARD_GLASS_BORDER_WIDTH,
  PROGRESS_BOARD_GLASS_TINT_OPACITY,
  PROGRESS_BOARD_GLASS_VEIL_OPACITY,
} from '@/components/features/gamification/browse/progressBoardUiTokens';

// empty chat field shows 3 lines of height — compactInitialHeight avoids Description's extra notes padding
const CHAT_INPUT_MIN_VISIBLE_LINES = 3;

export interface ChatContainerProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  isLoading?: boolean;
}

export function ChatContainer({
  value,
  onChangeText,
  onSend,
  isLoading = false,
}: ChatContainerProps) {
  const themeColors = useThemeColors();
  const colors = useColorPalette();
  const trimmed = value.trim();
  const hasText = trimmed.length > 0;

  // marple caret while typing — matches send button fill
  const marpleFill = getChatSendButtonColors(colors).fill;
  // liquid glass shell — veil + inset hairline border live inside the glass (not wrapping it)
  const shellRadius = Paddings.continueButtonRadius;
  const innerRadius = Math.max(shellRadius - PROGRESS_BOARD_GLASS_BORDER_WIDTH, 0);
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

  const content = (
    <>
      <CustomTextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Message…"
        editable={!isLoading}
        maxLength={8000}
        multiline
        // compact mode drops CustomTextInput's extra 24pt notes padding so the utility row sits tight under the text
        compactInitialHeight
        minimumLineCount={CHAT_INPUT_MIN_VISIBLE_LINES}
        cursorColor={marpleFill}
        containerStyle={styles.textInputContainer}
        inputStyle={styles.chatInputPadding}
      />

      <View style={styles.bottomRow}>
        <ChatAttachMenu disabled={isLoading} />

        <ChatSendMicButton hasText={hasText} isLoading={isLoading} onSend={onSend} />
      </View>
    </>
  );

  const inner = (
    <View style={[styles.innerClip, innerCornerStyle]}>
      {/* solid veil + hairline ring sit on top of the blur, under the text/buttons */}
      <View style={[styles.glassVeil, { backgroundColor: glassVeil }]} pointerEvents="none" />
      <View
        style={[
          styles.innerBorderRing,
          innerCornerStyle,
          { borderColor: themeColors.border.secondary() },
        ]}
        pointerEvents="none"
      />
      <View style={styles.contentColumn}>{content}</View>
    </View>
  );

  const shell = Platform.OS === 'ios' ? (
    <GlassView
      style={[styles.glassShell, cornerStyle]}
      glassEffectStyle="regular"
      tintColor={glassTint as any}
      isInteractive
    >
      {inner}
    </GlassView>
  ) : (
    <View
      style={[
        styles.glassShell,
        cornerStyle,
        { backgroundColor: themeColors.background.primary() },
      ]}
    >
      {inner}
    </View>
  );

  return (
    <View style={styles.outerMargin}>
      {/* bleed slot — interactive glass draws past layout bounds; negative margin keeps screen position unchanged */}
      <View style={styles.glassBleedSlot}>{shell}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerMargin: {
    // bottom spacing is owned by the ai screen's keyboard anchor — not this component
    overflow: 'visible',
  },
  // room for isInteractive glass halo without shifting layout (same pattern as ContinueButton / QuickAddLabelOnlyPill)
  glassBleedSlot: {
    margin: -Paddings.liquidGlassBleed,
    padding: Paddings.liquidGlassBleed,
    overflow: 'visible',
  },
  glassShell: {
    overflow: 'visible',
  },
  innerClip: {
    position: 'relative',
    // do not clip — isInteractive glass expansion paints outside the rounded rect
    overflow: 'visible',
  },
  glassVeil: {
    ...StyleSheet.absoluteFillObject,
  },
  // hairline inset ring — drawn inside the glass panel (ProgressBoard outerBorder moved inward)
  innerBorderRing: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: PROGRESS_BOARD_GLASS_BORDER_WIDTH,
  },
  // inner column — padding for text field + utility row
  contentColumn: {
    flexDirection: 'column',
    gap: 0,
    paddingLeft: Paddings.groupedListContentHorizontal,
    paddingTop: Paddings.groupedListChildContentVertical,
    overflow: 'visible',
  },
  textInputContainer: {
    alignSelf: 'stretch',
    minWidth: 0,
  },
  // same zero-padding override as task Description — shell column already owns horizontal inset
  chatInputPadding: {
    paddingTop: Paddings.none,
    paddingBottom: Paddings.none,
    paddingLeft: Paddings.none,
    paddingRight: Paddings.groupedListContentHorizontal,
  },
  // bottom utility row — bleed past contentColumn left inset so attach/send share the same corner inset (formDataPillHorizontal)
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: -Paddings.groupedListContentHorizontal,
    paddingTop: Paddings.formDataPillHorizontal,
    paddingLeft: Paddings.formDataPillHorizontal,
    paddingRight: Paddings.formDataPillHorizontal,
    paddingBottom: Paddings.formDataPillHorizontal,
    overflow: 'visible',
  },
});
