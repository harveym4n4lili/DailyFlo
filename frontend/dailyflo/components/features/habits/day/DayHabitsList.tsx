/**
 * habits due on a calendar day — simplified HabitCard list for planner/today segment pills.
 * list detail can pass listViewSections for collapsible Today + One-time groups (matches ListCard).
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Animated from 'react-native-reanimated';

import { HabitCard } from '../list/HabitCard';
import { HabitsCollapsibleSection } from '../tab/HabitsCollapsibleSection';
import { HABIT_SECTION_HEADER_CONTENT_GAP } from '../tab/habitSectionUiTokens';
import { LAYOUT_TRANSITION_SPRING } from '@/constants/LayoutTransitions';
import { Paddings } from '@/constants/Paddings';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import {
  LIST_GROUP_TODAY,
  ROUTINE_GROUP_ONE_TIME,
} from '@/utils/taskGrouping';
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
  /** browse list detail: Today above One-time, same section names as task ListCard */
  listViewSections?: {
    today: HabitForCalendarDay[];
    other: HabitForCalendarDay[];
  };
  emptyMessage?: string;
};

function HabitCardRow({
  row,
  isToday,
  onOpenDetail,
}: {
  row: HabitForCalendarDay;
  isToday: boolean;
  onOpenDetail: (habitId: string) => void;
}) {
  return (
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
  );
}

export function DayHabitsList({
  dayKey,
  habits,
  isToday,
  isLoading = false,
  onOpenDetail,
  paddingHorizontal = Paddings.screen,
  embeddedInParentScroll = false,
  embeddedContentTopPadding,
  listViewSections,
  emptyMessage,
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

  const sectionedToday = listViewSections?.today ?? [];
  const sectionedOther = listViewSections?.other ?? [];
  const sectionedTotal = sectionedToday.length + sectionedOther.length;
  const useListSections = listViewSections != null;

  if (isLoading && (useListSections ? sectionedTotal === 0 : habits.length === 0)) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={themeColors.text.secondary()} />
      </View>
    );
  }

  if (useListSections) {
    if (sectionedTotal === 0) {
      return (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>
            {emptyMessage ?? 'No habits in this list yet.'}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.list} key={`habits-list-sections-${dayKey}`}>
        {sectionedToday.length > 0 ? (
          <HabitsCollapsibleSection
            title={LIST_GROUP_TODAY}
            itemCount={sectionedToday.length}
            placement="first"
          >
            <View style={styles.sectionCards}>
              {sectionedToday.map((row) => (
                <HabitCardRow
                  key={row.item.id}
                  row={row}
                  isToday={isToday}
                  onOpenDetail={onOpenDetail}
                />
              ))}
            </View>
          </HabitsCollapsibleSection>
        ) : null}
        {sectionedOther.length > 0 ? (
          <HabitsCollapsibleSection
            title={ROUTINE_GROUP_ONE_TIME}
            itemCount={sectionedOther.length}
            placement={sectionedToday.length > 0 ? 'following' : 'first'}
          >
            <View style={styles.sectionCards}>
              {sectionedOther.map((row) => (
                <HabitCardRow
                  key={row.item.id}
                  row={row}
                  isToday={isToday}
                  onOpenDetail={onOpenDetail}
                />
              ))}
            </View>
          </HabitsCollapsibleSection>
        ) : null}
      </View>
    );
  }

  if (habits.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyText}>
          {emptyMessage ??
            (isToday ? 'No habits due today.' : 'No habits due on this date.')}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.list} key={`habits-${dayKey}`}>
      {habits.map((row) => (
        <HabitCardRow
          key={row.item.id}
          row={row}
          isToday={isToday}
          onOpenDetail={onOpenDetail}
        />
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
      gap: 0,
      paddingHorizontal,
      paddingTop: embeddedInParentScroll
        ? (embeddedContentTopPadding ?? Paddings.listItemVertical)
        : 0,
      paddingBottom: embeddedInParentScroll ? Paddings.section : Paddings.screen,
    },
    sectionCards: {
      gap: Paddings.screen,
      paddingTop: HABIT_SECTION_HEADER_CONTENT_GAP,
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
