/**
 * habit card — liquid-glass shell with two layouts:
 * - heatmap: ring + consistency grid (expanded)
 * - simplified: progress bar + increment icon slot, no heatmap (minimized)
 * tap the chevron row to switch forms; default comes from defaultVariant per section.
 */

import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { GroupedList } from '@/components/ui/List/GroupedList';
import { ProgressBoardGlassShell } from '@/components/features/gamification/browse/ProgressBoardGlassShell';
import {
  getProgressBoardStreakCounterTextStyle,
  getProgressBoardStreakUnitTextStyle,
} from '@/components/features/gamification/browse/progressBoardText';
import {
  formatProgressBoardStreakNumber,
  getProgressBoardStreakUnitLabel,
} from '@/components/features/gamification/browse/progressBoardTextValues';
import {
  PROGRESS_BOARD_CARD_BORDER_RADIUS,
  PROGRESS_BOARD_GROUPED_LIST_CONTENT_PADDING_HORIZONTAL,
} from '@/components/features/gamification/browse/progressBoardUiTokens';
import { LAYOUT_TRANSITION_SPRING } from '@/constants/LayoutTransitions';
import { HabitHeatmap } from '../detail/HabitHeatmap';
import { HabitAnimatedTitle } from './HabitAnimatedTitle';
import { HabitProgressRing } from './HabitProgressRing';
import { HabitProgressBar } from './HabitProgressBar';
import { HabitCardVariantToggle } from './HabitCardVariantToggle';
import { getHabitIncrementDisplay } from './habitIncrementDisplay';
import { getHabitProgressRingColors } from './habitProgressRingColors';
import {
  HABIT_CARD_PLUS_ICON_SIZE,
  HABIT_CARD_PLUS_STROKE_WIDTH,
  HABIT_CARD_RING_SIZE,
  HABIT_CARD_RING_STROKE_WIDTH,
  HABIT_CARD_TICK_ICON_SIZE,
  HABIT_CARD_BODY_TOP_GAP,
  HABIT_CARD_VARIANT_FADE_MS,
} from './habitCardUiTokens';
import { Paddings } from '@/constants/Paddings';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { TIMELINE_TASK_META_GAP } from '@/components/features/timeline/timelineChrome';
import { useHabitIncrementPress } from '@/hooks/useHabitIncrementPress';
import { getTaskHabitTitleColor } from '@/utils/taskColors';
import type {
  HabitColor,
  HabitHeatmapData,
  HabitTodayItem,
} from '@/types/api/habits';

export type HabitCardVariant = 'heatmap' | 'simplified';

export type HabitCardProps = {
  title: string;
  color: HabitColor;
  currentStreak: number;
  heatmap: HabitHeatmapData;
  /** starting layout — today's section uses heatmap, all habits uses simplified */
  defaultVariant?: HabitCardVariant;
  /** when false, hides the expand/minimize chevron row */
  showVariantToggle?: boolean;
  /** when set, renders today's log controls in the header */
  habit?: HabitTodayItem;
  onPress?: () => void;
};

export function HabitCard({
  title,
  color,
  currentStreak,
  heatmap,
  defaultVariant = 'heatmap',
  showVariantToggle = true,
  habit,
  onPress,
}: HabitCardProps) {
  const themeColors = useThemeColors();
  const typography = useTypography();
  const [variant, setVariant] = useState<HabitCardVariant>(defaultVariant);

  const ringColors = useMemo(() => getHabitProgressRingColors(color), [color]);
  const titleColor = useMemo(() => getTaskHabitTitleColor(color), [color]);
  const streakCounterStyle = getProgressBoardStreakCounterTextStyle();
  const streakUnitStyle = getProgressBoardStreakUnitTextStyle();
  const streakNumberLabel = formatProgressBoardStreakNumber(currentStreak);
  const streakUnitLabel = getProgressBoardStreakUnitLabel(currentStreak);
  const streakCountColor = themeColors.interactive.active();

  const { handleIncrement, displayHabit } = useHabitIncrementPress(habit, { heatmapBase: heatmap });

  const incrementDisplay = displayHabit ? getHabitIncrementDisplay(displayHabit) : null;
  const heatmapToShow = displayHabit?.heatmap ?? heatmap;
  const showTodayActions = Boolean(habit && incrementDisplay);
  const progressRatio =
    incrementDisplay && incrementDisplay.target > 0
      ? incrementDisplay.current / incrementDisplay.target
      : 0;
  const isHeatmapForm = variant === 'heatmap';

  const toggleVariant = useCallback(() => {
    setVariant((current) => (current === 'heatmap' ? 'simplified' : 'heatmap'));
  }, []);

  const styles = useMemo(
    () => createStyles(typography, streakCounterStyle, streakUnitStyle),
    [typography, streakCounterStyle, streakUnitStyle],
  );

  const incrementAccessibilityLabel =
    showTodayActions && incrementDisplay
      ? displayHabit!.isCompleteToday
        ? `Today's progress ${incrementDisplay.current} of ${incrementDisplay.target}. Tap to reset.`
        : `Today's progress ${incrementDisplay.current} of ${incrementDisplay.target}. Tap to add one.`
      : undefined;

  const incrementControl =
    showTodayActions && incrementDisplay ? (
      <HabitProgressRing
        onPress={handleIncrement}
        style={styles.actionSlot}
        accessibilityLabel={incrementAccessibilityLabel}
        current={incrementDisplay.current}
        target={incrementDisplay.target}
        isComplete={displayHabit!.isCompleteToday}
        color={ringColors.progress}
        trackColor={ringColors.track}
        iconColor={ringColors.icon}
        size={HABIT_CARD_RING_SIZE}
        strokeWidth={HABIT_CARD_RING_STROKE_WIDTH}
        plusIconSize={HABIT_CARD_PLUS_ICON_SIZE}
        plusStrokeWidth={HABIT_CARD_PLUS_STROKE_WIDTH}
        tickIconSize={HABIT_CARD_TICK_ICON_SIZE}
        showCenterLabel={false}
        showCenterPlus
        showRing={isHeatmapForm}
      />
    ) : (
      <View style={styles.streakCounter} accessibilityLabel={`${currentStreak} day streak`}>
        <Text style={[styles.streakNumber, { color: streakCountColor }]}>{streakNumberLabel}</Text>
        <Text style={[styles.streakUnit, { color: streakCountColor }]}>{streakUnitLabel}</Text>
      </View>
    );

  return (
    <Animated.View layout={LAYOUT_TRANSITION_SPRING} style={styles.cardShell}>
      <ProgressBoardGlassShell>
        <GroupedList
          backgroundColor={themeColors.background.primary()}
          borderRadius={PROGRESS_BOARD_CARD_BORDER_RADIUS}
          separatorVariant="solid"
          contentPaddingHorizontal={PROGRESS_BOARD_GROUPED_LIST_CONTENT_PADDING_HORIZONTAL}
          itemPadding="child"
          separatorInsetRight={PROGRESS_BOARD_GROUPED_LIST_CONTENT_PADDING_HORIZONTAL}
        >
          <View style={styles.cardContent}>
            <View style={styles.headerRow}>
              <Pressable
                onPress={onPress}
                disabled={!onPress}
                style={({ pressed }) => [
                  styles.titleBlock,
                  pressed && onPress ? styles.sectionPressed : null,
                ]}
              >
                <HabitAnimatedTitle
                  title={title}
                  isComplete={Boolean(displayHabit?.isCompleteToday)}
                  titleColor={titleColor}
                  textStyle={styles.title}
                  numberOfLines={2}
                />
                {incrementDisplay ? (
                  <Text style={styles.todayScore}>
                    <Text style={[styles.todayScore, { color: themeColors.text.tertiary() }]}>
                      Today&apos;s progress:{' '}
                    </Text>
                    <Text style={[styles.todayScore, { color: themeColors.text.secondary() }]}>
                      {incrementDisplay.scoreLabel}
                    </Text>
                  </Text>
                ) : null}
              </Pressable>

              {incrementControl}
            </View>

            <Animated.View layout={LAYOUT_TRANSITION_SPRING} style={styles.bodySection}>
              {isHeatmapForm ? (
                <Animated.View
                  key="habit-card-heatmap"
                  entering={FadeIn.duration(HABIT_CARD_VARIANT_FADE_MS)}
                  exiting={FadeOut.duration(HABIT_CARD_VARIANT_FADE_MS)}
                  style={styles.graphWrap}
                >
                  <HabitHeatmap heatmap={heatmapToShow} color={color} showLegend={false} />
                </Animated.View>
              ) : (
                <Animated.View
                  key="habit-card-bar"
                  entering={FadeIn.duration(HABIT_CARD_VARIANT_FADE_MS)}
                  exiting={FadeOut.duration(HABIT_CARD_VARIANT_FADE_MS)}
                  style={styles.progressBarWrap}
                >
                  <HabitProgressBar
                    progress={progressRatio}
                    fillColor={ringColors.progress}
                    trackColor={ringColors.track}
                  />
                </Animated.View>
              )}
            </Animated.View>

            {showVariantToggle ? (
              <Animated.View layout={LAYOUT_TRANSITION_SPRING}>
                <HabitCardVariantToggle variant={variant} onPress={toggleVariant} color={color} />
              </Animated.View>
            ) : null}
          </View>
        </GroupedList>
      </ProgressBoardGlassShell>
    </Animated.View>
  );
}

const createStyles = (
  typography: ReturnType<typeof useTypography>,
  streakCounterStyle: ReturnType<typeof getProgressBoardStreakCounterTextStyle>,
  streakUnitStyle: ReturnType<typeof getProgressBoardStreakUnitTextStyle>,
) =>
  StyleSheet.create({
    cardShell: {
      width: '100%',
    },
    sectionPressed: {
      opacity: 0.92,
    },
    cardContent: {
      width: '100%',
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    titleBlock: {
      flex: 1,
      minWidth: 0,
      gap: TIMELINE_TASK_META_GAP,
    },
    title: {
      ...typography.getTextStyle('heading-4'),
    },
    todayScore: {
      ...typography.getTextStyle('body-small'),
      fontVariant: ['tabular-nums'],
    },
    actionSlot: {
      width: HABIT_CARD_RING_SIZE,
      height: HABIT_CARD_RING_SIZE,
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
    streakCounter: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 4,
      flexShrink: 0,
      alignSelf: 'flex-start',
    },
    streakNumber: {
      ...streakCounterStyle,
    },
    streakUnit: {
      ...streakUnitStyle,
    },
    bodySection: {
      width: '100%',
      overflow: 'hidden',
    },
    graphWrap: {
      width: '100%',
      marginTop: HABIT_CARD_BODY_TOP_GAP,
    },
    progressBarWrap: {
      width: '100%',
      marginTop: HABIT_CARD_BODY_TOP_GAP,
    },
  });
