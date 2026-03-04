/**
 * TaskCardContent Component
 * 
 * Displays the main content area of a task card, including the task icon and title.
 * Handles press interactions and applies completion styling when the task is completed.
 * 
 * This component is used by TaskCard to display the core task information.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, interpolateColor, type SharedValue } from 'react-native-reanimated';
import { Task } from '@/types';

// line data from Text onTextLayout - x, y, width, height per line (max 2 lines for task title)
type TextLineLayout = { x: number; y: number; width: number; height: number };

import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { formatTimeRange } from '@/utils/taskFormatters';
import { CHECKBOX_STRIKETHROUGH_ANIMATION_MS } from '@/constants/Checkbox';

// Animated.Text supports useAnimatedStyle for animating color (driven by strikeProgress)
const AnimatedText = Animated.createAnimatedComponent(Text);

interface TaskCardContentProps {
  // task data to display
  task: Task;
  // task color value (hex string) - not used but kept for consistency
  taskColor: string;
  // whether to use compact layout - not used but kept for consistency
  compact?: boolean;
}

/** single strikethrough line for one text line - animates width left-to-right, positioned at line's vertical center */
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
      style={[
        lineStyle,
        { left: line.x, top: line.y + line.height / 2 - 1 },
        animatedStyle,
      ]}
      pointerEvents="none"
    />
  );
}

/**
 * TaskCardContent Component
 * 
 * Renders the main content area with icon and title. Applies completion styling
 * when the task is completed (strikethrough, dimmed color).
 * 
 * Note: Press handling is done by the parent TouchableOpacity, so this component
 * is just a View to avoid nested pressables.
 */
export default function TaskCardContent({
  task,
  taskColor,
  compact = false,
}: TaskCardContentProps) {
  const themeColors = useThemeColors();
  const typography = useTypography();

  // stores layout of each line from onTextLayout - each line gets its own strikethrough (max 2 lines)
  const [lines, setLines] = useState<TextLineLayout[]>([]);

  // reanimated shared value: 0 = no strikethrough, 1 = full strikethrough (drives left-to-right animation per line)
  const strikeProgress = useSharedValue(task.isCompleted ? 1 : 0);

  // when task completion changes, animate the strikethrough progress (reanimated runs on native thread for smooth 60fps)
  useEffect(() => {
    if (task.isCompleted) {
      strikeProgress.value = withTiming(1, { duration: CHECKBOX_STRIKETHROUGH_ANIMATION_MS, easing: Easing.out(Easing.cubic) });
    } else {
      strikeProgress.value = withTiming(0, { duration: 250, easing: Easing.in(Easing.cubic) });
    }
  }, [task.isCompleted]);

  // onTextLayout provides x, y, width, height for each rendered line - used to position strikethrough per line
  const handleTextLayout = (e: { nativeEvent: { lines: TextLineLayout[] } }) => {
    setLines(e.nativeEvent.lines ?? []);
  };

  // animate title color from primary to secondary (dimmed) as strikeProgress goes 0→1 - syncs with strikethrough
  const primaryColor = themeColors.text.primary();
  const secondaryColor = themeColors.text.secondary();
  const titleAnimatedStyle = useAnimatedStyle(() => ({
    color: interpolateColor(strikeProgress.value, [0, 1], [primaryColor, secondaryColor]),
  }));

  // create dynamic styles using theme colors and typography
  const styles = createStyles(themeColors, typography);

  // format time label - shows time range if available
  const timeLabel = formatTimeRange(task.time, task.duration);

  return (
    <View style={styles.content}>
      {/* row container for title and time label */}
      <View style={styles.titleRow}>
        {/* outer wrapper - flex: 1 for row layout so time label stays right-aligned */}
        <View style={styles.titleWrapper}>
          {/* inner wrapper - alignSelf: flex-start sizes to text content; strikethrough per line via onTextLayout */}
          {/* marginTop on this wrapper so onTextLayout (0,0) aligns with strikethrough coordinate system */}
          <View style={[styles.titleTextWrapper, styles.titleTextWrapperWithMargin]}>
            {/* task title - color animates primary→secondary with strikeProgress; onTextLayout for per-line strikethrough */}
            {/* can display up to 2 lines with ellipsis if it reaches third line */}
            <AnimatedText
              style={[styles.title, titleAnimatedStyle]}
              numberOfLines={2} // limits title to 2 lines
              ellipsizeMode="tail" // adds ellipsis at end if text overflows
              onTextLayout={handleTextLayout}
            >
              {task.title}
            </AnimatedText>
            {/* one strikethrough per line - each animates left-to-right over its own line's character width */}
            {lines.map((line, index) => (
              <StrikethroughLine
                key={index}
                line={line}
                strikeProgress={strikeProgress}
                lineStyle={styles.strikethroughLine}
              />
            ))}
          </View>
        </View>

        {/* time label on the right - shows time range if available */}
        {timeLabel ? (
          <Text
            style={[
              styles.timeLabel,
              task.isCompleted && styles.completedTimeLabel, // dimmed color when completed
            ]}
            numberOfLines={1}
          >
            {timeLabel}
          </Text>
        ) : (
          <View style={styles.timeLabelPlaceholder} />
        )}
      </View>
    </View>
  );
}

// create dynamic styles using theme colors and typography
const createStyles = (
  themeColors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useTypography>
) => StyleSheet.create({
  // --- LAYOUT STYLES ---
  content: {
    flex: 1, // take available space
  },

  // row container for title and time label
  titleRow: {
    flexDirection: 'row', // horizontal layout for title and time label
    alignItems: 'center', // vertically center title and time label
    justifyContent: 'space-between', // space between title and time label
    gap: 12, // spacing between title and time label
  },

  // outer wrapper - flex: 1 so title area takes remaining space in row (time label stays right)
  titleWrapper: {
    flex: 1,
    flexShrink: 1,
  },

  // inner wrapper - alignSelf: flex-start shrinks to text content when short; maxWidth: 100% allows wrapping when long
  // this ensures strikethrough length = actual character width (short titles = short line, long titles = full block)
  titleTextWrapper: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    position: 'relative',
  },
  titleTextWrapperWithMargin: {
    marginTop: 1, // matches original title spacing; keeps onTextLayout coords aligned with strikethrough positioning
  },

  // base style for strikethrough - left/top set per-line by StrikethroughLine using onTextLayout data
  strikethroughLine: {
    position: 'absolute',
    height: 2,
    marginTop: 1, // offset strikethrough down for better alignment with text baseline
    backgroundColor: themeColors.text.secondary(),
    borderRadius: 1,
  },

  // completed time label styling
  completedTimeLabel: {
    color: themeColors.text.tertiary(), // dimmed color for completed
    opacity: 0.6, // additional dimming for completed tasks
  },

  // placeholder for time label when no time is available (maintains spacing)
  timeLabelPlaceholder: {
    width: 90, // same width as time label to maintain consistent layout
    flexShrink: 0, // prevent placeholder from shrinking
  },

  // --- TYPOGRAPHY STYLES ---
  // no flex: 1 so Text sizes to content - enables titleTextWrapper to measure actual character width
  title: {
    ...typography.getTextStyle('heading-4'),
    color: themeColors.text.primary(),
  },
  timeLabel: {
    ...typography.getTextStyle('body-medium'),
    color: themeColors.text.tertiary(),
    width: 90,
    textAlign: 'right',
    flexShrink: 0,
  },
});

