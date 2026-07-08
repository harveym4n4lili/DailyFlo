/**
 * greeting ↔ session phase machine for the ai tab.
 * send: greeting composer slides up + fades → session scroll fades in.
 * back: fade session out → reset → fade greeting composer in.
 */

import { useCallback, useState } from 'react';
import { Keyboard } from 'react-native';
import { runOnJS, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import {
  CHAT_COMPOSER_LAYOUT_EASING,
  CHAT_COMPOSER_LAYOUT_TRANSITION_MS,
  CHAT_SESSION_CONTENT_EXIT_FADE_MS,
} from '@/components/features/ai/chatComposerUiTokens';

export type AiScreen = 'greeting' | 'session';

export type UseAiScreenTransitionOptions = {
  onSendPrompt: (trimmed: string) => void;
  onBackComplete: () => void;
};

export type UseAiScreenTransitionResult = {
  screen: AiScreen;
  isGreetingScreen: boolean;
  isSessionScreen: boolean;
  /** true while greeting composer is sliding up + fading out */
  isGreetingExiting: boolean;
  submittedPrompt: string;
  greetingExitProgress: SharedValue<number>;
  greetingEnterOpacity: SharedValue<number>;
  sessionContentOpacity: SharedValue<number>;
  startSend: (trimmedPrompt: string) => void;
  startBack: () => void;
  resetToGreeting: () => void;
};

export function useAiScreenTransition({
  onSendPrompt,
  onBackComplete,
}: UseAiScreenTransitionOptions): UseAiScreenTransitionResult {
  const [screen, setScreen] = useState<AiScreen>('greeting');
  const [submittedPrompt, setSubmittedPrompt] = useState('');
  const [isGreetingExiting, setIsGreetingExiting] = useState(false);

  const greetingExitProgress = useSharedValue(0);
  const greetingEnterOpacity = useSharedValue(1);
  const sessionContentOpacity = useSharedValue(1);

  const finishSendExit = useCallback(
    (trimmed: string) => {
      setIsGreetingExiting(false);
      setSubmittedPrompt(trimmed);
      setScreen('session');
      sessionContentOpacity.value = 0;
      sessionContentOpacity.value = withTiming(1, {
        duration: CHAT_COMPOSER_LAYOUT_TRANSITION_MS,
        easing: CHAT_COMPOSER_LAYOUT_EASING,
      });
      onSendPrompt(trimmed);
    },
    [onSendPrompt, sessionContentOpacity],
  );

  const startSend = useCallback(
    (trimmedPrompt: string) => {
      Keyboard.dismiss();
      setIsGreetingExiting(true);
      greetingExitProgress.value = withTiming(
        1,
        {
          duration: CHAT_COMPOSER_LAYOUT_TRANSITION_MS,
          easing: CHAT_COMPOSER_LAYOUT_EASING,
        },
        (finished) => {
          if (finished) {
            runOnJS(finishSendExit)(trimmedPrompt);
          }
        },
      );
    },
    [greetingExitProgress, finishSendExit],
  );

  const finishBackToGreeting = useCallback(() => {
    setScreen('greeting');
    setSubmittedPrompt('');
    greetingExitProgress.value = 0;
    greetingEnterOpacity.value = 0;
    greetingEnterOpacity.value = withTiming(1, {
      duration: CHAT_COMPOSER_LAYOUT_TRANSITION_MS,
      easing: CHAT_COMPOSER_LAYOUT_EASING,
    });
    sessionContentOpacity.value = 1;
    onBackComplete();
  }, [greetingExitProgress, greetingEnterOpacity, sessionContentOpacity, onBackComplete]);

  const startBack = useCallback(() => {
    if (screen === 'greeting') {
      finishBackToGreeting();
      return;
    }

    Keyboard.dismiss();
    sessionContentOpacity.value = withTiming(
      0,
      {
        duration: CHAT_SESSION_CONTENT_EXIT_FADE_MS,
        easing: CHAT_COMPOSER_LAYOUT_EASING,
      },
      (finished) => {
        if (finished) {
          runOnJS(finishBackToGreeting)();
        }
      },
    );
  }, [screen, sessionContentOpacity, finishBackToGreeting]);

  const resetToGreeting = useCallback(() => {
    setScreen('greeting');
    setSubmittedPrompt('');
    setIsGreetingExiting(false);
    greetingExitProgress.value = 0;
    greetingEnterOpacity.value = 1;
    sessionContentOpacity.value = 1;
  }, [greetingExitProgress, greetingEnterOpacity, sessionContentOpacity]);

  return {
    screen,
    isGreetingScreen: screen === 'greeting',
    isSessionScreen: screen === 'session',
    isGreetingExiting,
    submittedPrompt,
    greetingExitProgress,
    greetingEnterOpacity,
    sessionContentOpacity,
    startSend,
    startBack,
    resetToGreeting,
  };
}
