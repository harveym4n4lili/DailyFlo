/**
 * Reusable day column: TimelineView (timed tasks) + ListCard footer (all-day tasks).
 * Shared by Planner (selected day) and Today (calendar today in timeline layout).
 */

import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

import TimelineView from '@/components/features/timeline/TimelineView';
import { TimelineAllDayPill } from '@/components/features/timeline/TimelineAllDayPill';
import {
  TimelinePlannerPillChrome,
  resolvePlannerAllDayTopSpacerHeight,
} from '@/components/features/timeline/TimelinePlannerPillChrome';
import { PlannerSegmentScroll } from '@/components/features/timeline/PlannerSegmentScroll';
import { ListCard } from '@/components/ui/Card';
import { TodayBigScrollHeader } from '@/components/features/today/TodayBigScrollHeader';
import type { TimelineAllDayListDisplayProps } from '@/components/features/display/displayPreferenceMappers';
import { Paddings } from '@/constants/Paddings';
import { LIST_CARD_TASK_ROW_PRESET_TODAY } from '@/constants/listCardTaskRowPreset';
import { ALL_DAY_PLANNER_INITIAL_COLLAPSED_TITLES, ALL_DAY_TASKS_GROUP_TITLE } from '@/utils/taskGrouping';
import type { Task } from '@/types';

/** planner pill bar: which full-screen segment is shown (timeline spine vs all-day list only) */
type PlannerTimelineSegment = 'timeline' | 'allDay';

const PLANNER_TIMELINE_PILL_LABEL = 'Timeline';

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
  /** planner: anchored pill bar + separate timeline / all-day scroll areas */
  useAllDayPillBar?: boolean;
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
}: DayTimelineWithAllDayFooterProps) {
  const allDayTasks = useMemo(
    () => tasks.filter((task) => !task.time || task.time === ''),
    [tasks]
  );

  const visibleAllDayCount = useMemo(() => {
    if (!allDayListDisplayProps.hideCompletedTasks) return allDayTasks.length;
    return allDayTasks.filter((task) => !task.isCompleted).length;
  }, [allDayTasks, allDayListDisplayProps.hideCompletedTasks]);

  const allDayPillLabel = `${ALL_DAY_TASKS_GROUP_TITLE} (${visibleAllDayCount})`;

  const shouldShowAllDayFooter = useMemo(() => {
    if (!allDayListDisplayProps.showAllDayTasks || allDayTasks.length === 0) return false;
    if (!allDayListDisplayProps.hideCompletedTasks) return true;
    return allDayTasks.some((task) => !task.isCompleted);
  }, [
    allDayTasks,
    allDayListDisplayProps.hideCompletedTasks,
    allDayListDisplayProps.showAllDayTasks,
  ]);

  const usePlannerSegmentSwitch = useAllDayPillBar && shouldShowAllDayFooter;

  const [plannerSegment, setPlannerSegment] = useState<PlannerTimelineSegment>('timeline');
  useEffect(() => {
    setPlannerSegment('timeline');
  }, [dayKey]);

  const timelineRowPaddingTop =
    shouldShowAllDayFooter && !usePlannerSegmentSwitch
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
    ]
  );

  const listCardKey = `${allDayFooterKeyPrefix}-${dayKey || 'unknown'}`;

  const plannerPillBarScroll = useMemo(
    () => (
      <View style={styles.pillMeasureRoot} collapsable={false}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.pillScroll}
          contentContainerStyle={styles.pillScrollContent}
          keyboardShouldPersistTaps="handled"
        >
        <TimelineAllDayPill
          label={PLANNER_TIMELINE_PILL_LABEL}
          selected={plannerSegment === 'timeline'}
          onPress={() => setPlannerSegment('timeline')}
          accessibilityLabel="Show timeline"
        />
        <TimelineAllDayPill
          label={allDayPillLabel}
          selected={plannerSegment === 'allDay'}
          onPress={() => setPlannerSegment('allDay')}
          accessibilityLabel="Show all-day tasks"
        />
        </ScrollView>
      </View>
    ),
    [plannerSegment, allDayPillLabel]
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

  const scrollBottomInset =
    scrollContentPaddingBottom !== undefined
      ? Paddings.timelineScrollBottom + scrollContentPaddingBottom
      : Paddings.timelineScrollBottom;

  const renderTimelineView = (scrollTopSpacerHeight: number) => (
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
      scrollContentPaddingTop={0}
      scrollContentPaddingBottom={scrollContentPaddingBottom}
      scrollPastTopInset={scrollPastTopInset}
      scrollYSharedValue={scrollYSharedValue}
      headerComponent={todayHeader}
      timelineRowPaddingTop={timelineRowPaddingTop}
      footerComponent={allDayFooter}
      calendarDayKey={dayKey}
      transparentBackground={transparentTimelineBackground}
    />
  );

  if (usePlannerSegmentSwitch) {
    return (
      <TimelinePlannerPillChrome pillBar={plannerPillBarScroll}>
        {(scrollTopSpacerHeight) =>
          plannerSegment === 'allDay' ? (
            <PlannerSegmentScroll
              topSpacerHeight={resolvePlannerAllDayTopSpacerHeight(scrollTopSpacerHeight)}
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
  pillMeasureRoot: {
    paddingTop: Paddings.screen,
    paddingBottom: Paddings.timelineAllDayPillPaddingBottom,
    overflow: 'visible',
  },
  pillScroll: {
    flexGrow: 0,
    backgroundColor: 'transparent',
    overflow: 'visible',
  },
  pillScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Paddings.formDataPillRowGap,
    paddingHorizontal: Paddings.screen,
    paddingVertical: Paddings.liquidGlassBleed,
    overflow: 'visible',
  },
});

export default DayTimelineWithAllDayFooter;
