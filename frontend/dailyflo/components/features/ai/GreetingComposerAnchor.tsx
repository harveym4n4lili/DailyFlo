/**
 * bottom-anchored wrapper for greeting composer + suggestions.
 * keyboard follow runs on the ui thread (useAnimatedKeyboard) for ios-native lift.
 * send exit: slide up + fade — bottom freezes so dismiss does not fight the motion.
 * back: fade in at the resting anchor.
 */

import React, { useCallback } from 'react';
import { StyleSheet, type LayoutChangeEvent } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedKeyboard,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import {
  CHAT_COMPOSER_COLLAPSED_HEIGHT_ESTIMATE,
  CHAT_GREETING_EXIT_SLIDE_EXTRA,
} from './chatComposerUiTokens';
import { Paddings } from '@/constants/Paddings';

export type GreetingComposerAnchorProps = {
  restingBottom: number;
  /** 0 = visible, 1 = exit complete (slide up + fade) */
  exitProgress: SharedValue<number>;
  /** 0 = hidden, 1 = visible — fade in after back from session */
  enterOpacity: SharedValue<number>;
  children: React.ReactNode;
};

export function GreetingComposerAnchor({
  restingBottom,
  exitProgress,
  enterOpacity,
  children,
}: GreetingComposerAnchorProps) {
  const composerGap = Paddings.tabBarInputGap;
  const keyboard = useAnimatedKeyboard();
  const blockHeightSv = useSharedValue(CHAT_COMPOSER_COLLAPSED_HEIGHT_ESTIMATE);
  // frozen when send exit starts — stops keyboard dismiss from pulling the anchor down mid-slide
  const exitBottomSv = useSharedValue<number | null>(null);

  useAnimatedReaction(
    () => exitProgress.value,
    (progress, previous) => {
      const prev = previous ?? 0;
      if (prev <= 0 && progress > 0) {
        const liveBottom = Math.max(keyboard.height.value + composerGap, restingBottom);
        exitBottomSv.value = liveBottom;
        return;
      }
      if (progress <= 0) {
        exitBottomSv.value = null;
      }
    },
    [restingBottom, composerGap],
  );

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const height = event.nativeEvent.layout.height;
      if (height > 0) {
        blockHeightSv.value = height;
      }
    },
    [blockHeightSv],
  );

  const positionStyle = useAnimatedStyle(() => {
    const isExiting = exitProgress.value > 0;
    const liveBottom = Math.max(keyboard.height.value + composerGap, restingBottom);
    const bottom = isExiting && exitBottomSv.value != null ? exitBottomSv.value : liveBottom;

    const exitOpacity = interpolate(exitProgress.value, [0, 1], [1, 0]);
    const slideUp = interpolate(
      exitProgress.value,
      [0, 1],
      [0, -(blockHeightSv.value + CHAT_GREETING_EXIT_SLIDE_EXTRA)],
    );

    return {
      bottom,
      left: Paddings.groupedListHeaderContentGap,
      right: Paddings.groupedListHeaderContentGap,
      opacity: enterOpacity.value * exitOpacity,
      transform: [{ translateY: slideUp }],
    };
  }, [restingBottom, composerGap]);

  return (
    <Animated.View
      style={[styles.anchor, positionStyle]}
      onLayout={handleLayout}
      pointerEvents="box-none"
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  anchor: {
    position: 'absolute',
    zIndex: 2,
    overflow: 'visible',
  },
});
