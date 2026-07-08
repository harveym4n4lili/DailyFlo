/**
 * shared staggered fade-in slot for session blocks (proposal cards, footer pill, etc.)
 */

import React, { useEffect } from 'react';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import {
  CHAT_COMPOSER_LAYOUT_EASING,
  CHAT_SESSION_PROPOSAL_REVEAL_FADE_MS,
  CHAT_SESSION_PROPOSAL_REVEAL_STAGGER_MS,
} from './chatComposerUiTokens';

export type RevealSessionBlockProps = {
  revealIndex: number;
  canReveal: boolean;
  children: React.ReactNode;
  /** optional — fires when this block's fade-in finishes */
  onRevealComplete?: () => void;
};

export function RevealSessionBlock({
  revealIndex,
  canReveal,
  children,
  onRevealComplete,
}: RevealSessionBlockProps) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!canReveal) {
      opacity.value = 0;
      return;
    }

    opacity.value = withDelay(
      revealIndex * CHAT_SESSION_PROPOSAL_REVEAL_STAGGER_MS,
      withTiming(
        1,
        {
          duration: CHAT_SESSION_PROPOSAL_REVEAL_FADE_MS,
          easing: CHAT_COMPOSER_LAYOUT_EASING,
        },
        (finished) => {
          if (finished && onRevealComplete) {
            runOnJS(onRevealComplete)();
          }
        },
      ),
    );
  }, [canReveal, revealIndex, opacity, onRevealComplete]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={animatedStyle} pointerEvents={canReveal ? 'auto' : 'none'}>
      {children}
    </Animated.View>
  );
}
