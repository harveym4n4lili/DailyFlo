/**
 * AI Tab Screen
 *
 * Same shell as Today / Planner: root flex view, floating top row (ScreenHeaderActions), ScreenContainer (no safe-area padding — chrome handles insets), then content.
 * Composer at the bottom: text field + send (LLM invoke will plug in later).
 */

import React, { useCallback, useContext, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
// metro resolves @/components/ui etc., but the root barrel must use /index so the bundler finds components/index.ts
import { ScreenContainer } from '@/components/index';
import { ScreenHeaderActions } from '@/components/ui';
import { IosDashboardOverflowToolbar } from '@/components/navigation/IosDashboardOverflowToolbar';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { Paddings } from '@/constants/Paddings';
import { getTextStyle } from '@/constants/Typography';
// native tabs (expo-router NativeTabs, sdk 55) don’t expose measured tab bar height like JS tabs — fallback so content clears the bar
const TAB_BAR_HEIGHT_FALLBACK = Platform.select({ ios: 49, android: 56, default: 49 });
// matches planner topSectionRow height — content starts below this + safe top
const TOP_SECTION_ROW_HEIGHT = 48;

export default function AITabScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeightFromNav = useContext(BottomTabBarHeightContext);
  const tabBarHeight = tabBarHeightFromNav ?? TAB_BAR_HEIGHT_FALLBACK;
  // tab bar height + safe bottom + tabBarInputGap keeps the input section above the navbar
  const bottomPaddingAboveTabBar =
    tabBarHeightFromNav != null
      ? tabBarHeightFromNav + Paddings.tabBarInputGap
      : tabBarHeight + insets.bottom + Paddings.tabBarInputGap;

  const themeColors = useThemeColors();
  const typography = useTypography();
  const styles = useMemo(
    () => createStyles(themeColors, typography, insets, bottomPaddingAboveTabBar),
    [themeColors, typography, insets, bottomPaddingAboveTabBar]
  );

  const [prompt, setPrompt] = useState('');

  const trimmed = prompt.trim();
  const canSend = trimmed.length > 0;

  const handleSend = useCallback(() => {
    if (!canSend) return;
    setPrompt('');
  }, [canSend]);

  return (
    <>
      <IosDashboardOverflowToolbar />
      <View style={{ flex: 1 }}>
      {/* android: glass dashboard chip; ios: icons only in Stack.Toolbar */}
      <View
        style={[styles.topSectionAnchor, { height: insets.top + TOP_SECTION_ROW_HEIGHT }]}
        pointerEvents="box-none"
      >
        <View style={styles.topSectionRow} pointerEvents="box-none">
          <View style={styles.topSectionCloseButton} pointerEvents="none" />
          {Platform.OS === 'android' ? (
            <ScreenHeaderActions variant="dashboard" style={styles.topSectionContextButton} tint="primary" />
          ) : null}
        </View>
      </View>

      {/* same ScreenContainer flags as today/planner: full-bleed; we apply insets + tab bar padding inside */}
      <ScreenContainer
        scrollable={false}
        paddingHorizontal={0}
        safeAreaTop={false}
        safeAreaBottom={false}
        paddingVertical={0}
      >
        <KeyboardAvoidingView
          style={styles.keyboardRoot}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? tabBarHeight : 0}
        >
          {/* tap outside the text field to hide the keyboard (TextInput still receives its own taps) */}
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={styles.inner}>
              <Text style={styles.title}>AI</Text>
              <Text style={styles.hint}>
                Ask DailyFlo anything. Replies will show here once the assistant is connected.
              </Text>

              <View style={styles.spacer} />

              {/* inputSection: message field + send, pinned above tab bar; inner.paddingBottom matches tab bar + tabBarInputGap */}
              <View style={styles.inputSection}>
                <View style={styles.inputShell}>
                  <TextInput
                    value={prompt}
                    onChangeText={setPrompt}
                    placeholder="Message…"
                    placeholderTextColor={themeColors.text.tertiary()}
                    style={styles.textInput}
                    multiline
                    maxLength={8000}
                    returnKeyType="default"
                    blurOnSubmit={false}
                    accessibilityLabel="AI message"
                    accessibilityHint="Type a message for the AI assistant"
                  />
                </View>

                <Pressable
                  onPress={handleSend}
                  disabled={!canSend}
                  accessibilityRole="button"
                  accessibilityLabel="Send message"
                  accessibilityState={{ disabled: !canSend }}
                  style={({ pressed }) => [
                    styles.sendButton,
                    !canSend && styles.sendButtonDisabled,
                    pressed && canSend && styles.sendButtonPressed,
                  ]}
                >
                  <Ionicons
                    name="send"
                    size={20}
                    color={
                      canSend
                        ? themeColors.text.invertedPrimary()
                        : themeColors.text.tertiary()
                    }
                  />
                </Pressable>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </ScreenContainer>
    </View>
    </>
  );
}

const createStyles = (
  themeColors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useTypography>,
  insets: ReturnType<typeof useSafeAreaInsets>,
  bottomPaddingAboveTabBar: number
) =>
  StyleSheet.create({
    // planner-aligned chrome
    topSectionAnchor: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10,
      backgroundColor: 'transparent',
    },
    topSectionRow: {
      position: 'absolute',
      top: insets.top,
      left: 0,
      right: 0,
      height: TOP_SECTION_ROW_HEIGHT,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingHorizontal: Paddings.screen,
    },
    topSectionCloseButton: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 'auto',
    },
    topSectionContextButton: {
      backgroundColor: 'primary',
    },
    keyboardRoot: {
      flex: 1,
    },
    // title + spacer + inputSection; bottom clearance lives on inputSection
    inner: {
      flex: 1,
      paddingTop: insets.top + TOP_SECTION_ROW_HEIGHT + 8,
      paddingHorizontal: Paddings.screen,
    },
    title: {
      ...typography.getTextStyle('heading-2'),
      color: themeColors.text.primary(),
    },
    hint: {
      ...typography.getTextStyle('body-medium'),
      color: themeColors.text.secondary(),
      marginTop: 8,
    },
    spacer: {
      flex: 1,
    },
    // message field + send; marginBottom = tab bar + safe area + Paddings.tabBarInputGap so this block sits above the navbar
    inputSection: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: Paddings.groupedListIconTextSpacing,
      marginBottom: bottomPaddingAboveTabBar,
    },
    inputShell: {
      flex: 1,
      minHeight: 48,
      maxHeight: 140,
      borderRadius: 22,
      paddingHorizontal: Paddings.groupedListContentHorizontal,
      paddingVertical: 12,
      backgroundColor: themeColors.background.primarySecondaryBlend(),
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: themeColors.border.primary(),
    },
    textInput: {
      ...getTextStyle('body-large'),
      color: themeColors.text.primary(),
      padding: 0,
      margin: 0,
      ...(Platform.OS === 'android' && {
        textAlignVertical: 'top',
      }),
    },
    sendButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: themeColors.background.invertedPrimary(),
    },
    sendButtonDisabled: {
      backgroundColor: themeColors.background.primarySecondaryBlend(),
    },
    sendButtonPressed: {
      opacity: 0.85,
    },
  });
