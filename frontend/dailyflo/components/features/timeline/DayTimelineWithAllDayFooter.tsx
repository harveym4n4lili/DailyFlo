/**
 * Reusable day column: TimelineView (timed tasks) + ListCard footer (all-day tasks).
 * Shared by Planner (selected day) and Today (calendar today in timeline layout).
 */

import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedScrollHandler, type SharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import TimelineView from '@/components/features/timeline/TimelineView';
import {
  TimelinePlannerPillChrome,
  resolvePlannerAllDayTopSpacerHeight,
} from '@/components/features/timeline/TimelinePlannerPillChrome';
import { PlannerSegmentScroll } from '@/components/features/timeline/PlannerSegmentScroll';
import { DaySegmentPillBar } from '@/components/features/timeline/DaySegmentPillBar';
import { DayHabitsList } from '@/components/features/habits/day/DayHabitsList';
import { ListCard } from '@/components/ui/Card';
import { TodayBigScrollHeader } from '@/components/features/today/TodayBigScrollHeader';
import {
  TodayScrollPillBarFade,
  TodayStickyScrollPillOverlay,
  useTodayStickyScrollPillCrossfade,
} from '@/components/features/today/TodayStickyScrollPillChrome';
import { todayListScrollTopPadding, TODAY_TIMELINE_ROW_BELOW_PILLS_GAP } from '@/constants/todayScreenChrome';
import type { TimelineAllDayListDisplayProps } from '@/components/features/display/displayPreferenceMappers';
import type { HabitForCalendarDay } from '@/utils/habitSchedule';
import { Paddings } from '@/constants/Paddings';
import { LIST_CARD_TASK_ROW_PRESET_TODAY } from '@/constants/listCardTaskRowPreset';
import { ALL_DAY_PLANNER_INITIAL_COLLAPSED_TITLES, ALL_DAY_TASKS_GROUP_TITLE } from '@/utils/taskGrouping';
import type { Task } from '@/types';

/** planner pill bar: which full-screen segment is shown */
export type DayTimelineSegment = 'timeline' | 'allDay' | 'habits';

const PLANNER_TIMELINE_PILL_LABEL = 'Timeline';

export type DayTimelineHabitsSegment = {
  dayKey: string;
  habits: HabitForCalendarDay[];
  count: number;
  isToday: boolean;
  isLoading?: boolean;
  onOpenDetail: (habitId: string) => void;
};

export type DayTimelineWithAllDayFooterProps = {
  /** remount key when calendar day changes — resets segment + collapse state */
  dayKey: string;
  tasks: Task[];
  allDayListDisplayProps: TimelineAllDayListDisplayProps;
  hideCompletedOnTimeline?: boolean;
  onTaskTimeChange?: (taskId: string, newTime: string, newDuration?: number) => void;
  onTaskPress?: (task: Task) => void;
  onTaskComplete?: (task: Task, targetCompleted?: boolean) => void;
  onTaskEdit?: (task: Task) => void;
  onTaskDelete?: (task: Task) => void;
  selectionMode?: boolean;
  selectedTaskIds?: string[];
  onToggleTaskSelection?: (taskId: string) => void;
  plannerScheduleAnchors?: {
    wakeHHMM: string;
    sleepHHMM: string;
    dueDateIso: string | null;
  };
  startHour?: number;
  endHour?: number;
  scrollContentPaddingTop?: number;
  scrollContentPaddingBottom?: number;
  scrollPastTopInset?: boolean;
  scrollYSharedValue?: SharedValue<number>;
  showTodayBigHeader?: boolean;
  todayHeaderLabel?: string;
  emptyAllDayMessage?: string;
  allDayFooterKeyPrefix?: string;
  transparentTimelineBackground?: boolean;
  /** planner/today timeline: anchored pill bar + timeline / all-day / habits scroll areas */
  useAllDayPillBar?: boolean;
  habitsSegment?: DayTimelineHabitsSegment;
  /** pin segment pills below a fixed screen header (planner / legacy today) */
  pillBarTopInset?: number;
  /** today timeline: big title + scroll pills that lock under blur (matches today list) */
  useTodayStickyPillHeader?: boolean;
};

export function DayTimelineWithAllDayFooter({
  dayKey,
  tasks,
  allDayListDisplayProps,
  hideCompletedOnTimeline = false,
  onTaskTimeChange,
  onTaskPress,
  onTaskComplete,
  onTaskEdit,
  onTaskDelete,
  selectionMode = false,
  selectedTaskIds = [],
  onToggleTaskSelection,
  plannerScheduleAnchors,
  startHour,
  endHour,
  scrollContentPaddingTop,
  scrollContentPaddingBottom,
  scrollPastTopInset = false,
  scrollYSharedValue,
  showTodayBigHeader = false,
  todayHeaderLabel = 'Today',
  emptyAllDayMessage = 'No all-day tasks for this date.',
  allDayFooterKeyPrefix = 'day-allday',
  transparentTimelineBackground = false,
  useAllDayPillBar = false,
  habitsSegment,
  pillBarTopInset = 0,
  useTodayStickyPillHeader = false,
}: DayTimelineWithAllDayFooterProps) {
  const insets = useSafeAreaInsets();
  const stickyPillChrome = useTodayStickyScrollPillCrossfade(
    useTodayStickyPillHeader ? scrollYSharedValue : undefined,
  );
  const allDayTasks = useMemo(
    () => tasks.filter((task) => !task.time || task.time === ''),
    [tasks],
  );

  const visibleAllDayCount = useMemo(() => {
    if (!allDayListDisplayProps.hideCompletedTasks) return allDayTasks.length;
    return allDayTasks.filter((task) => !task.isCompleted).length;
  }, [allDayTasks, allDayListDisplayProps.hideCompletedTasks]);

  const allDayPillLabel = `${ALL_DAY_TASKS_GROUP_TITLE} (${visibleAllDayCount})`;
  const habitsCount = habitsSegment?.count ?? 0;
  const habitsPillLabel = `Habits (${habitsCount})`;

  const shouldShowAllDayFooter = useMemo(() => {
    if (!allDayListDisplayProps.showAllDayTasks || allDayTasks.length === 0) return false;
    if (!allDayListDisplayProps.hideCompletedTasks) return true;
    return allDayTasks.some((task) => !task.isCompleted);
  }, [
    allDayTasks,
    allDayListDisplayProps.hideCompletedTasks,
    allDayListDisplayProps.showAllDayTasks,
  ]);

  const showAllDayPill = shouldShowAllDayFooter && visibleAllDayCount > 0;
  const showHabitsPill = habitsCount > 0;

  const usePlannerSegmentSwitch =
    useAllDayPillBar && (showAllDayPill || showHabitsPill);

  const [plannerSegment, setPlannerSegment] = useState<DayTimelineSegment>('timeline');
  useEffect(() => {
    setPlannerSegment('timeline');
  }, [dayKey]);

  useEffect(() => {
    if (!useTodayStickyPillHeader || !scrollYSharedValue) return;
    scrollYSharedValue.value = 0;
  }, [plannerSegment, useTodayStickyPillHeader, scrollYSharedValue]);

  // pill-segment planner/today: TimelinePlannerPillChrome scroll spacer clears pills — never add timelineTopWhenAllDayHidden (56px) on top
  const timelineRowPaddingTop = usePlannerSegmentSwitch
    ? undefined
    : shouldShowAllDayFooter && !usePlannerSegmentSwitch
      ? undefined
      : !shouldShowAllDayFooter
        ? Paddings.timelineTopWhenAllDayHidden
        : undefined;

  const listCardSharedProps = useMemo(
    () => ({
      tasks: allDayTasks,
      selectionMode,
      selectedTaskIds,
      onToggleTaskSelection: selectionMode ? onToggleTaskSelection : undefined,
      hideCompletedTasks: allDayListDisplayProps.hideCompletedTasks,
      onTaskPress,
      onTaskComplete,
      onTaskEdit,
      onTaskDelete,
      ...LIST_CARD_TASK_ROW_PRESET_TODAY,
      emptyMessage: emptyAllDayMessage,
      loading: false as const,
      sortBy: allDayListDisplayProps.sortBy,
      sortDirection: allDayListDisplayProps.sortDirection,
      paddingHorizontal: Paddings.screen,
      paddingBottom: 8,
      disableInitialLayoutTransition: true,
    }),
    [
      allDayTasks,
      selectionMode,
      selectedTaskIds,
      onToggleTaskSelection,
      allDayListDisplayProps.hideCompletedTasks,
      allDayListDisplayProps.sortBy,
      allDayListDisplayProps.sortDirection,
      onTaskPress,
      onTaskComplete,
      onTaskEdit,
      onTaskDelete,
      emptyAllDayMessage,
    ],
  );

  const listCardKey = `${allDayFooterKeyPrefix}-${dayKey || 'unknown'}`;

  const segmentPills = useMemo(() => {
    const pills: { id: DayTimelineSegment; label: string; accessibilityLabel: string }[] = [
      {
        id: 'timeline',
        label: PLANNER_TIMELINE_PILL_LABEL,
        accessibilityLabel: 'Show timeline',
      },
    ];
    if (showAllDayPill) {
      pills.push({
        id: 'allDay',
        label: allDayPillLabel,
        accessibilityLabel: 'Show all-day tasks',
      });
    }
    if (showHabitsPill) {
      pills.push({
        id: 'habits',
        label: habitsPillLabel,
        accessibilityLabel: `Show habits, ${habitsCount} due`,
      });
    }
    return pills;
  }, [showAllDayPill, showHabitsPill, allDayPillLabel, habitsPillLabel, habitsCount]);

  const plannerPillBarScroll = useMemo(
    () => (
      <DaySegmentPillBar
        pills={segmentPills}
        selectedId={plannerSegment}
        onSelect={(id) => setPlannerSegment(id as DayTimelineSegment)}
        compactHeaderTop={useTodayStickyPillHeader}
        embeddedInListHeader={useTodayStickyPillHeader}
      />
    ),
    [segmentPills, plannerSegment, useTodayStickyPillHeader],
  );

  const plannerPillBarSticky = useMemo(
    () => (
      <DaySegmentPillBar
        pills={segmentPills}
        selectedId={plannerSegment}
        onSelect={(id) => setPlannerSegment(id as DayTimelineSegment)}
        compactHeaderTop={useTodayStickyPillHeader}
      />
    ),
    [segmentPills, plannerSegment, useTodayStickyPillHeader],
  );

  const allDayFooter = useMemo(() => {
    if (!shouldShowAllDayFooter) return undefined;

    if (usePlannerSegmentSwitch) {
      return undefined;
    }

    return (
      <View style={styles.allDayFooter}>
        <ListCard
          key={listCardKey}
          {...listCardSharedProps}
          initialCollapsedGroupTitles={ALL_DAY_PLANNER_INITIAL_COLLAPSED_TITLES}
          groupBy="allDay"
          scrollEnabled={false}
        />
      </View>
    );
  }, [shouldShowAllDayFooter, usePlannerSegmentSwitch, listCardKey, listCardSharedProps]);

  const todayHeader = useMemo(() => {
    if (!showTodayBigHeader || !scrollYSharedValue) return null;
    return <TodayBigScrollHeader scrollY={scrollYSharedValue} label={todayHeaderLabel} />;
  }, [showTodayBigHeader, scrollYSharedValue, todayHeaderLabel]);

  const scrollPills = useMemo(
    () => (
      <TodayScrollPillBarFade scrollYSharedValue={scrollYSharedValue} pillsStuck={stickyPillChrome.pillsStuck}>
        {plannerPillBarScroll}
      </TodayScrollPillBarFade>
    ),
    [scrollYSharedValue, stickyPillChrome.pillsStuck, plannerPillBarScroll],
  );

  const todayScrollHeader = useMemo(
    () => (
      <>
        {todayHeader}
        {scrollPills}
      </>
    ),
    [todayHeader, scrollPills],
  );

  const todayStickyScrollPaddingTop = insets.top + todayListScrollTopPadding();

  const segmentScrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      if (scrollYSharedValue) {
        scrollYSharedValue.value = event.contentOffset.y;
      }
    },
  });

  const scrollBottomInset =
    scrollContentPaddingBottom !== undefined
      ? Paddings.timelineScrollBottom + scrollContentPaddingBottom
      : Paddings.timelineScrollBottom;

  const scrollContentInsetTop = scrollPastTopInset ? insets.top : 0;

  const resolveSegmentTopSpacer = (timelineSpacerHeight: number) =>
    resolvePlannerAllDayTopSpacerHeight(timelineSpacerHeight) +
    (scrollPastTopInset ? insets.top : 0);

  const renderTimelineView = (
    scrollTopSpacerHeight?: number,
    headerComponent?: React.ReactNode,
    contentPaddingTop?: number,
    rowPaddingTop?: number,
  ) => (
    <TimelineView
      key={dayKey || 'day-timeline'}
      tasks={tasks}
      onTaskTimeChange={onTaskTimeChange}
      onTaskPress={onTaskPress}
      onTaskComplete={onTaskComplete}
      hideCompletedTasks={hideCompletedOnTimeline}
      selectionMode={selectionMode}
      selectedTaskIds={selectedTaskIds}
      onToggleTaskSelection={selectionMode ? onToggleTaskSelection : undefined}
      plannerScheduleAnchors={plannerScheduleAnchors}
      startHour={startHour}
      endHour={endHour}
      timeInterval={60}
      scrollTopSpacerHeight={scrollTopSpacerHeight}
      scrollContentPaddingTop={contentPaddingTop ?? scrollContentPaddingTop}
      scrollContentPaddingBottom={scrollContentPaddingBottom}
      scrollPastTopInset={scrollPastTopInset}
      scrollYSharedValue={scrollYSharedValue}
      headerComponent={headerComponent ?? todayHeader}
      timelineRowPaddingTop={rowPaddingTop ?? timelineRowPaddingTop}
      footerComponent={allDayFooter}
      calendarDayKey={dayKey}
      transparentBackground={transparentTimelineBackground}
    />
  );

  if (usePlannerSegmentSwitch && useTodayStickyPillHeader) {
    return (
      <View style={styles.todayStickyRoot}>
        <TodayStickyScrollPillOverlay
          top={stickyPillChrome.stickyPillBarTop}
          scrollYSharedValue={scrollYSharedValue}
          pillsStuck={stickyPillChrome.pillsStuck}
        >
          {plannerPillBarSticky}
        </TodayStickyScrollPillOverlay>

        {plannerSegment === 'allDay' ? (
          <Animated.ScrollView
            style={styles.flex1}
            contentContainerStyle={[
              styles.todayStickyScrollContent,
              {
                paddingTop: todayStickyScrollPaddingTop,
                paddingBottom: scrollBottomInset,
              },
            ]}
            contentInsetAdjustmentBehavior="never"
            showsVerticalScrollIndicator={false}
            onScroll={segmentScrollHandler}
            scrollEventThrottle={16}
          >
            {todayScrollHeader}
            <ListCard
              key={listCardKey}
              {...listCardSharedProps}
              groupBy="none"
              paddingTop={0}
              paddingHorizontal={0}
              scrollEnabled={false}
              embeddedInParentScroll
              contentInsetAdjustmentBehavior="never"
            />
          </Animated.ScrollView>
        ) : plannerSegment === 'habits' && habitsSegment ? (
          <Animated.ScrollView
            style={styles.flex1}
            contentContainerStyle={[
              styles.todayStickyScrollContent,
              {
                paddingTop: todayStickyScrollPaddingTop,
                paddingBottom: scrollBottomInset,
              },
            ]}
            contentInsetAdjustmentBehavior="never"
            showsVerticalScrollIndicator={false}
            onScroll={segmentScrollHandler}
            scrollEventThrottle={16}
          >
            {todayScrollHeader}
            <DayHabitsList
              dayKey={habitsSegment.dayKey}
              habits={habitsSegment.habits}
              isToday={habitsSegment.isToday}
              isLoading={habitsSegment.isLoading}
              onOpenDetail={habitsSegment.onOpenDetail}
              embeddedInParentScroll
              paddingHorizontal={0}
            />
          </Animated.ScrollView>
        ) : (
          renderTimelineView(
            undefined,
            todayScrollHeader,
            todayListScrollTopPadding(),
            TODAY_TIMELINE_ROW_BELOW_PILLS_GAP,
          )
        )}
      </View>
    );
  }

  if (usePlannerSegmentSwitch) {
    return (
      <TimelinePlannerPillChrome
        pillBar={plannerPillBarScroll}
        pillBarTopInset={pillBarTopInset}
        scrollContentInsetTop={scrollContentInsetTop}
      >
        {(scrollTopSpacerHeight) =>
          plannerSegment === 'allDay' ? (
            <PlannerSegmentScroll
              topSpacerHeight={resolveSegmentTopSpacer(scrollTopSpacerHeight)}
              paddingBottom={scrollBottomInset}
            >
              <ListCard
                key={listCardKey}
                {...listCardSharedProps}
                groupBy="none"
                paddingTop={0}
                scrollEnabled={false}
                embeddedInParentScroll
                contentInsetAdjustmentBehavior="never"
              />
            </PlannerSegmentScroll>
          ) : plannerSegment === 'habits' && habitsSegment ? (
            <PlannerSegmentScroll
              topSpacerHeight={resolveSegmentTopSpacer(scrollTopSpacerHeight)}
              paddingBottom={scrollBottomInset}
            >
              <DayHabitsList
                dayKey={habitsSegment.dayKey}
                habits={habitsSegment.habits}
                isToday={habitsSegment.isToday}
                isLoading={habitsSegment.isLoading}
                onOpenDetail={habitsSegment.onOpenDetail}
                embeddedInParentScroll
              />
            </PlannerSegmentScroll>
          ) : (
            renderTimelineView(scrollTopSpacerHeight)
          )
        }
      </TimelinePlannerPillChrome>
    );
  }

  return renderTimelineView(scrollContentPaddingTop ?? 0);
}

const styles = StyleSheet.create({
  allDayFooter: {},
  todayStickyRoot: {
    flex: 1,
  },
  flex1: {
    flex: 1,
  },
  todayStickyScrollContent: {
    paddingHorizontal: Paddings.screen,
  },
});

export default DayTimelineWithAllDayFooter;
