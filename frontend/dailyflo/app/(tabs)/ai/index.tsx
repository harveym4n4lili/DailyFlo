/**
 * AI Tab Screen
 *
 * Chat with the LLM assistant; proposals require Confirm before Redux task CRUD runs.
 */

import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  ActivityIndicator,
  type LayoutChangeEvent,
} from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useFocusEffect } from 'expo-router';
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenContainer } from '@/components/index';
import { ScreenHeaderActions } from '@/components/ui';
import { FloatingActionButton } from '@/components/ui/Button';
import { IosDashboardOverflowToolbar } from '@/components/navigation/IosDashboardOverflowToolbar';
import { USE_CUSTOM_LIQUID_TAB_BAR, fabChromeZoneStyle } from '@/components/navigation/tabBarChrome';
import { ChatContainer, AiMessageList } from '@/components/features/ai';
import { useAnimatedKeyboardInset, useKeyboardHeight } from '@/components/layout/ScreenLayout';
import { useTabFabOverlay } from '@/contexts/TabFabOverlayContext';
import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { useAiAssistant } from '@/hooks/useAiAssistant';
import { useTasks, useUI } from '@/store/hooks';
import { Paddings } from '@/constants/Paddings';
import { buildTaskQuickAddRouteParams } from '@/utils/taskQuickAddRouteParams';

const TAB_BAR_HEIGHT_FALLBACK = Platform.select({ ios: 49, android: 56, default: 49 });
const TOP_SECTION_ROW_HEIGHT = 48;

/** opens task quick-add with no preset due date — same as inbox FAB */
function pushQuickAddFromAiTab(router: ReturnType<typeof useGuardedRouter>) {
  router.push({ pathname: '/task-quick-add' as any, params: buildTaskQuickAddRouteParams() });
}

export default function AITabScreen() {
  const router = useGuardedRouter();
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
  const { modals, closeModal } = useUI();

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
  // measured composer height — used so the message list clears the anchored input bar
  const [composerHeight, setComposerHeight] = useState(0);

  // ui-thread inset for the composer anchor — tracks the keyboard smoothly (reanimated)
  const keyboardInsetAnimated = useAnimatedKeyboardInset();
  // js-thread height for list padding — layoutanimation keeps scroll inset in sync with keyboard
  const keyboardHeight = useKeyboardHeight();
  const restingComposerBottom = bottomPaddingAboveTabBar;

  const composerAnchorStyle = useAnimatedStyle(() => {
    const kb = keyboardInsetAnimated.value;
    // keyboard open: sit just above the keyboard (tab bar is covered — drop the tab-bar inset).
    // keyboard closed: sit above the native tab bar with the usual gap.
    return {
      bottom: kb > 0 ? kb + Paddings.tabBarInputGap : restingComposerBottom,
    };
  }, [restingComposerBottom]);

  const handleComposerLayout = useCallback((event: LayoutChangeEvent) => {
    const nextHeight = event.nativeEvent.layout.height;
    setComposerHeight((prev) => (prev === nextHeight ? prev : nextHeight));
  }, []);

  const composerBottomInset =
    keyboardHeight > 0 ? keyboardHeight + Paddings.tabBarInputGap : restingComposerBottom;

  // list needs enough bottom padding to scroll past the absolutely positioned composer
  const messageListBottomInset =
    composerHeight + composerBottomInset + Paddings.groupedListIconTextSpacing;

  const styles = useMemo(
    () => createStyles(themeColors, typography, insets),
    [themeColors, typography, insets],
  );

  const handleSend = useCallback(() => {
    const trimmed = prompt.trim();
    if (!trimmed || isLoading) return;
    setPrompt('');
    clearError();
    void sendMessage(trimmed);
  }, [prompt, isLoading, sendMessage, clearError]);

  // register FAB with shared tab chrome when the liquid navbar owns the button (same as inbox / today)
  const { setTabFabRegistration } = useTabFabOverlay();
  useFocusEffect(
    useCallback(() => {
      if (!USE_CUSTOM_LIQUID_TAB_BAR) return undefined;
      setTabFabRegistration({
        onPress: () => pushQuickAddFromAiTab(router),
        accessibilityLabel: 'Add new task',
        accessibilityHint: 'Double tap to create a new task',
      });
      return () => setTabFabRegistration(null);
    }, [router, setTabFabRegistration]),
  );

  // legacy createTask modal flag still routes to quick-add on this tab
  useEffect(() => {
    if (modals.createTask) {
      closeModal('createTask');
      pushQuickAddFromAiTab(router);
    }
  }, [modals.createTask, closeModal, router]);

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
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={styles.screenRoot}>
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
                    listBottomInset={messageListBottomInset}
                  />
                ) : (
                  <View style={styles.spacer} />
                )}
              </View>

              {/* absolute bottom anchor — same pattern as TaskQuickAddOverlay, without double tab-bar offset */}
              <Animated.View
                style={[styles.composerAnchor, composerAnchorStyle]}
                onLayout={handleComposerLayout}
                pointerEvents="box-none"
              >
                <ChatContainer
                  value={prompt}
                  onChangeText={setPrompt}
                  onSend={handleSend}
                  isLoading={isLoading}
                />
              </Animated.View>
            </View>
          </TouchableWithoutFeedback>
        </ScreenContainer>
        {!USE_CUSTOM_LIQUID_TAB_BAR ? (
          <Animated.View style={fabChromeZoneStyle}>
            <FloatingActionButton
              onPress={() => pushQuickAddFromAiTab(router)}
              accessibilityLabel="Add new task"
              accessibilityHint="Double tap to create a new task"
            />
          </Animated.View>
        ) : null}
      </View>
    </>
  );
}

const createStyles = (
  themeColors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useTypography>,
  insets: ReturnType<typeof useSafeAreaInsets>,
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
    screenRoot: {
      flex: 1,
      position: 'relative',
    },
    inner: {
      flex: 1,
      paddingTop: insets.top + TOP_SECTION_ROW_HEIGHT + 8,
      paddingHorizontal: Paddings.screen,
    },
    composerAnchor: {
      position: 'absolute',
      // groupedListHeaderContentGap (10) = half of Paddings.screen — tighter outer inset for the floating composer
      left: Paddings.groupedListHeaderContentGap,
      right: Paddings.groupedListHeaderContentGap,
      zIndex: 2,
      overflow: 'visible',
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
