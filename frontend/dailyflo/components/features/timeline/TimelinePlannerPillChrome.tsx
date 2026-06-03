/**
 * Planner timeline — pills pinned to top; scroll spacer height follows measured pill row.
 */

import React, { useCallback, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

import { useThemeColors } from '@/hooks/useColorPalette';
import { Paddings } from '@/constants/Paddings';

/** quick-add pill row: screen top (20) + 48pt tap target + bottom row padding (8) */
export const PLANNER_PILL_ROW_MIN_HEIGHT =
  Paddings.screen + 48 + Paddings.timelineAllDayPillPaddingBottom;

export const PLANNER_PILL_SCROLL_TOP_SPACER_FALLBACK =
  PLANNER_PILL_ROW_MIN_HEIGHT + Paddings.timelinePlannerContentBelowPillsGap;

function resolveScrollTopSpacer(measuredHeight: number): number {
  const rowHeight = Math.max(measuredHeight, PLANNER_PILL_ROW_MIN_HEIGHT);
  return rowHeight + Paddings.timelinePlannerContentBelowPillsGap;
}

/** planner all-day segment — shorter top inset than timeline (tighter gap under pills + list row alignment) */
export function resolvePlannerAllDayTopSpacerHeight(timelineSegmentSpacerHeight: number): number {
  const tighterGapBelowPills =
    Paddings.timelinePlannerContentBelowPillsGap - Paddings.timelineAllDayPillToListGap;
  const reduced =
    timelineSegmentSpacerHeight -
    tighterGapBelowPills -
    Paddings.timelinePlannerAllDayTopSpacerReduction;
  const minimum = PLANNER_PILL_ROW_MIN_HEIGHT + Paddings.timelineAllDayPillToListGap;
  return Math.max(reduced, minimum);
}

export type TimelinePlannerPillChromeProps = {
  pillBar: React.ReactNode;
  /** receives fixed spacer height so scroll content starts below anchored pills */
  children: (scrollTopSpacerHeight: number) => React.ReactNode;
};

export function TimelinePlannerPillChrome({ children, pillBar }: TimelinePlannerPillChromeProps) {
  const themeColors = useThemeColors();
  const fadeBase = themeColors.background.primary();
  const [pillBarHeight, setPillBarHeight] = useState(0);

  const onPillBarLayout = useCallback((event: LayoutChangeEvent) => {
    const next = Math.ceil(event.nativeEvent.layout.height);
    if (next > 0) {
      setPillBarHeight((prev) => (prev === next ? prev : next));
    }
  }, []);

  const scrollTopSpacerHeight =
    pillBarHeight > 0
      ? resolveScrollTopSpacer(pillBarHeight)
      : PLANNER_PILL_SCROLL_TOP_SPACER_FALLBACK;

  const chromeHeight =
    pillBarHeight > 0 ? Math.max(pillBarHeight, PLANNER_PILL_ROW_MIN_HEIGHT) : PLANNER_PILL_ROW_MIN_HEIGHT;

  return (
    <View style={styles.root}>
      <View style={styles.content}>{children(scrollTopSpacerHeight)}</View>
      <View style={[styles.chromeWrap, { height: chromeHeight }]} pointerEvents="box-none">
        <View style={styles.chromeFade} pointerEvents="none">
          <BlurView
            tint={themeColors.isDark ? 'dark' : 'light'}
            intensity={1}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={[fadeBase, themeColors.withOpacity(fadeBase, 0)]}
            locations={[0.35, 1]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
        </View>
        <View style={styles.pillStrip} onLayout={onPillBarLayout} pointerEvents="box-none" collapsable={false}>
          {pillBar}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: 'visible',
  },
  content: {
    flex: 1,
  },
  chromeWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 3,
    backgroundColor: 'transparent',
    overflow: 'visible',
  },
  chromeFade: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
    overflow: 'visible',
  },
  pillStrip: {
    zIndex: 1,
    alignSelf: 'stretch',
    overflow: 'visible',
  },
});

export default TimelinePlannerPillChrome;
