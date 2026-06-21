/**
 * habit card — same liquid-glass shell as the browse gamification board.
 * single grouped row: title + today's score + increment ring + heatmap (no inner separator).
 * only the ring increments today's score; title still opens detail when onPress is set.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

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
import { HabitHeatmap } from '../detail/HabitHeatmap';
import { HabitAnimatedTitle } from './HabitAnimatedTitle';
import { HabitProgressRing } from './HabitProgressRing';
import { getHabitIncrementDisplay } from './habitIncrementDisplay';
import { getHabitProgressRingColors } from './habitProgressRingColors';
import {
  HABIT_BOARD_PLUS_ICON_SIZE,
  HABIT_BOARD_PLUS_STROKE_WIDTH,
  HABIT_BOARD_RING_SIZE,
  HABIT_BOARD_RING_STROKE_WIDTH,
  HABIT_BOARD_TICK_ICON_SIZE,
} from './habitBoardUiTokens';
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

export type HabitBoardCardProps = {
  title: string;
  color: HabitColor;
  currentStreak: number;
  heatmap: HabitHeatmapData;
  /** when set, renders today's log controls in the header */
  habit?: HabitTodayItem;
  onPress?: () => void;
};

export function HabitBoardCard({
  title,
  color,
  currentStreak,
  heatmap,
  habit,
  onPress,
}: HabitBoardCardProps) {
  const themeColors = useThemeColors();
  const typography = useTypography();

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

  const styles = useMemo(
    () => createStyles(typography, streakCounterStyle, streakUnitStyle),
    [typography, streakCounterStyle, streakUnitStyle],
  );

  return (
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

            {showTodayActions && incrementDisplay ? (
              <HabitProgressRing
                onPress={handleIncrement}
                style={styles.ringAction}
                accessibilityLabel={
                  displayHabit!.isCompleteToday
                    ? `Today's progress ${incrementDisplay.current} of ${incrementDisplay.target}. Tap to reset.`
                    : `Today's progress ${incrementDisplay.current} of ${incrementDisplay.target}. Tap to add one.`
                }
                current={incrementDisplay.current}
                target={incrementDisplay.target}
                isComplete={displayHabit!.isCompleteToday}
                color={ringColors.progress}
                trackColor={ringColors.track}
                iconColor={ringColors.icon}
                size={HABIT_BOARD_RING_SIZE}
                strokeWidth={HABIT_BOARD_RING_STROKE_WIDTH}
                plusIconSize={HABIT_BOARD_PLUS_ICON_SIZE}
                plusStrokeWidth={HABIT_BOARD_PLUS_STROKE_WIDTH}
                tickIconSize={HABIT_BOARD_TICK_ICON_SIZE}
                showCenterLabel={false}
                showCenterPlus
              />
            ) : (
              <View style={styles.streakCounter} accessibilityLabel={`${currentStreak} day streak`}>
                <Text style={[styles.streakNumber, { color: streakCountColor }]}>{streakNumberLabel}</Text>
                <Text style={[styles.streakUnit, { color: streakCountColor }]}>{streakUnitLabel}</Text>
              </View>
            )}
          </View>

          <View style={styles.graphWrap}>
            <HabitHeatmap heatmap={heatmapToShow} color={color} />
          </View>
        </View>
      </GroupedList>
    </ProgressBoardGlassShell>
  );
}

const createStyles = (
  typography: ReturnType<typeof useTypography>,
  streakCounterStyle: ReturnType<typeof getProgressBoardStreakCounterTextStyle>,
  streakUnitStyle: ReturnType<typeof getProgressBoardStreakUnitTextStyle>,
) =>
  StyleSheet.create({
    sectionPressed: {
      opacity: 0.92,
    },
    cardContent: {
      width: '100%',
      gap: Paddings.listItemVertical,
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
    ringAction: {
      width: HABIT_BOARD_RING_SIZE,
      height: HABIT_BOARD_RING_SIZE,
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
    graphWrap: {
      width: '100%',
    },
  });
