/**
 * Shared scroll shell for planner timeline + all-day segments — same top spacer height.
 */

import React from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';

export type PlannerSegmentScrollProps = {
  /** matches TimelinePlannerPillChrome measured inset */
  topSpacerHeight: number;
  paddingBottom: number;
  children: React.ReactNode;
};

export function PlannerSegmentScroll({ topSpacerHeight, paddingBottom, children }: PlannerSegmentScrollProps) {
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.scrollContent, { paddingBottom }]}
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior={Platform.OS === 'ios' ? 'never' : undefined}
    >
      <View style={[styles.topSpacer, { height: topSpacerHeight }]} pointerEvents="none" />
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 0,
  },
  topSpacer: {
    width: '100%',
  },
});

export default PlannerSegmentScroll;
