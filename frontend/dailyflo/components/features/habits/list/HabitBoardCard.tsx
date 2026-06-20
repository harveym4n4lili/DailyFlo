/**
 * habit card — same liquid-glass shell as the browse gamification board.
 * single grouped row: title + today's score + increment ring + heatmap (no inner separator).
 * only the ring increments today's score; title still opens detail when onPress is set.
 */

import React, { useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';

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
import { HabitProgressRing } from './HabitProgressRing';
import { getHabitIncrementDisplay } from './habitIncrementDisplay';
import { getHabitProgressRingColors } from './habitProgressRingColors';
import {
  HABIT_BOARD_PLUS_ICON_SIZE,
  HABIT_BOARD_PLUS_STROKE_WIDTH,
  HABIT_BOARD_RING_SIZE,
  HABIT_BOARD_RING_STROKE_WIDTH,
} from './habitBoardUiTokens';
import { Paddings } from '@/constants/Paddings';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { TIMELINE_TASK_META_GAP } from '@/components/features/timeline/timelineChrome';
import { getTaskHabitTitleColor } from '@/utils/taskColors';
import { useAppDispatch } from '@/store';
import {
  logHabitProgress,
  optimisticLogHabit,
  revertOptimisticLog,
} from '@/store/slices/habits/habitsSlice';
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
  const dispatch = useAppDispatch();
  const snapshotRef = useRef<HabitTodayItem | null>(null);

  const ringColors = useMemo(() => getHabitProgressRingColors(color), [color]);
  const titleColor = useMemo(() => getTaskHabitTitleColor(color), [color]);
  const streakCounterStyle = getProgressBoardStreakCounterTextStyle();
  const streakUnitStyle = getProgressBoardStreakUnitTextStyle();
  const streakNumberLabel = formatProgressBoardStreakNumber(currentStreak);
  const streakUnitLabel = getProgressBoardStreakUnitLabel(currentStreak);
  const streakCountColor = themeColors.interactive.active();

  const incrementDisplay = habit ? getHabitIncrementDisplay(habit) : null;

  const styles = useMemo(
    () => createStyles(typography, streakCounterStyle, streakUnitStyle),
    [typography, streakCounterStyle, streakUnitStyle],
  );

  const handleIncrement = useCallback(() => {
    if (!habit) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    snapshotRef.current = { ...habit };
    const wasCompleteBefore = habit.isCompleteToday;
    dispatch(optimisticLogHabit({ id: habit.id, delta: 1 }));
    void dispatch(logHabitProgress({ id: habit.id, delta: 1, wasCompleteBefore }))
      .unwrap()
      .catch(() => {
        if (snapshotRef.current) {
          dispatch(revertOptimisticLog({ id: habit.id, snapshot: snapshotRef.current }));
        }
      });
  }, [dispatch, habit]);

  const showTodayActions = Boolean(habit && incrementDisplay);

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
              <Text
                style={[
                  styles.title,
                  { color: titleColor },
                  habit?.isCompleteToday && styles.titleDone,
                ]}
                numberOfLines={2}
              >
                {title}
              </Text>
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
              <Pressable
                onPress={handleIncrement}
                style={({ pressed }) => [
                  styles.ringAction,
                  pressed && styles.ringActionPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={
                  habit!.isCompleteToday
                    ? `Today's progress ${incrementDisplay.current} of ${incrementDisplay.target}. Tap to reset.`
                    : `Today's progress ${incrementDisplay.current} of ${incrementDisplay.target}. Tap to add one.`
                }
              >
                <HabitProgressRing
                  current={incrementDisplay.current}
                  target={incrementDisplay.target}
                  color={ringColors.progress}
                  trackColor={ringColors.track}
                  iconColor={ringColors.icon}
                  size={HABIT_BOARD_RING_SIZE}
                  strokeWidth={HABIT_BOARD_RING_STROKE_WIDTH}
                  plusIconSize={HABIT_BOARD_PLUS_ICON_SIZE}
                  plusStrokeWidth={HABIT_BOARD_PLUS_STROKE_WIDTH}
                  showCenterLabel={false}
                  showCenterPlus
                />
              </Pressable>
            ) : (
              <View style={styles.streakCounter} accessibilityLabel={`${currentStreak} day streak`}>
                <Text style={[styles.streakNumber, { color: streakCountColor }]}>{streakNumberLabel}</Text>
                <Text style={[styles.streakUnit, { color: streakCountColor }]}>{streakUnitLabel}</Text>
              </View>
            )}
          </View>

          <View style={styles.graphWrap}>
            <HabitHeatmap heatmap={heatmap} color={color} />
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
    titleDone: {
      opacity: 0.55,
      textDecorationLine: 'line-through',
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
    ringActionPressed: {
      opacity: 0.88,
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
