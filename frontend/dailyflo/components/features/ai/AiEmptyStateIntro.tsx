/**
 * ai tab empty-state intro — greeting fades in, then hint types letter-by-letter.
 * greeting + hint fade out together when the user sends the first message.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Text, type TextStyle } from 'react-native';
import Animated, {
  FadeIn,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useBrandColors } from '@/hooks/useColorPalette';

import {
  AI_EMPTY_STATE_GREETING_FADE_MS,
  AI_EMPTY_STATE_GREETING_FADE_OUT_MS,
  AI_EMPTY_STATE_HINT_CHAR_DELAY_MS,
} from './aiEmptyStateIntroTokens';

/** ms for greeting fade — typewriter waits until this finishes */
const GREETING_FADE_MS = AI_EMPTY_STATE_GREETING_FADE_MS;

/** delay between each hint character */
const HINT_CHAR_DELAY_MS = AI_EMPTY_STATE_HINT_CHAR_DELAY_MS;

type AiEmptyStateIntroProps = {
  greeting: string;
  hint: string;
  greetingStyle: TextStyle;
  hintStyle: TextStyle;
  /** false triggers a shared fade-out on greeting + hint */
  visible: boolean;
  /** called after the fade-out finishes so the parent can unmount this block */
  onFadeOutComplete?: () => void;
};

/** reveals `fullText` one character at a time once `enabled` is true */
function useTypewriterText(fullText: string, enabled: boolean, charDelayMs: number) {
  const [visibleText, setVisibleText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!enabled || !fullText) {
      setVisibleText('');
      setIsTyping(false);
      return undefined;
    }

    setVisibleText('');
    setIsTyping(true);
    let index = 0;

    const intervalId = setInterval(() => {
      index += 1;
      setVisibleText(fullText.slice(0, index));
      if (index >= fullText.length) {
        clearInterval(intervalId);
        setIsTyping(false);
      }
    }, charDelayMs);

    return () => clearInterval(intervalId);
  }, [fullText, enabled, charDelayMs]);

  return { visibleText, isTyping };
}

export function AiEmptyStateIntro({
  greeting,
  hint,
  greetingStyle,
  hintStyle,
  visible,
  onFadeOutComplete,
}: AiEmptyStateIntroProps) {
  const { getMarpleBrandColor } = useBrandColors();
  // typing cursor matches marple brand — same accent as the greeting
  const cursorColor = useMemo(() => getMarpleBrandColor(500), [getMarpleBrandColor]);

  const introOpacity = useSharedValue(visible ? 1 : 0);

  // hint typing starts only after the greeting fade completes
  const [hintTypingEnabled, setHintTypingEnabled] = useState(false);

  useEffect(() => {
    setHintTypingEnabled(false);
    if (!visible) return undefined;
    const startHintTimer = setTimeout(() => setHintTypingEnabled(true), GREETING_FADE_MS);
    return () => clearTimeout(startHintTimer);
  }, [greeting, hint, visible]);

  useEffect(() => {
    if (visible) {
      introOpacity.value = 1;
      return;
    }

    introOpacity.value = withTiming(
      0,
      { duration: AI_EMPTY_STATE_GREETING_FADE_OUT_MS },
      (finished) => {
        if (finished && onFadeOutComplete) {
          runOnJS(onFadeOutComplete)();
        }
      },
    );
  }, [visible, introOpacity, onFadeOutComplete]);

  const { visibleText: typedHint, isTyping } = useTypewriterText(
    hint,
    hintTypingEnabled && visible,
    HINT_CHAR_DELAY_MS,
  );

  // show the full hint during fade-out so both lines disappear together
  const hintToShow = visible ? typedHint : hint;

  const introAnimatedStyle = useAnimatedStyle(() => ({
    opacity: introOpacity.value,
  }));

  return (
    <Animated.View style={introAnimatedStyle}>
      <Animated.Text entering={FadeIn.duration(GREETING_FADE_MS)} style={greetingStyle}>
        {greeting}
      </Animated.Text>
      {hint && (hintTypingEnabled || !visible) ? (
        <Text style={hintStyle} accessibilityLabel={hint}>
          {hintToShow}
          {visible && isTyping ? <Text style={{ color: cursorColor }}>|</Text> : null}
        </Text>
      ) : null}
    </Animated.View>
  );
}
