/**
 * list layout segment chrome — Tasks | Habits pills for planner + today list view.
 * today tab: big title scrolls first; pills sit below it, then lock under blur on scroll.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useAnimatedScrollHandler, type SharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DaySegmentPillBar } from '@/components/features/timeline/DaySegmentPillBar';
import { DayHabitsList } from '@/components/features/habits/day/DayHabitsList';
import { PlannerSegmentScroll } from '@/components/features/timeline/PlannerSegmentScroll';
import { TimelinePlannerPillChrome } from '@/components/features/timeline/TimelinePlannerPillChrome';
import { TodayBigScrollHeader } from '@/components/features/today/TodayBigScrollHeader';
import {
  TodayScrollPillBarFade,
  TodayStickyScrollPillOverlay,
  useTodayStickyScrollPillCrossfade,
} from '@/components/features/today/TodayStickyScrollPillChrome';
import { todayListScrollTopPadding } from '@/constants/todayScreenChrome';
import type { HabitForCalendarDay } from '@/utils/habitSchedule';
import { Paddings } from '@/constants/Paddings';

export type DayListSegment = 'tasks' | 'habits';

/** render-prop payload — today list uses scrollPills; planner list uses scrollTopInset under fade chrome */
export type DayListSegmentChromeRenderProps = {
  scrollPills: React.ReactNode;
  scrollTopInset: number;
};

type DayListSegmentChromeProps = {
  dayKey: string;
  habits: HabitForCalendarDay[];
  habitsCount: number;
  habitsIsToday: boolean;
  habitsLoading?: boolean;
  onOpenHabitDetail: (habitId: string) => void;
  /** browse list detail: collapsible Today + One-time habit sections */
  habitListViewSections?: {
    today: HabitForCalendarDay[];
    other: HabitForCalendarDay[];
  };
  habitsEmptyMessage?: string;
  /** planner: fixed pills above list */
  pillBarTopInset?: number;
  paddingTop?: number;
  /** today tab: scroll big title, sticky pills below it */
  useInboxTabHeader?: boolean;
  /** browse list push: same sticky pill scroll pattern as today tab */
  useBrowseStackHeader?: boolean;
  scrollYSharedValue?: SharedValue<number>;
  bigHeaderLabel?: string;
  children?: React.ReactNode | ((chrome: DayListSegmentChromeRenderProps) => React.ReactNode);
};

export function DayListSegmentChrome({
  dayKey,
  habits,
  habitsCount,
  habitsIsToday,
  habitsLoading = false,
  onOpenHabitDetail,
  habitListViewSections,
  habitsEmptyMessage,
  pillBarTopInset = 0,
  paddingTop = 16,
  useInboxTabHeader = false,
  useBrowseStackHeader = false,
  scrollYSharedValue,
  bigHeaderLabel = 'Today',
  children,
}: DayListSegmentChromeProps) {
  const insets = useSafeAreaInsets();
  const [segment, setSegment] = useState<DayListSegment>('tasks');
  const useStickyScrollHeader = useInboxTabHeader || useBrowseStackHeader;
  const stickyPillChrome = useTodayStickyScrollPillCrossfade(
    useStickyScrollHeader ? scrollYSharedValue : undefined,
  );

  useEffect(() => {
    setSegment('tasks');
  }, [dayKey]);

  useEffect(() => {
    if (!useStickyScrollHeader || !scrollYSharedValue) return;
    scrollYSharedValue.value = 0;
  }, [segment, useStickyScrollHeader, scrollYSharedValue]);

  const pills = useMemo(
    () => [
      { id: 'tasks' as const, label: 'Tasks', accessibilityLabel: 'Show tasks' },
      {
        id: 'habits' as const,
        label: `Habits (${habitsCount})`,
        accessibilityLabel: `Show habits, ${habitsCount} due`,
      },
    ],
    [habitsCount],
  );

  const pillBarProps = {
    pills,
    selectedId: segment,
    onSelect: (id: string) => setSegment(id as DayListSegment),
    compactHeaderTop: true as const,
  };

  const scrollPillBar = (
    <TodayScrollPillBarFade
      scrollPillBarStyle={stickyPillChrome.scrollPillBarStyle}
      pillsStuck={stickyPillChrome.pillsStuck}
    >
      <DaySegmentPillBar {...pillBarProps} embeddedInListHeader={useStickyScrollHeader} />
    </TodayScrollPillBarFade>
  );

  const stickyPillBar = <DaySegmentPillBar {...pillBarProps} />;

  const inboxScrollPaddingTop = insets.top + todayListScrollTopPadding();

  const habitsScrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      if (scrollYSharedValue) {
        scrollYSharedValue.value = event.contentOffset.y;
      }
    },
  });

  if (useStickyScrollHeader) {
    return (
      <View style={styles.root}>
        <TodayStickyScrollPillOverlay
          top={stickyPillChrome.stickyPillBarTop}
          stickyPillBarStyle={stickyPillChrome.stickyPillBarStyle}
          pillsStuck={stickyPillChrome.pillsStuck}
        >
          {stickyPillBar}
        </TodayStickyScrollPillOverlay>

        {segment === 'tasks' && typeof children === 'function' ? (
          <View style={styles.content}>
            {children({ scrollPills: scrollPillBar, scrollTopInset: 0 })}
          </View>
        ) : null}

        {segment === 'habits' ? (
          <Animated.ScrollView
            style={styles.inboxScroll}
            contentContainerStyle={[
              styles.inboxScrollContent,
              { paddingTop: inboxScrollPaddingTop, paddingHorizontal: Paddings.screen },
            ]}
            contentInsetAdjustmentBehavior="never"
            showsVerticalScrollIndicator
            onScroll={habitsScrollHandler}
            scrollEventThrottle={16}
          >
            {scrollYSharedValue ? (
              <TodayBigScrollHeader scrollY={scrollYSharedValue} label={bigHeaderLabel} />
            ) : null}
            {scrollPillBar}
            <DayHabitsList
              dayKey={dayKey}
              habits={habits}
              isToday={habitsIsToday}
              isLoading={habitsLoading}
              onOpenDetail={onOpenHabitDetail}
              embeddedInParentScroll
              paddingHorizontal={0}
              listViewSections={habitListViewSections}
              emptyMessage={habitsEmptyMessage}
            />
          </Animated.ScrollView>
        ) : null}
      </View>
    );
  }

  const pillBar = (
    <DaySegmentPillBar
      pills={pills}
      selectedId={segment}
      onSelect={(id) => setSegment(id as DayListSegment)}
    />
  );

  return (
    <TimelinePlannerPillChrome pillBar={pillBar} pillBarTopInset={pillBarTopInset}>
      {(scrollTopSpacerHeight) => (
        <View style={styles.content}>
          {segment === 'tasks' ? (
            <View style={styles.tasksWrap}>
              {typeof children === 'function' ? (
                children({ scrollPills: null, scrollTopInset: scrollTopSpacerHeight })
              ) : (
                children
              )}
            </View>
          ) : null}
          {segment === 'habits' ? (
            <PlannerSegmentScroll
              topSpacerHeight={scrollTopSpacerHeight}
              paddingBottom={Paddings.scrollBottomExtra}
            >
              <DayHabitsList
                dayKey={dayKey}
                habits={habits}
                isToday={habitsIsToday}
                isLoading={habitsLoading}
                onOpenDetail={onOpenHabitDetail}
                embeddedInParentScroll
                listViewSections={habitListViewSections}
                emptyMessage={habitsEmptyMessage}
              />
            </PlannerSegmentScroll>
          ) : null}
        </View>
      )}
    </TimelinePlannerPillChrome>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  tasksWrap: {
    flex: 1,
  },
  inboxScroll: {
    flex: 1,
  },
  inboxScrollContent: {
    paddingBottom: Paddings.scrollBottomExtra,
  },
});
