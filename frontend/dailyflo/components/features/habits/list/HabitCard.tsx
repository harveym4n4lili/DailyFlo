/**
 * habit card — liquid-glass shell with two layouts:
 * - heatmap: ring + consistency grid (expanded)
 * - simplified: progress bar + increment icon slot, no heatmap (minimized)
 * tap anywhere except the form switch row or increment control to open habit detail.
 */

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, type LayoutChangeEvent } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

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
import { HabitProgressBar } from './HabitProgressBar';
import { HabitProgressScoreLabel } from './HabitProgressScoreLabel';
import { HabitCardVariantToggle } from './HabitCardVariantToggle';
import { getHabitIncrementDisplay, type HabitIncrementDisplay } from './habitIncrementDisplay';
import {
  formatHabitProgressAccessibilityLabel,
  resolveHabitProgressLabelVariant,
} from './habitProgressLabel';
import { getHabitProgressRingColors } from './habitProgressRingColors';
import {
  HABIT_CARD_PLUS_ICON_SIZE,
  HABIT_CARD_PLUS_STROKE_WIDTH,
  HABIT_CARD_RING_SIZE,
  HABIT_CARD_RING_STROKE_WIDTH,
  HABIT_CARD_TICK_ICON_SIZE,
  HABIT_CARD_BODY_TOP_GAP,
  HABIT_CARD_VARIANT_ENTERING,
  HABIT_CARD_VARIANT_TIMING_CONFIG,
  HABIT_CARD_VARIANT_TOGGLE_MARGIN_TOP,
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
  /** planner/today non-today days — show ring + bar without increment */
  readOnlyDayProgress?: HabitIncrementDisplay;
  /** past/future calendar day — completions label, neutral ring/bar, no title strike */
  isHistoricalDay?: boolean;
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
  readOnlyDayProgress,
  isHistoricalDay = false,
  onPress,
}: HabitCardProps) {
  const themeColors = useThemeColors();
  const typography = useTypography();
  const [variant, setVariant] = useState<HabitCardVariant>(defaultVariant);
  // bodyVariant can lag on collapse so body height shrinks before heatmap unmounts
  const [bodyVariant, setBodyVariant] = useState<HabitCardVariant>(defaultVariant);
  const footerHeight = useSharedValue(0);
  const hasInitialFooterHeightRef = useRef(false);
  const isCollapsingRef = useRef(false);
  const isExpandingRef = useRef(false);
  const footerHeightByVariant = useRef<Record<HabitCardVariant, number>>({
    heatmap: 0,
    simplified: 0,
  });

  const ringColors = useMemo(() => getHabitProgressRingColors(color), [color]);
  const titleColor = useMemo(() => getTaskHabitTitleColor(color), [color]);
  const streakCounterStyle = getProgressBoardStreakCounterTextStyle();
  const streakUnitStyle = getProgressBoardStreakUnitTextStyle();
  const streakNumberLabel = formatProgressBoardStreakNumber(currentStreak);
  const streakUnitLabel = getProgressBoardStreakUnitLabel(currentStreak);
  const streakCountColor = themeColors.interactive.active();

  const { handleIncrement, displayHabit } = useHabitIncrementPress(habit, { heatmapBase: heatmap });

  const incrementDisplay = displayHabit ? getHabitIncrementDisplay(displayHabit) : null;
  const readOnlyDisplay = readOnlyDayProgress ?? null;
  const activeProgressDisplay = incrementDisplay ?? readOnlyDisplay;
  const heatmapToShow = displayHabit?.heatmap ?? heatmap;
  const showTodayActions = Boolean(habit && incrementDisplay);
  const progressLabelVariant = resolveHabitProgressLabelVariant({
    isTodayInteractive: showTodayActions,
    isHistoricalDay,
  });
  // historical days still show the decorative ring slot but never fill arc or strike title
  const showHistoricalRing = Boolean(isHistoricalDay && readOnlyDisplay);
  const showReadOnlyRing = Boolean(!habit && readOnlyDisplay && !isHistoricalDay);
  const showDecorativeRing = showHistoricalRing || showReadOnlyRing;
  const progressRatio =
    showHistoricalRing
      ? 0
      : activeProgressDisplay && activeProgressDisplay.target > 0
        ? activeProgressDisplay.current / activeProgressDisplay.target
        : 0;
  const progressComplete =
    !isHistoricalDay &&
    activeProgressDisplay != null &&
    activeProgressDisplay.current >= activeProgressDisplay.target;
  const isHeatmapForm = variant === 'heatmap';
  const isHeatmapBody = bodyVariant === 'heatmap';

  const finishCollapse = useCallback(() => {
    isCollapsingRef.current = false;
    setBodyVariant('simplified');
  }, []);

  const finishExpand = useCallback(() => {
    isExpandingRef.current = false;
  }, []);

  const animateFooterHeight = useCallback(
    (targetHeight: number, onFinished?: () => void) => {
      footerHeight.value = withTiming(
        targetHeight,
        HABIT_CARD_VARIANT_TIMING_CONFIG,
        (finished) => {
          if (finished && onFinished) {
            runOnJS(onFinished)();
          }
        },
      );
    },
    [footerHeight],
  );

  const handleFooterLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const nextHeight = event.nativeEvent.layout.height;
      footerHeightByVariant.current[bodyVariant] = nextHeight;

      if (!hasInitialFooterHeightRef.current) {
        hasInitialFooterHeightRef.current = true;
        footerHeight.value = nextHeight;
        return;
      }

      if (isCollapsingRef.current) {
        return;
      }

      if (isExpandingRef.current) {
        if (Math.abs(nextHeight - footerHeight.value) > 1) {
          animateFooterHeight(nextHeight, finishExpand);
        }
        return;
      }

      animateFooterHeight(nextHeight);
    },
    [animateFooterHeight, bodyVariant, finishExpand, footerHeight],
  );

  const toggleVariant = useCallback(() => {
    if (variant === 'heatmap') {
      setVariant('simplified');
      const targetHeight = footerHeightByVariant.current.simplified;

      if (targetHeight > 0 && bodyVariant === 'heatmap') {
        isCollapsingRef.current = true;
        isExpandingRef.current = false;
        animateFooterHeight(targetHeight, finishCollapse);
        return;
      }

      setBodyVariant('simplified');
      return;
    }

    isCollapsingRef.current = false;
    setVariant('heatmap');
    setBodyVariant('heatmap');

    const targetHeight = footerHeightByVariant.current.heatmap;
    if (targetHeight > 0) {
      isExpandingRef.current = true;
      animateFooterHeight(targetHeight, finishExpand);
    }
  }, [animateFooterHeight, bodyVariant, finishCollapse, finishExpand, variant]);

  const animatedFooterStyle = useAnimatedStyle(() => ({
    height: footerHeight.value > 0 ? footerHeight.value : undefined,
    overflow: 'hidden',
  }));

  const styles = useMemo(
    () => createStyles(typography, streakCounterStyle, streakUnitStyle),
    [typography, streakCounterStyle, streakUnitStyle],
  );

  const incrementAccessibilityLabel =
    showTodayActions && incrementDisplay
      ? formatHabitProgressAccessibilityLabel(
          progressLabelVariant,
          incrementDisplay.current,
          incrementDisplay.target,
          displayHabit!.isCompleteToday ? 'tap-reset' : 'tap-add',
        )
      : undefined;

  const incrementControl =
    showTodayActions && incrementDisplay ? (
      // capture touches here so the card-wide detail press does not fire when logging progress
      <View
        style={styles.actionSlotWrap}
        onStartShouldSetResponder={() => true}
        onResponderTerminationRequest={() => false}
      >
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
      </View>
    ) : showDecorativeRing && readOnlyDisplay ? (
      <View style={styles.actionSlotWrap} pointerEvents="none">
        <HabitProgressRing
          style={styles.actionSlot}
          current={showHistoricalRing ? 0 : readOnlyDisplay.current}
          target={readOnlyDisplay.target}
          isComplete={showHistoricalRing ? false : progressComplete}
          color={ringColors.progress}
          trackColor={ringColors.track}
          iconColor={ringColors.icon}
          size={HABIT_CARD_RING_SIZE}
          strokeWidth={HABIT_CARD_RING_STROKE_WIDTH}
          showCenterLabel={false}
          showCenterPlus={false}
          showCenterDash={showHistoricalRing}
          showRing
        />
      </View>
    ) : (
      <View style={styles.streakCounter} accessibilityLabel={`${currentStreak} day streak`}>
        <Text style={[styles.streakNumber, { color: streakCountColor }]}>{streakNumberLabel}</Text>
        <Text style={[styles.streakUnit, { color: streakCountColor }]}>{streakUnitLabel}</Text>
      </View>
    );

  const cardInner = (
    <View style={styles.cardContent}>
      <View style={styles.headerRow}>
        <View style={styles.titleBlock}>
          <HabitAnimatedTitle
            title={title}
            isComplete={Boolean(displayHabit?.isCompleteToday ?? (progressComplete && !isHistoricalDay))}
            titleColor={titleColor}
            textStyle={styles.title}
            numberOfLines={2}
          />
          {activeProgressDisplay ? (
            <HabitProgressScoreLabel
              variant={progressLabelVariant}
              scoreLabel={activeProgressDisplay.scoreLabel}
              textStyle={styles.todayScore}
            />
          ) : null}
        </View>

        {incrementControl}
      </View>

      <Animated.View style={[styles.footerBlock, animatedFooterStyle]}>
        <View onLayout={handleFooterLayout} style={styles.footerInner}>
          <View style={styles.bodyClip}>
            {isHeatmapBody ? (
              <Animated.View
                key="habit-card-heatmap"
                entering={HABIT_CARD_VARIANT_ENTERING}
                style={styles.graphWrap}
              >
                <HabitHeatmap heatmap={heatmapToShow} color={color} showLegend={false} />
              </Animated.View>
            ) : (
              <Animated.View
                key="habit-card-bar"
                entering={HABIT_CARD_VARIANT_ENTERING}
                style={styles.progressBarWrap}
              >
                <HabitProgressBar
                  progress={progressRatio}
                  fillColor={ringColors.progress}
                  trackColor={ringColors.track}
                />
              </Animated.View>
            )}
          </View>

          {showVariantToggle ? (
            // capture touches on the form switch row so expand/minimize stays independent of detail navigation
            <View
              onStartShouldSetResponder={() => true}
              onResponderTerminationRequest={() => false}
            >
              <HabitCardVariantToggle
                variant={variant}
                displayVariant={bodyVariant}
                onPress={toggleVariant}
                color={color}
              />
            </View>
          ) : null}
        </View>
      </Animated.View>
    </View>
  );

  return (
    <View style={styles.cardShell}>
      <ProgressBoardGlassShell>
        <GroupedList
          backgroundColor={themeColors.background.primary()}
          borderRadius={PROGRESS_BOARD_CARD_BORDER_RADIUS}
          separatorVariant="solid"
          contentPaddingHorizontal={PROGRESS_BOARD_GROUPED_LIST_CONTENT_PADDING_HORIZONTAL}
          itemPadding="child"
          separatorInsetRight={PROGRESS_BOARD_GROUPED_LIST_CONTENT_PADDING_HORIZONTAL}
        >
          {onPress ? (
            <Pressable
              onPress={onPress}
              style={({ pressed }) => [
                styles.cardPressable,
                pressed ? styles.sectionPressed : null,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`View ${title} details`}
            >
              {cardInner}
            </Pressable>
          ) : (
            cardInner
          )}
        </GroupedList>
      </ProgressBoardGlassShell>
    </View>
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
    cardPressable: {
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
    actionSlotWrap: {
      flexShrink: 0,
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
    bodyClip: {
      width: '100%',
      overflow: 'hidden',
      paddingTop: HABIT_CARD_BODY_TOP_GAP,
    },
    footerBlock: {
      width: '100%',
      justifyContent: 'flex-end',
    },
    footerInner: {
      width: '100%',
      gap: HABIT_CARD_VARIANT_TOGGLE_MARGIN_TOP,
    },
    graphWrap: {
      width: '100%',
    },
    progressBarWrap: {
      width: '100%',
    },
  });
