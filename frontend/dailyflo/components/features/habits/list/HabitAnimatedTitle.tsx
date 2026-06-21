/**
 * habit title with animated strikethrough — same pattern as TaskCardContent.
 * on complete: title color eases to secondary + stroke lines grow left-to-right per text line.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, type StyleProp, type TextStyle } from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { getStrikethroughDuration, STRIKETHROUGH_MIN_MS } from '@/constants/Checkbox';
import { useThemeColors } from '@/hooks/useColorPalette';

type TextLineLayout = { x: number; y: number; width: number; height: number };

const AnimatedText = Animated.createAnimatedComponent(Text);

/** one strikethrough bar per title line — width animates with strikeProgress */
function StrikethroughLine({
  line,
  strikeProgress,
  lineStyle,
}: {
  line: TextLineLayout;
  strikeProgress: SharedValue<number>;
  lineStyle: object;
}) {
  const animatedStyle = useAnimatedStyle(() => ({
    width: line.width * strikeProgress.value,
  }));

  return (
    <Animated.View
      style={[lineStyle, { left: line.x, top: line.y + line.height / 2 - 1 }, animatedStyle]}
      pointerEvents="none"
    />
  );
}

type HabitAnimatedTitleProps = {
  title: string;
  /** today's goal reached — drives strikethrough + dimmed color */
  isComplete: boolean;
  /** habit accent when not complete */
  titleColor: string;
  textStyle: StyleProp<TextStyle>;
  numberOfLines?: number;
};

export function HabitAnimatedTitle({
  title,
  isComplete,
  titleColor,
  textStyle,
  numberOfLines = 2,
}: HabitAnimatedTitleProps) {
  const themeColors = useThemeColors();
  const [lines, setLines] = useState<TextLineLayout[]>([]);

  // 0 = no strike, 1 = full strike — same shared value pattern as task cards
  const strikeProgress = useSharedValue(isComplete ? 1 : 0);
  const completeColor = themeColors.text.secondary();

  useEffect(() => {
    if (isComplete) {
      const duration = lines.length ? getStrikethroughDuration(lines) : STRIKETHROUGH_MIN_MS;
      strikeProgress.value = withTiming(1, {
        duration,
        easing: Easing.inOut(Easing.cubic),
      });
      return;
    }

    strikeProgress.value = withTiming(0, {
      duration: 250,
      easing: Easing.in(Easing.cubic),
    });
  }, [isComplete, lines, strikeProgress]);

  const handleTextLayout = (e: { nativeEvent: { lines: TextLineLayout[] } }) => {
    setLines(e.nativeEvent.lines ?? []);
  };

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    color: interpolateColor(strikeProgress.value, [0, 1], [titleColor, completeColor]),
  }));

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrapper: {
          alignSelf: 'flex-start',
          maxWidth: '100%',
          position: 'relative',
          marginTop: 1,
        },
        strikethroughLine: {
          position: 'absolute',
          height: 2,
          marginTop: 1,
          backgroundColor: completeColor,
          borderRadius: 1,
        },
      }),
    [completeColor],
  );

  return (
    <View style={styles.wrapper}>
      <AnimatedText
        style={[textStyle, titleAnimatedStyle]}
        numberOfLines={numberOfLines}
        ellipsizeMode="tail"
        onTextLayout={handleTextLayout}
      >
        {title}
      </AnimatedText>
      {lines.map((line, index) => (
        <StrikethroughLine
          key={index}
          line={line}
          strikeProgress={strikeProgress}
          lineStyle={styles.strikethroughLine}
        />
      ))}
    </View>
  );
}
