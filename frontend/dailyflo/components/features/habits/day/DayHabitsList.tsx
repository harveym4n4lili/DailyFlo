/**
 * habits due on a calendar day — simplified HabitCard list for planner/today segment pills.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Animated from 'react-native-reanimated';

import { HabitCard } from '../list/HabitCard';
import { LAYOUT_TRANSITION_SPRING } from '@/constants/LayoutTransitions';
import { Paddings } from '@/constants/Paddings';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import type { HabitForCalendarDay } from '@/utils/habitSchedule';

type DayHabitsListProps = {
  dayKey: string;
  habits: HabitForCalendarDay[];
  isToday: boolean;
  isLoading?: boolean;
  onOpenDetail: (habitId: string) => void;
  paddingHorizontal?: number;
  embeddedInParentScroll?: boolean;
  /** top inset when embedded — defaults to listItemVertical */
  embeddedContentTopPadding?: number;
};

export function DayHabitsList({
  dayKey,
  habits,
  isToday,
  isLoading = false,
  onOpenDetail,
  paddingHorizontal = Paddings.screen,
  embeddedInParentScroll = false,
  embeddedContentTopPadding,
}: DayHabitsListProps) {
  const themeColors = useThemeColors();
  const typography = useTypography();
  const styles = useMemo(
    () =>
      createStyles(
        themeColors,
        typography,
        paddingHorizontal,
        embeddedInParentScroll,
        embeddedContentTopPadding,
      ),
    [themeColors, typography, paddingHorizontal, embeddedInParentScroll, embeddedContentTopPadding],
  );

  if (isLoading && habits.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={themeColors.text.secondary()} />
      </View>
    );
  }

  if (habits.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyText}>
          {isToday ? 'No habits due today.' : 'No habits due on this date.'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.list} key={`habits-${dayKey}`}>
      {habits.map((row) => (
        <Animated.View key={row.item.id} layout={LAYOUT_TRANSITION_SPRING}>
          <HabitCard
            defaultVariant="simplified"
            showVariantToggle={false}
            title={row.item.title}
            color={row.item.color}
            currentStreak={row.item.currentStreak}
            heatmap={row.item.heatmap}
            habit={row.canIncrement ? row.item : undefined}
            readOnlyDayProgress={row.canIncrement ? undefined : row.readOnlyProgress ?? undefined}
            isHistoricalDay={!isToday}
            onPress={() => onOpenDetail(row.item.id)}
          />
        </Animated.View>
      ))}
    </View>
  );
}

const createStyles = (
  themeColors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useTypography>,
  paddingHorizontal: number,
  embeddedInParentScroll: boolean,
  embeddedContentTopPadding?: number,
) =>
  StyleSheet.create({
    list: {
      gap: Paddings.screen,
      paddingHorizontal,
      paddingTop: embeddedInParentScroll
        ? (embeddedContentTopPadding ?? Paddings.listItemVertical)
        : 0,
      paddingBottom: embeddedInParentScroll ? Paddings.section : Paddings.screen,
    },
    centered: {
      paddingVertical: Paddings.section,
      alignItems: 'center',
      paddingHorizontal,
    },
    emptyWrap: {
      paddingVertical: Paddings.sectionCompact,
      paddingHorizontal,
      alignItems: 'center',
    },
    emptyText: {
      ...typography.getTextStyle('body-medium'),
      color: themeColors.text.secondary(),
      textAlign: 'center',
    },
  });
