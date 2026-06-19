/**
 * habit card — same liquid-glass shell as the browse gamification board.
 * header: habit title (heading-4) + streak counter top-right; body: heatmap.
 */

import React, { useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';

import { Checkbox } from '@/components/ui/Button';
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
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { Paddings } from '@/constants/Paddings';
import { getTaskColorValue, getTaskHabitTitleColor } from '@/utils/taskColors';
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
  /** when set, renders today's log controls below the graph */
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

  const accent = useMemo(() => getTaskColorValue(color), [color]);
  const titleColor = useMemo(() => getTaskHabitTitleColor(color), [color]);
  const streakCounterStyle = getProgressBoardStreakCounterTextStyle();
  const streakUnitStyle = getProgressBoardStreakUnitTextStyle();
  const streakNumberLabel = formatProgressBoardStreakNumber(currentStreak);
  const streakUnitLabel = getProgressBoardStreakUnitLabel(currentStreak);
  const streakCountColor = themeColors.interactive.active();

  const styles = useMemo(
    () => createStyles(typography, accent, streakCounterStyle, streakUnitStyle),
    [typography, accent, streakCounterStyle, streakUnitStyle],
  );

  const handleBinaryPress = useCallback(() => {
    if (!habit) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    snapshotRef.current = { ...habit };
    const wasCompleteBefore = habit.isCompleteToday;
    dispatch(optimisticLogHabit({ id: habit.id }));
    void dispatch(logHabitProgress({ id: habit.id, wasCompleteBefore }))
      .unwrap()
      .catch(() => {
        if (snapshotRef.current) {
          dispatch(revertOptimisticLog({ id: habit.id, snapshot: snapshotRef.current }));
        }
      });
  }, [dispatch, habit]);

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

  const numericLabel =
    habit?.trackingType === 'numeric'
      ? `${Math.round(habit.loggedValue)}/${habit.targetValue ?? 1}${habit.unitLabel ? ` ${habit.unitLabel}` : ''}`
      : null;

  const showTodayActions = Boolean(habit);

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
        <Pressable
          onPress={onPress}
          disabled={!onPress}
          style={({ pressed }) => [styles.content, pressed && onPress ? styles.contentPressed : null]}
        >
          <View style={styles.headerRow}>
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
            <View style={styles.streakCounter} accessibilityLabel={`${currentStreak} day streak`}>
              <Text style={[styles.streakNumber, { color: streakCountColor }]}>{streakNumberLabel}</Text>
              <Text style={[styles.streakUnit, { color: streakCountColor }]}>{streakUnitLabel}</Text>
            </View>
          </View>

          <View style={styles.graphWrap}>
            <HabitHeatmap heatmap={heatmap} color={color} />
          </View>
        </Pressable>

        {showTodayActions ? (
          <View style={styles.todayRow}>
            {habit!.trackingType === 'binary' ? (
              <Checkbox checked={habit!.isCompleteToday} onPress={handleBinaryPress} expandTapArea />
            ) : (
              <Pressable
                onPress={handleIncrement}
                style={styles.incrementButton}
                accessibilityLabel={
                  habit!.isCompleteToday
                    ? `Reset today's count for ${title}`
                    : `Add one to ${title}`
                }
              >
                <Text style={styles.incrementText}>+1</Text>
              </Pressable>
            )}
            <View style={styles.todayMeta}>
              <Text style={[styles.todayLabel, { color: themeColors.text.primary() }]}>Today</Text>
              {numericLabel ? (
                <Text style={[styles.todayProgress, { color: themeColors.text.secondary() }]}>
                  {numericLabel}
                </Text>
              ) : null}
            </View>
          </View>
        ) : null}
      </GroupedList>
    </ProgressBoardGlassShell>
  );
}

const createStyles = (
  typography: ReturnType<typeof useTypography>,
  accent: string,
  streakCounterStyle: ReturnType<typeof getProgressBoardStreakCounterTextStyle>,
  streakUnitStyle: ReturnType<typeof getProgressBoardStreakUnitTextStyle>,
) =>
  StyleSheet.create({
    content: {
      gap: Paddings.formDataPillRowGap,
    },
    contentPressed: {
      opacity: 0.92,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 12,
    },
    title: {
      ...typography.getTextStyle('heading-4'),
      flex: 1,
      minWidth: 0,
    },
    titleDone: {
      opacity: 0.55,
      textDecorationLine: 'line-through',
    },
    streakCounter: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 4,
      flexShrink: 0,
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
    todayRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    todayMeta: {
      flex: 1,
      minWidth: 0,
    },
    todayLabel: {
      ...typography.getTextStyle('body-medium'),
    },
    todayProgress: {
      ...typography.getTextStyle('body-small'),
      marginTop: 2,
    },
    incrementButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 1.5,
      borderColor: accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    incrementText: {
      ...typography.getTextStyle('body-medium'),
      color: accent,
      fontWeight: '600',
    },
  });
