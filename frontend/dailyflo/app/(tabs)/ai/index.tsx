/**
 * AI Tab Screen
 *
 * Chat with the LLM assistant; proposals require Confirm before Redux task CRUD runs.
 */

import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
  useWindowDimensions,
  type LayoutChangeEvent,
} from 'react-native';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useFocusEffect } from 'expo-router';
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenContainer } from '@/components/index';
import { ScreenHeaderActions } from '@/components/ui';
import { FloatingActionButton } from '@/components/ui/Button';
import { MainBackButton } from '@/components/ui/Button';
import { IosAiStackToolbar } from '@/components/navigation/IosAiStackToolbar';
import { TAB_ROOT_TOP_SECTION_ROW_HEIGHT } from '@/components/navigation/TabRootTopSectionChrome';
import { USE_CUSTOM_LIQUID_TAB_BAR, fabChromeZoneStyle } from '@/components/navigation/tabBarChrome';
import {
  ChatContainer,
  ChatComposerSuggestions,
  AiEmptyStateIntro,
  AiEmptyStateIntroBackground,
  AiAssistantResponseShell,
  AiSessionProposalList,
  AiSessionProposalFooter,
  pickRandomAiGreeting,
  pickRandomAiHint,
} from '@/components/features/ai';
import { AI_EMPTY_STATE_GREETING_FADE_MS } from '@/components/features/ai/aiEmptyStateIntroTokens';
import {
  getChatComposerMaxExpandedTextSectionHeight,
  CHAT_COMPOSER_LAYOUT_EASING,
  CHAT_SESSION_TRANSITION_MS,
  CHAT_COMPOSER_ANCHOR_HORIZONTAL_INSET,
  CHAT_SESSION_ANCHOR_HORIZONTAL_INSET,
  CHAT_COMPOSER_COLLAPSED_HEIGHT_ESTIMATE,
  CHAT_COMPOSER_HEADER_GAP,
  CHAT_SUBMITTED_SHELL_HEIGHT_ESTIMATE,
  CHAT_SESSION_RESPONSE_GAP,
  CHAT_SESSION_CONTENT_EXIT_FADE_MS,
  CHAT_SESSION_BLOCK_SPACING,
} from '@/components/features/ai/chatComposerUiTokens';
import { useKeyboardHeight } from '@/components/layout/ScreenLayout';
import { useTabFabOverlay } from '@/contexts/TabFabOverlayContext';
import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { useThemeColors, useBrandColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { useAiAssistant } from '@/hooks/useAiAssistant';
import { useUI, useTasks } from '@/store/hooks';
import { Paddings } from '@/constants/Paddings';
import { buildTaskQuickAddRouteParams } from '@/utils/taskQuickAddRouteParams';

const TAB_BAR_HEIGHT_FALLBACK = Platform.select({ ios: 49, android: 56, default: 49 });

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
  const { tasks } = useTasks();

  const {
    messages,
    isLoading,
    error,
    sendMessage,
    clearError,
    resetSession,
    confirmProposal,
    confirmAllProposals,
    dismissProposal,
    undoProposal,
    getProposalPayload,
    getProposalStatus,
    getProposalError,
    isConfirmingAll,
  } = useAiAssistant();

  const [screenPhase, setScreenPhase] = useState<AiScreenPhase>('prompt');
  const [isSessionMode, setIsSessionMode] = useState(false);
  const [isSessionTransitioning, setIsSessionTransitioning] = useState(false);
  const [isSessionReturningToGreeting, setIsSessionReturningToGreeting] = useState(false);
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
  // window Y of the bottom edge of the slid-up composer — positions response below it
  const [sessionComposerBottom, setSessionComposerBottom] = useState(0);
  // frozen when sliding back — stops reply/proposals chasing the composer down
  const [frozenSessionContentPaddingTop, setFrozenSessionContentPaddingTop] = useState<
    number | null
  >(null);
  // unmount reply/proposals after exit fade so they cannot flash when session tears down
  const [isSessionBodyVisible, setIsSessionBodyVisible] = useState(true);
  // gates proposal card reveals — flips true after reply words finish fading in
  const [replyWordsRevealComplete, setReplyWordsRevealComplete] = useState(false);

  const composerAnchorRef = useRef<View>(null);
  // 0 = greeting position, 1 = submitted shell at header
  const sessionProgress = useSharedValue(0);
  // fades reply + proposals quickly on back-to-greeting
  const sessionContentOpacity = useSharedValue(1);
  // translateY offset captured on send — negative moves the composer up toward the header
  const sessionSlideOffset = useSharedValue(0);
  // bottom inset frozen for the duration of the slide so keyboard dismiss does not drift the path
  const sessionAnchorBottom = useSharedValue(0);

  const keyboardHeight = useKeyboardHeight();
  // mirror js keyboard height on the ui thread for smooth bottom anchoring
  const keyboardHeightSv = useSharedValue(0);
  const restingComposerBottom = bottomPaddingAboveTabBar;
  const composerGap = Paddings.tabBarInputGap;

  const sessionTargetTop = insets.top + TAB_ROOT_TOP_SECTION_ROW_HEIGHT + 0;

  const composerBottomInset = Math.max(
    keyboardHeight + Paddings.tabBarInputGap,
    restingComposerBottom,
  );

  const aiHeaderBottomY = insets.top + TAB_ROOT_TOP_SECTION_ROW_HEIGHT + CHAT_COMPOSER_HEADER_GAP;

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
  const isKeyboardOpen = keyboardHeight > 0;
  const isSessionVisible = isSessionMode || isSessionTransitioning;

  const latestAssistantMessage = useMemo(
    () => [...messages].reverse().find((message) => message.role === 'assistant'),
    [messages],
  );

  const latestAssistantReply = latestAssistantMessage?.content ?? '';
  const latestAssistantProposals = latestAssistantMessage?.proposals ?? [];

  // reset proposal reveals whenever a new assistant message arrives
  useEffect(() => {
    setReplyWordsRevealComplete(false);
  }, [latestAssistantMessage?.id]);

  const handleReplyWordsRevealComplete = useCallback(() => {
    setReplyWordsRevealComplete(true);
  }, []);

  // proposals-only responses skip the word reveal — start proposal stagger immediately
  useEffect(() => {
    if (isLoading || !latestAssistantMessage) return;
    if (!latestAssistantReply.trim() && latestAssistantProposals.length > 0) {
      setReplyWordsRevealComplete(true);
    }
  }, [
    isLoading,
    latestAssistantMessage,
    latestAssistantReply,
    latestAssistantProposals.length,
  ]);

  // count proposals still waiting on user confirm — drives Accept All vs Start new footer
  const pendingProposalCount = useMemo(() => {
    if (!latestAssistantMessage?.proposals?.length) return 0;
    return latestAssistantMessage.proposals.filter((proposal) => {
      const status = getProposalStatus(latestAssistantMessage.id, proposal.id);
      return status === 'pending' || status === 'failed';
    }).length;
  }, [latestAssistantMessage, getProposalStatus]);

  const fallbackResponsePaddingTop =
    sessionTargetTop + CHAT_SUBMITTED_SHELL_HEIGHT_ESTIMATE + CHAT_SESSION_RESPONSE_GAP;
  const sessionResponsePaddingTop =
    frozenSessionContentPaddingTop ??
    (sessionComposerBottom > 0
      ? sessionComposerBottom + CHAT_SESSION_RESPONSE_GAP
      : fallbackResponsePaddingTop);

  const sessionContentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: sessionContentOpacity.value,
  }));

  const measureSessionComposerBottom = useCallback(() => {
    if (!isSessionVisible || isSessionReturningToGreeting) return;
    composerAnchorRef.current?.measureInWindow((_x, y, _width, height) => {
      setSessionComposerBottom(y + height);
    });
  }, [isSessionVisible, isSessionReturningToGreeting]);

  const handleComposerAnchorLayout = useCallback(
    (_event: LayoutChangeEvent) => {
      measureSessionComposerBottom();
    },
    [measureSessionComposerBottom],
  );

  useEffect(() => {
    if (!isSessionVisible) {
      setSessionComposerBottom(0);
      return undefined;
    }
    measureSessionComposerBottom();
    const measureId = setTimeout(measureSessionComposerBottom, CHAT_SESSION_TRANSITION_MS);
    return () => clearTimeout(measureId);
  }, [isSessionVisible, isSessionMode, submittedPrompt, measureSessionComposerBottom]);

  const keyboardHeightRef = useRef(keyboardHeight);
  keyboardHeightRef.current = keyboardHeight;

  useEffect(() => {
    keyboardHeightSv.value = withTiming(keyboardHeight, {
      duration: 250,
      easing: CHAT_COMPOSER_LAYOUT_EASING,
    });
  }, [keyboardHeight, keyboardHeightSv]);

  const composerPositionStyle = useAnimatedStyle(() => {
    const progress = sessionProgress.value;
    const liveBottom = Math.max(keyboardHeightSv.value + composerGap, restingComposerBottom);
    const bottom = progress > 0 ? sessionAnchorBottom.value : liveBottom;
    const horizontalInset = interpolate(
      progress,
      [0, 1],
      [CHAT_COMPOSER_ANCHOR_HORIZONTAL_INSET, CHAT_SESSION_ANCHOR_HORIZONTAL_INSET],
    );
    const translateY = interpolate(progress, [0, 1], [0, sessionSlideOffset.value]);

    return {
      bottom,
      left: horizontalInset,
      right: horizontalInset,
      transform: [{ translateY }],
    };
  }, [restingComposerBottom, composerGap]);

  const refreshIntroCopy = useCallback(() => {
    setGreeting(pickRandomAiGreeting());
    setHint(pickRandomAiHint());
  }, []);

  const finishSessionTransition = useCallback(() => {
    setIsSessionTransitioning(false);
    setIsSessionMode(true);
  }, []);

  const finishBackToPrompt = useCallback(() => {
    resetSession();
    setScreenPhase('prompt');
    setIsSessionMode(false);
    setIsSessionTransitioning(false);
    setIsSessionReturningToGreeting(false);
    setFrozenSessionContentPaddingTop(null);
    setIsSessionBodyVisible(true);
    setReplyWordsRevealComplete(false);
    setPrompt('');
    setSubmittedPrompt('');
    refreshIntroCopy();
    setEmptyIntroOnScreen(true);
    setIntroRunKey((key) => key + 1);
    clearError();
  }, [resetSession, refreshIntroCopy, clearError]);

  const startSessionSlide = useCallback(
    (measuredTop: number) => {
      sessionAnchorBottom.value = Math.max(
        keyboardHeightRef.current + composerGap,
        restingComposerBottom,
      );
      sessionSlideOffset.value = sessionTargetTop - measuredTop;
      sessionProgress.value = withTiming(
        1,
        {
          duration: CHAT_SESSION_TRANSITION_MS,
          easing: CHAT_COMPOSER_LAYOUT_EASING,
        },
        (finished) => {
          if (finished) {
            runOnJS(finishSessionTransition)();
          }
        },
      );
    },
    [
      sessionSlideOffset,
      sessionAnchorBottom,
      sessionTargetTop,
      sessionProgress,
      finishSessionTransition,
      composerGap,
      restingComposerBottom,
    ],
  );

  const hideSessionBodyAfterExitFade = useCallback(() => {
    setIsSessionBodyVisible(false);
  }, []);

  const handleBackToPrompt = useCallback(() => {
    if (sessionProgress.value <= 0) {
      finishBackToPrompt();
      return;
    }

    Keyboard.dismiss();
    setIsSessionMode(false);
    setIsSessionReturningToGreeting(true);
    setIsSessionTransitioning(true);

    // lock scroll inset + fade session body — composer slides alone back to greeting
    setFrozenSessionContentPaddingTop(
      sessionComposerBottom > 0
        ? sessionComposerBottom + CHAT_SESSION_RESPONSE_GAP
        : fallbackResponsePaddingTop,
    );
    sessionContentOpacity.value = withTiming(
      0,
      {
        duration: CHAT_SESSION_CONTENT_EXIT_FADE_MS,
        easing: CHAT_COMPOSER_LAYOUT_EASING,
      },
      (finished) => {
        if (finished) {
          runOnJS(hideSessionBodyAfterExitFade)();
        }
      },
    );

    const startBackSlide = (currentTop: number) => {
      const restingBaseTop =
        windowHeight - restingComposerBottom - CHAT_COMPOSER_COLLAPSED_HEIGHT_ESTIMATE;
      sessionAnchorBottom.value = restingComposerBottom;
      sessionSlideOffset.value = currentTop - restingBaseTop;

      sessionProgress.value = withTiming(
        0,
        {
          duration: CHAT_SESSION_TRANSITION_MS,
          easing: CHAT_COMPOSER_LAYOUT_EASING,
        },
        (finished) => {
          if (finished) {
            runOnJS(finishBackToPrompt)();
          }
        },
      );
    };

    if (composerAnchorRef.current) {
      composerAnchorRef.current.measureInWindow((_x, y) => {
        startBackSlide(y);
      });
    } else {
      startBackSlide(sessionTargetTop);
    }
  }, [
    sessionProgress,
    sessionAnchorBottom,
    sessionSlideOffset,
    finishBackToPrompt,
    windowHeight,
    restingComposerBottom,
    sessionTargetTop,
    sessionComposerBottom,
    fallbackResponsePaddingTop,
    sessionContentOpacity,
    hideSessionBodyAfterExitFade,
  ]);

  const handleConfirmProposal = useCallback(
    (proposal: (typeof latestAssistantProposals)[number]) => {
      if (!latestAssistantMessage) return;
      void confirmProposal(latestAssistantMessage.id, proposal);
    },
    [latestAssistantMessage, confirmProposal],
  );

  const handleDismissProposal = useCallback(
    (proposalId: string) => {
      if (!latestAssistantMessage) return;
      dismissProposal(latestAssistantMessage.id, proposalId);
    },
    [latestAssistantMessage, dismissProposal],
  );

  const handleUndoProposal = useCallback(
    (proposal: (typeof latestAssistantProposals)[number]) => {
      if (!latestAssistantMessage) return;
      void undoProposal(latestAssistantMessage.id, proposal);
    },
    [latestAssistantMessage, undoProposal],
  );

  const handleFooterPress = useCallback(() => {
    if (!latestAssistantMessage) return;
    if (pendingProposalCount > 0) {
      void confirmAllProposals(latestAssistantMessage.id);
      return;
    }
    handleBackToPrompt();
  }, [latestAssistantMessage, pendingProposalCount, confirmAllProposals, handleBackToPrompt]);

  const handleSend = useCallback(() => {
    const trimmed = prompt.trim();
    if (!trimmed || isLoading) return;

    setSubmittedPrompt(trimmed);
    setPrompt('');
    setScreenPhase('session');
    setIsSessionTransitioning(true);
    setIsSessionBodyVisible(true);
    setReplyWordsRevealComplete(false);
    sessionContentOpacity.value = 1;
    clearError();
    void sendMessage(trimmed);
    Keyboard.dismiss();

    const fallbackTop =
      windowHeight -
      Math.max(keyboardHeight + composerGap, restingComposerBottom) -
      CHAT_COMPOSER_COLLAPSED_HEIGHT_ESTIMATE;

    if (composerAnchorRef.current) {
      composerAnchorRef.current.measureInWindow((_x, y) => {
        startSessionSlide(y);
      });
    } else {
      startSessionSlide(fallbackTop);
    }
  }, [
    prompt,
    isLoading,
    sendMessage,
    clearError,
    startSessionSlide,
    windowHeight,
    keyboardHeight,
    composerGap,
    restingComposerBottom,
    sessionContentOpacity,
  ]);

  const handlePickSuggestion = useCallback((description: string) => {
    setPrompt(description);
    clearError();
  }, [clearError]);

  useEffect(() => {
    if (greeting && hint && isPromptPhase) {
      setEmptyIntroOnScreen(true);
    }
  }, [greeting, hint, isPromptPhase]);

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

  const resetLocalSessionState = useCallback(() => {
    sessionProgress.value = 0;
    sessionSlideOffset.value = 0;
    sessionAnchorBottom.value = 0;
    setScreenPhase('prompt');
    setIsSessionMode(false);
    setIsSessionTransitioning(false);
    setIsSessionReturningToGreeting(false);
    setPrompt('');
    setSubmittedPrompt('');
    setEmptyIntroOnScreen(false);
    setIntroBackgroundMounted(false);
    setIntroBackgroundHasAnimated(false);
    setIntroRunKey(0);
    setFrozenSessionContentPaddingTop(null);
    setIsSessionBodyVisible(true);
    sessionContentOpacity.value = 1;
  }, [sessionProgress, sessionSlideOffset, sessionAnchorBottom, sessionContentOpacity]);

  const { setTabFabRegistration } = useTabFabOverlay();
  useFocusEffect(
    useCallback(() => {
      refreshIntroCopy();
      setScreenPhase('prompt');
      setIsSessionMode(false);
      setIsSessionTransitioning(false);
      setIsSessionReturningToGreeting(false);
      setEmptyIntroOnScreen(true);
      setIntroBackgroundMounted(true);
      setIntroRunKey((key) => key + 1);
      sessionProgress.value = 0;
      sessionSlideOffset.value = 0;
      sessionAnchorBottom.value = 0;

      if (!USE_CUSTOM_LIQUID_TAB_BAR) {
        return () => {
          resetSession();
          resetLocalSessionState();
        };
      }
      setTabFabRegistration({
        onPress: () => pushQuickAddFromAiTab(router),
        accessibilityLabel: 'Add new task',
        accessibilityHint: 'Double tap to create a new task',
      });
      return () => {
        setTabFabRegistration(null);
        resetSession();
        resetLocalSessionState();
      };
    }, [router, setTabFabRegistration, refreshIntroCopy, resetSession, resetLocalSessionState]),
  );

  useEffect(() => {
    if (modals.createTask) {
      closeModal('createTask');
      pushQuickAddFromAiTab(router);
    }
  }, [modals.createTask, closeModal, router]);

  const openActivityLog = useCallback(() => {
    router.push('/activity-log' as any);
  }, [router]);

  const isComposerExpanded =
    prompt.length > 0 && isKeyboardOpen && !isSessionMode && !isSessionTransitioning;

  return (
    <>
      <IosAiStackToolbar
        showBack={screenPhase === 'session'}
        onBackPress={handleBackToPrompt}
      />
      <View style={{ flex: 1 }}>
        <View
          style={[styles.topSectionAnchor, { height: insets.top + TAB_ROOT_TOP_SECTION_ROW_HEIGHT }]}
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
                {isSessionVisible && isSessionBodyVisible ? (
                  <ScrollView
                    style={styles.sessionScroll}
                    contentContainerStyle={[
                      styles.sessionScrollContent,
                      {
                        paddingTop: sessionResponsePaddingTop,
                        paddingBottom: restingComposerBottom + Paddings.groupedListIconTextSpacing,
                      },
                    ]}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    pointerEvents={isSessionReturningToGreeting ? 'none' : 'auto'}
                  >
                    <Animated.View
                      style={[sessionContentAnimatedStyle, styles.sessionContentStack]}
                      pointerEvents={isSessionReturningToGreeting ? 'none' : 'auto'}
                    >
                      {error ? <Text style={styles.errorBanner}>{error}</Text> : null}
                      {isLoading || latestAssistantReply ? (
                        <AiAssistantResponseShell
                          content={latestAssistantReply}
                          isLoading={isLoading}
                          onWordsRevealComplete={handleReplyWordsRevealComplete}
                        />
                      ) : null}
                      {latestAssistantMessage && latestAssistantProposals.length > 0 ? (
                        <AiSessionProposalList
                          proposals={latestAssistantProposals}
                          tasks={tasks}
                          messageId={latestAssistantMessage.id}
                          getProposalStatus={getProposalStatus}
                          getProposalPayload={getProposalPayload}
                          getProposalError={getProposalError}
                          onConfirmProposal={handleConfirmProposal}
                          onDismissProposal={handleDismissProposal}
                          onUndoProposal={handleUndoProposal}
                          isConfirmingAll={isConfirmingAll}
                          revealProposals={replyWordsRevealComplete}
                        />
                      ) : null}
                      {!isLoading && latestAssistantMessage ? (
                        <AiSessionProposalFooter
                          mode={pendingProposalCount > 0 ? 'acceptAll' : 'startNew'}
                          onPress={handleFooterPress}
                          loading={isConfirmingAll}
                          disabled={isConfirmingAll}
                        />
                      ) : null}
                    </Animated.View>
                  </ScrollView>
                ) : (
                  <View style={styles.inner}>
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

                    <View style={styles.spacer} />
                  </View>
                )}
              </View>
            </TouchableWithoutFeedback>

            <Animated.View
              ref={composerAnchorRef}
              style={[styles.composerAnchor, composerPositionStyle]}
              onLayout={handleComposerAnchorLayout}
              pointerEvents="box-none"
            >
              <ChatComposerSuggestions
                activePrompt={prompt}
                isComposerExpanded={isComposerExpanded}
                sessionProgress={sessionProgress}
                isSessionMode={isSessionMode && !isSessionReturningToGreeting}
                isSessionTransitioning={isSessionTransitioning}
                isSessionReturningToGreeting={isSessionReturningToGreeting}
                onPickSuggestion={handlePickSuggestion}
              />
              <ChatContainer
                value={prompt}
                onChangeText={setPrompt}
                onSend={handleSend}
                isLoading={isLoading}
                isKeyboardVisible={isKeyboardOpen}
                isSessionTransitioning={isSessionTransitioning}
                isSessionReturningToGreeting={isSessionReturningToGreeting}
                maxExpandedTextSectionHeight={maxExpandedTextSectionHeight}
                sessionProgress={sessionProgress}
                submittedText={submittedPrompt}
                isSessionMode={isSessionMode}
              />
            </Animated.View>
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
      height: TAB_ROOT_TOP_SECTION_ROW_HEIGHT,
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
      paddingTop: insets.top + TAB_ROOT_TOP_SECTION_ROW_HEIGHT + CHAT_COMPOSER_HEADER_GAP,
      paddingHorizontal: Paddings.screen,
    },
    sessionScroll: {
      flex: 1,
    },
    sessionScrollContent: {
      paddingHorizontal: CHAT_SESSION_ANCHOR_HORIZONTAL_INSET,
    },
    sessionContentStack: {
      gap: CHAT_SESSION_BLOCK_SPACING,
    },
    composerAnchor: {
      position: 'absolute',
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
      marginBottom: 8,
      padding: 10,
      borderRadius: 10,
      backgroundColor: themeColors.background.primarySecondaryBlend(),
    },
    spacer: {
      flex: 1,
    },
  });
