/**
 * task branch — last step: compact planner-style strip (wake + task row + sleep) using the same gap rules as `TimelineView` via `getTimelineTaskGapPx`.
 * implemented in `OnboardingPlannerTimeline` so we do not mount the full planner timeline (drag, overlap, free-time copy, redux tasks).
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';

import { OnboardingPlannerTimeline } from './OnboardingPlannerTimeline';

export type OnboardingQuestionnaireFinishTimelineBodyProps = {
  wakeTime: Date;
  sleepTime: Date;
  taskEventTime: Date;
  taskDurationMinutes: number;
  taskAgendaTitle: string;
  onTaskAgendaTitleChange: (next: string) => void;
  taskAgendaChecked: boolean;
  onTaskAgendaCheckedChange: (next: boolean) => void;
  titleInputColor: string;
  pencilIconColor: string;
  onScrollBodyHeightChange?: (heightPx: number) => void;
};

export function OnboardingQuestionnaireFinishTimelineBody({
  onScrollBodyHeightChange,
  ...timelineProps
}: OnboardingQuestionnaireFinishTimelineBodyProps) {
  return (
    <View style={styles.root} accessibilityLabel="Task timeline preview">
      <OnboardingPlannerTimeline
        {...timelineProps}
        scrollBody
        onScrollBodyHeightChange={onScrollBodyHeightChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // `flex: 1` + `minHeight: 0` — crossfade layer is absolute-fill; this wrapper must claim the box so the inner `ScrollView` (`scrollBody`) gets a bounded height. without minHeight 0, flex children won’t shrink and scrolling breaks on some layouts.
  root: {
    width: '100%',
    flex: 1,
    minHeight: 0,
  },
});
