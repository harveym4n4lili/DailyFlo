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
  useWindowDimensions,
  type LayoutChangeEvent,
} from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useFocusEffect } from 'expo-router';
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenContainer } from '@/components/index';
import { ScreenHeaderActions } from '@/components/ui';
import { FloatingActionButton } from '@/components/ui/Button';
import { MainBackButton } from '@/components/ui/Button';
import { IosAiStackToolbar } from '@/components/navigation/IosAiStackToolbar';
import { USE_CUSTOM_LIQUID_TAB_BAR, fabChromeZoneStyle } from '@/components/navigation/tabBarChrome';
import {
  ChatContainer,
  ChatComposerSuggestions,
  AiEmptyStateIntro,
  AiEmptyStateIntroBackground,
  AiSubmittedPromptShell,
  pickRandomAiGreeting,
  pickRandomAiHint,
} from '@/components/features/ai';
import { AI_EMPTY_STATE_GREETING_FADE_MS } from '@/components/features/ai/aiEmptyStateIntroTokens';
import { getChatComposerMaxExpandedTextSectionHeight } from '@/components/features/ai/chatComposerUiTokens';
import { useAnimatedKeyboardInset, useKeyboardHeight } from '@/components/layout/ScreenLayout';
import { useTabFabOverlay } from '@/contexts/TabFabOverlayContext';
import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { useThemeColors, useBrandColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { useAiAssistant } from '@/hooks/useAiAssistant';
import { useUI } from '@/store/hooks';
import { Paddings } from '@/constants/Paddings';
import { buildTaskQuickAddRouteParams } from '@/utils/taskQuickAddRouteParams';

const TAB_BAR_HEIGHT_FALLBACK = Platform.select({ ios: 49, android: 56, default: 49 });
const TOP_SECTION_ROW_HEIGHT = 48;

type AiScreenPhase = 'prompt' | 'session';

/** opens task quick-add with no preset due date — same as inbox FAB */
function pushQuickAddFromAiTab(router: ReturnType<typeof useGuardedRouter>) {
  router.push({ pathname: '/task-quick-add' as any, params: buildTaskQuickAddRouteParams() });
}

export default function AITabScreen() {
  const router = useGuardedRouter();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const tabBarHeightFromNav = useContext(BottomTabBarHeightContext);
  const tabBarHeight = tabBarHeightFromNav ?? TAB_BAR_HEIGHT_FALLBACK;
  const bottomPaddingAboveTabBar =
    tabBarHeightFromNav != null
      ? tabBarHeightFromNav + Paddings.tabBarInputGap
      : tabBarHeight + insets.bottom + Paddings.tabBarInputGap;

  const themeColors = useThemeColors();
  const { getMarpleBrandColor } = useBrandColors();
  const typography = useTypography();
  const { modals, closeModal } = useUI();

  const {
    isLoading,
    error,
    sendMessage,
    clearError,
    resetSession,
  } = useAiAssistant();

  const [screenPhase, setScreenPhase] = useState<AiScreenPhase>('prompt');
  const [submittedPrompt, setSubmittedPrompt] = useState('');
  const [prompt, setPrompt] = useState('');
  // random empty-state copy — refreshed on tab focus and when returning to prompt
  const [greeting, setGreeting] = useState('');
  const [hint, setHint] = useState('');
  // bump key so greeting + hint intro replay after back-to-prompt
  const [introRunKey, setIntroRunKey] = useState(0);
  // keep intro mounted while greeting + hint fade out after send
  const [emptyIntroOnScreen, setEmptyIntroOnScreen] = useState(false);
  // radial blur stays mounted for the visit once shown; skip re-fade on back
  const [introBackgroundMounted, setIntroBackgroundMounted] = useState(false);
  const [introBackgroundHasAnimated, setIntroBackgroundHasAnimated] = useState(false);
  // measured composer height — used so the message list clears the anchored input bar
  const [composerHeight, setComposerHeight] = useState(0);

  // ui-thread inset for the composer anchor — tracks the keyboard smoothly (reanimated)
  const keyboardInsetAnimated = useAnimatedKeyboardInset();
  // js-thread height for list padding — layoutanimation keeps scroll inset in sync with keyboard
  const keyboardHeight = useKeyboardHeight();
  const restingComposerBottom = bottomPaddingAboveTabBar;

  const composerGap = Paddings.tabBarInputGap;

  const composerAnchorStyle = useAnimatedStyle(() => {
    const kb = keyboardInsetAnimated.value;
    // follow the keyboard while it is open, but never sit below the tab-bar resting inset —
    // without the clamp, kb→0 would drop the composer onto the navbar then snap back up
    return {
      bottom: Math.max(kb + composerGap, restingComposerBottom),
    };
  }, [restingComposerBottom, composerGap]);

  const handleComposerLayout = useCallback((event: LayoutChangeEvent) => {
    const nextHeight = event.nativeEvent.layout.height;
    setComposerHeight((prev) => (prev === nextHeight ? prev : nextHeight));
  }, []);

  const composerBottomInset = Math.max(
    keyboardHeight + Paddings.tabBarInputGap,
    restingComposerBottom,
  );

  // y-offset where main content starts — composer must not grow above this line
  const aiHeaderBottomY = insets.top + TOP_SECTION_ROW_HEIGHT + 8;

  const maxExpandedTextSectionHeight = useMemo(
    () =>
      getChatComposerMaxExpandedTextSectionHeight({
        windowHeight,
        headerBottomY: aiHeaderBottomY,
        composerBottomInset,
      }),
    [windowHeight, aiHeaderBottomY, composerBottomInset],
  );

  const styles = useMemo(
    () => createStyles(themeColors, typography, insets, getMarpleBrandColor(500)),
    [themeColors, typography, insets, getMarpleBrandColor],
  );

  const isPromptPhase = screenPhase === 'prompt';

  const refreshIntroCopy = useCallback(() => {
    setGreeting(pickRandomAiGreeting());
    setHint(pickRandomAiHint());
  }, []);

  const handleBackToPrompt = useCallback(() => {
    resetSession();
    setScreenPhase('prompt');
    setPrompt('');
    setSubmittedPrompt('');
    refreshIntroCopy();
    setEmptyIntroOnScreen(true);
    setIntroRunKey((key) => key + 1);
    clearError();
  }, [resetSession, refreshIntroCopy, clearError]);

  const handleSend = useCallback(() => {
    const trimmed = prompt.trim();
    if (!trimmed || isLoading) return;
    setSubmittedPrompt(trimmed);
    setScreenPhase('session');
    setPrompt('');
    clearError();
    void sendMessage(trimmed);
  }, [prompt, isLoading, sendMessage, clearError]);

  // tapping a suggestion autofills the chat prompt with its description line (not the pill title)
  const handlePickSuggestion = useCallback((description: string) => {
    setPrompt(description);
    clearError();
  }, [clearError]);

  // show intro on prompt phase; hide after shared fade-out when entering session
  useEffect(() => {
    if (greeting && hint && isPromptPhase) {
      setEmptyIntroOnScreen(true);
    }
  }, [greeting, hint, isPromptPhase]);

  // mark radial blur enter animation as done so back-to-prompt does not re-fade it
  useEffect(() => {
    if (!introBackgroundMounted || introBackgroundHasAnimated) return undefined;
    const timerId = setTimeout(
      () => setIntroBackgroundHasAnimated(true),
      AI_EMPTY_STATE_GREETING_FADE_MS,
    );
    return () => clearTimeout(timerId);
  }, [introBackgroundMounted, introBackgroundHasAnimated]);

  const handleIntroFadeOutComplete = useCallback(() => {
    setEmptyIntroOnScreen(false);
  }, []);

  // register FAB with shared tab chrome when the liquid navbar owns the button (same as inbox / today)
  const { setTabFabRegistration } = useTabFabOverlay();
  useFocusEffect(
    useCallback(() => {
      refreshIntroCopy();
      setScreenPhase('prompt');
      setEmptyIntroOnScreen(true);
      setIntroBackgroundMounted(true);
      setIntroRunKey((key) => key + 1);

      if (!USE_CUSTOM_LIQUID_TAB_BAR) return undefined;
      setTabFabRegistration({
        onPress: () => pushQuickAddFromAiTab(router),
        accessibilityLabel: 'Add new task',
        accessibilityHint: 'Double tap to create a new task',
      });
      return () => {
        setTabFabRegistration(null);
        resetSession();
        setScreenPhase('prompt');
        setPrompt('');
        setSubmittedPrompt('');
        setEmptyIntroOnScreen(false);
        setIntroBackgroundMounted(false);
        setIntroBackgroundHasAnimated(false);
        setIntroRunKey(0);
      };
    }, [router, setTabFabRegistration, refreshIntroCopy, resetSession]),
  );

  // legacy createTask modal flag still routes to quick-add on this tab
  useEffect(() => {
    if (modals.createTask) {
      closeModal('createTask');
      pushQuickAddFromAiTab(router);
    }
  }, [modals.createTask, closeModal, router]);

  const openActivityLog = useCallback(() => {
    router.push('/activity-log' as any);
  }, [router]);

  return (
    <>
      <IosAiStackToolbar
        showBack={screenPhase === 'session'}
        onBackPress={handleBackToPrompt}
      />
      <View style={{ flex: 1 }}>
        <View
          style={[styles.topSectionAnchor, { height: insets.top + TOP_SECTION_ROW_HEIGHT }]}
          pointerEvents="box-none"
        >
          <View style={styles.topSectionRow} pointerEvents="box-none">
            {screenPhase === 'session' && Platform.OS === 'android' ? (
              <MainBackButton onPress={handleBackToPrompt} top={0} left={0} />
            ) : (
              <View style={styles.topSectionCloseButton} pointerEvents="none" />
            )}
            {Platform.OS === 'android' ? (
              <ScreenHeaderActions
                variant="activity-log"
                onActivityLogPress={openActivityLog}
                style={styles.topSectionContextButton}
                tint="primary"
              />
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
          <View style={styles.screenRoot}>
            {introBackgroundMounted ? (
              <AiEmptyStateIntroBackground skipEnterAnimation={introBackgroundHasAnimated} />
            ) : null}
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
              <View style={styles.dismissTapArea}>
                <View style={styles.inner}>
                  {screenPhase === 'session' && submittedPrompt ? (
                    <View style={styles.submittedPromptWrap}>
                      <AiSubmittedPromptShell text={submittedPrompt} />
                    </View>
                  ) : null}

                  {emptyIntroOnScreen && greeting && hint ? (
                    <AiEmptyStateIntro
                      key={`${introRunKey}-${greeting}-${hint}`}
                      greeting={greeting}
                      hint={hint}
                      visible={isPromptPhase}
                      onFadeOutComplete={handleIntroFadeOutComplete}
                      greetingStyle={styles.greeting}
                      hintStyle={styles.hint}
                    />
                  ) : null}

                  {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

                  {isLoading && screenPhase === 'session' ? (
                    <View style={styles.loadingRow}>
                      <ActivityIndicator color={themeColors.text.secondary()} />
                    </View>
                  ) : null}

                  <View style={styles.spacer} />
                </View>
              </View>
            </TouchableWithoutFeedback>

            {isPromptPhase ? (
              <Animated.View
                style={[styles.composerAnchor, composerAnchorStyle]}
                onLayout={handleComposerLayout}
                pointerEvents="box-none"
              >
                <ChatComposerSuggestions
                  activePrompt={prompt}
                  isComposerExpanded={prompt.length > 0 && keyboardHeight > 0}
                  onPickSuggestion={handlePickSuggestion}
                />
                <ChatContainer
                  value={prompt}
                  onChangeText={setPrompt}
                  onSend={handleSend}
                  isLoading={isLoading}
                  isKeyboardVisible={keyboardHeight > 0}
                  maxExpandedTextSectionHeight={maxExpandedTextSectionHeight}
                />
              </Animated.View>
            ) : null}
          </View>
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
  greetingColor: string,
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
    dismissTapArea: {
      flex: 1,
      zIndex: 1,
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
    greeting: {
      ...typography.getTextStyle('heading-1'),
      color: greetingColor,
    },
    hint: {
      ...typography.getTextStyle('heading-2'),
      color: themeColors.text.primary(),
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
    submittedPromptWrap: {
      marginBottom: Paddings.groupedListIconTextSpacing,
    },
  });
