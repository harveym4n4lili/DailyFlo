/**
 * AI Tab Screen
 *
 * Chat with the LLM assistant; proposals require Confirm before Redux task CRUD runs.
 */

import React, { useCallback, useContext, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenContainer } from '@/components/index';
import { ScreenHeaderActions } from '@/components/ui';
import { IosDashboardOverflowToolbar } from '@/components/navigation/IosDashboardOverflowToolbar';
import { AiChatComposer, AiMessageList } from '@/components/features/ai';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { useAiAssistant } from '@/hooks/useAiAssistant';
import { useTasks } from '@/store/hooks';
import { Paddings } from '@/constants/Paddings';

const TAB_BAR_HEIGHT_FALLBACK = Platform.select({ ios: 49, android: 56, default: 49 });
const TOP_SECTION_ROW_HEIGHT = 48;

export default function AITabScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeightFromNav = useContext(BottomTabBarHeightContext);
  const tabBarHeight = tabBarHeightFromNav ?? TAB_BAR_HEIGHT_FALLBACK;
  const bottomPaddingAboveTabBar =
    tabBarHeightFromNav != null
      ? tabBarHeightFromNav + Paddings.tabBarInputGap
      : tabBarHeight + insets.bottom + Paddings.tabBarInputGap;

  const themeColors = useThemeColors();
  const typography = useTypography();
  const { tasks } = useTasks();

  const {
    messages,
    isLoading,
    error,
    hasMessages,
    sendMessage,
    getProposalPayload,
    updateProposalPayload,
    confirmProposal,
    dismissProposal,
    getProposalStatus,
    getProposalError,
    clearError,
  } = useAiAssistant();

  const [prompt, setPrompt] = useState('');

  const styles = useMemo(
    () => createStyles(themeColors, typography, insets, bottomPaddingAboveTabBar),
    [themeColors, typography, insets, bottomPaddingAboveTabBar]
  );

  const handleSend = useCallback(() => {
    const trimmed = prompt.trim();
    if (!trimmed || isLoading) return;
    setPrompt('');
    clearError();
    void sendMessage(trimmed);
  }, [prompt, isLoading, sendMessage, clearError]);

  return (
    <>
      <IosDashboardOverflowToolbar />
      <View style={{ flex: 1 }}>
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
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
              <View style={styles.inner}>
                <Text style={styles.title}>AI</Text>
                {!hasMessages ? (
                  <Text style={styles.hint}>
                    Ask DailyFlo to create, update, or delete tasks. You will review each suggestion
                    before it is applied.
                  </Text>
                ) : null}

                {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

                {isLoading && !hasMessages ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator color={themeColors.text.secondary()} />
                  </View>
                ) : null}

                {hasMessages ? (
                  <AiMessageList
                    messages={messages}
                    tasks={tasks}
                    getProposalPayload={getProposalPayload}
                    getProposalStatus={getProposalStatus}
                    getProposalError={getProposalError}
                    onUpdateProposalPayload={updateProposalPayload}
                    onConfirmProposal={confirmProposal}
                    onDismissProposal={dismissProposal}
                  />
                ) : (
                  <View style={styles.spacer} />
                )}

                <AiChatComposer
                  value={prompt}
                  onChangeText={setPrompt}
                  onSend={handleSend}
                  isLoading={isLoading}
                  bottomPaddingAboveTabBar={bottomPaddingAboveTabBar}
                />
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
  _bottomPaddingAboveTabBar: number
) =>
  StyleSheet.create({
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
    errorBanner: {
      ...typography.getTextStyle('body-medium'),
      color: themeColors.text.primary(),
      marginTop: 8,
      padding: 10,
      borderRadius: 10,
      backgroundColor: themeColors.background.primarySecondaryBlend(),
    },
    loadingRow: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    spacer: {
      flex: 1,
    },
  });
