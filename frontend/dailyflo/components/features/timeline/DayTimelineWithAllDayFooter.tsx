/**
 * Reusable day column: TimelineView (timed tasks) + ListCard footer (all-day tasks).
 * Shared by Planner (selected day) and Today (calendar today in timeline layout).
 */

import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { SharedValue } from 'react-native-reanimated';

import TimelineView from '@/components/features/timeline/TimelineView';
import { ListCard } from '@/components/ui/Card';
import { TodayBigScrollHeader } from '@/components/features/today/TodayBigScrollHeader';
import type { TimelineAllDayListDisplayProps } from '@/components/features/display/displayPreferenceMappers';
import { useThemeColors } from '@/hooks/useColorPalette';
import { Paddings } from '@/constants/Paddings';
import { LIST_CARD_TASK_ROW_PRESET_TODAY } from '@/constants/listCardTaskRowPreset';
import { ALL_DAY_PLANNER_INITIAL_COLLAPSED_TITLES } from '@/utils/taskGrouping';
import type { Task } from '@/types';

export type DayTimelineWithAllDayFooterProps = {
  /** remount key when calendar day changes — resets all-day group collapse state */
  dayKey: string;
  /** all tasks for this calendar day (timed + all-day) */
  tasks: Task[];
  /** sort/completed/all-day toggle from display prefs */
  allDayListDisplayProps: TimelineAllDayListDisplayProps;
  /** when true, completed timed tasks hidden on timeline (same pref as footer) */
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
  /** Today screen: big title + safe-area scroll inset (matches ListCard) */
  scrollPastTopInset?: boolean;
  scrollYSharedValue?: SharedValue<number>;
  showTodayBigHeader?: boolean;
  todayHeaderLabel?: string;
  /** planner uses a short gradient under week chrome */
  showTopFade?: boolean;
  emptyAllDayMessage?: string;
  /** prefix for footer ListCard remount key */
  allDayFooterKeyPrefix?: string;
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
  showTopFade = false,
  emptyAllDayMessage = 'No all-day tasks for this date.',
  allDayFooterKeyPrefix = 'day-allday',
}: DayTimelineWithAllDayFooterProps) {
  const allDayTasks = useMemo(
    () => tasks.filter((task) => !task.time || task.time === ''),
    [tasks]
  );

  const shouldShowAllDayFooter = useMemo(() => {
    if (!allDayListDisplayProps.showAllDayTasks || allDayTasks.length === 0) return false;
    if (!allDayListDisplayProps.hideCompletedTasks) return true;
    return allDayTasks.some((task) => !task.isCompleted);
  }, [
    allDayTasks,
    allDayListDisplayProps.hideCompletedTasks,
    allDayListDisplayProps.showAllDayTasks,
  ]);

  // all-day footer not shown: fixed spacer above timed rows only (Today header scroll position unchanged)
  const timelineRowPaddingTop = shouldShowAllDayFooter
    ? undefined
    : Paddings.timelineTopWhenAllDayHidden;

  const allDayFooter = useMemo(
    () =>
      shouldShowAllDayFooter ? (
        <View style={styles.allDayFooter}>
          <ListCard
            key={`${allDayFooterKeyPrefix}-${dayKey || 'unknown'}`}
            tasks={allDayTasks}
            selectionMode={selectionMode}
            selectedTaskIds={selectedTaskIds}
            onToggleTaskSelection={selectionMode ? onToggleTaskSelection : undefined}
            hideCompletedTasks={allDayListDisplayProps.hideCompletedTasks}
            onTaskPress={onTaskPress}
            onTaskComplete={onTaskComplete}
            onTaskEdit={onTaskEdit}
            onTaskDelete={onTaskDelete}
            {...LIST_CARD_TASK_ROW_PRESET_TODAY}
            initialCollapsedGroupTitles={ALL_DAY_PLANNER_INITIAL_COLLAPSED_TITLES}
            emptyMessage={emptyAllDayMessage}
            loading={false}
            groupBy="allDay"
            sortBy={allDayListDisplayProps.sortBy}
            sortDirection={allDayListDisplayProps.sortDirection}
            paddingHorizontal={Paddings.screen}
            paddingBottom={8}
            scrollEnabled={false}
            disableInitialLayoutTransition={true}
          />
        </View>
      ) : undefined,
    [
      shouldShowAllDayFooter,
      allDayFooterKeyPrefix,
      dayKey,
      allDayTasks,
      selectionMode,
      selectedTaskIds,
      onToggleTaskSelection,
      allDayListDisplayProps,
      onTaskPress,
      onTaskComplete,
      onTaskEdit,
      onTaskDelete,
      emptyAllDayMessage,
    ]
  );

  const todayHeader = useMemo(() => {
    if (!showTodayBigHeader || !scrollYSharedValue) return null;
    return <TodayBigScrollHeader scrollY={scrollYSharedValue} label={todayHeaderLabel} />;
  }, [showTodayBigHeader, scrollYSharedValue, todayHeaderLabel]);

  return (
    <>
      {showTopFade ? <PlannerWeekChromeTopFade /> : null}
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
        scrollContentPaddingTop={scrollContentPaddingTop}
        scrollContentPaddingBottom={scrollContentPaddingBottom}
        scrollPastTopInset={scrollPastTopInset}
        scrollYSharedValue={scrollYSharedValue}
        headerComponent={todayHeader}
        timelineRowPaddingTop={timelineRowPaddingTop}
        footerComponent={allDayFooter}
        calendarDayKey={dayKey}
      />
    </>
  );
}

/** short primary→transparent gradient under planner WeekView — softens scroll edge below week chrome */
export function PlannerWeekChromeTopFade() {
  const themeColors = useThemeColors();

  return (
    <View style={plannerWeekChromeTopFadeStyles.overlay} pointerEvents="none">
      <LinearGradient
        colors={[
          themeColors.background.primary(),
          themeColors.withOpacity(themeColors.background.primary(), 0),
        ]}
        locations={[0.0, 1]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const plannerWeekChromeTopFadeStyles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 32,
    zIndex: 5,
    overflow: 'hidden',
  },
});

const styles = StyleSheet.create({
  allDayFooter: {},
});

export default DayTimelineWithAllDayFooter;
