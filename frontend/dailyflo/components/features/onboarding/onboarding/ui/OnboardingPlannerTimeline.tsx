/**
 * small planner-style column for onboarding: same row geometry as `TimelineView` (label column + tasks column + dashed line).
 * wake + sleep use `TimelineItem` with sun/moon `leadingAccessory` (moss 600 + sage 600) and `hugContent` so pills don’t span the column; middle row stays full width via `children`.
 * gaps reuse planner free-time copy + sparkles.
 * spacing uses `getTimelineTaskGapPx`.
 * intentionally no: redux, drag, overlap merge, footer list, or layout transition delays.
 */

import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useColorPalette, useThemeColors } from '@/hooks/useColorPalette';
import { ONBOARDING_SLIDES_PLANNER_FREE_TIME_BODY_TEXT_STYLE } from '../constants/typography';
import TimeLabel from '@/components/features/timeline/TimeLabel';
import TimelineItem from '@/components/features/timeline/TimelineItem';
import { getTimelineTaskGapPx } from '@/components/features/timeline/timelineSpacing';
import { FREE_TIME_BREAK_MESSAGES, formatMinutesToDuration } from '@/components/features/timeline/timelineFreeTime';
import {
  TIMELINE_DEFAULT_PIXELS_PER_MINUTE,
  getTaskCardHeight,
  minutesToTime,
  timeToMinutes,
} from '@/components/features/timeline/timelineUtils';
import { DashedVerticalLine } from '@/components/ui/borders';
import { MoonFillIcon, SparklesIcon, SunshineFillIcon } from '@/components/ui/Icon';
import { CHECKBOX_SIZE_DEFAULT, CHECKBOX_SIZE_TASK_VIEW } from '@/constants/Checkbox';
import { Paddings } from '@/constants/Paddings';
import type { Task, TaskColor } from '@/types';

import { OnboardingQuestionnaireTaskTitleRow } from './OnboardingQuestionnaireTaskTitleRow';

/**
 * same tiers as `TimelineView` free-time rows — keeps short gaps under 30m readable inside fixed px gaps.
 */
function OnboardingPlannerFreeTimeGap({
  top,
  height,
  minutes,
  messageRotateIndex,
}: {
  top: number;
  height: number;
  minutes: number;
  messageRotateIndex: number;
}) {
  const themeColors = useThemeColors();
  const s = useMemo(
    () =>
      StyleSheet.create({
        block: {
          position: 'absolute',
          left: 0,
          right: 0,
          justifyContent: 'center',
          alignItems: 'flex-start',
          // match `TimelineView` `styles.freeTimeBlock` — same left inset for sparkles + copy
          paddingLeft: Paddings.timelineFreeTimeLeft,
          zIndex: 0,
        },
        row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
        text: { ...ONBOARDING_SLIDES_PLANNER_FREE_TIME_BODY_TEXT_STYLE, color: themeColors.background.tertiary() },
        bold: { ...ONBOARDING_SLIDES_PLANNER_FREE_TIME_BODY_TEXT_STYLE, color: themeColors.text.primary() },
      }),
    [themeColors],
  );

  if (height <= 0) return null;

  const isLongBreak = minutes > 120;

  return (
    <View pointerEvents="none" style={[s.block, { top, height }]}>
      <View style={s.row}>
        <SparklesIcon size={14} color={themeColors.background.quaternary()} />
        {isLongBreak ? (
          <Text style={s.text}>
            Woah! you have <Text style={s.bold}>{formatMinutesToDuration(minutes)}</Text> of free time!
          </Text>
        ) : minutes >= 30 ? (
          <Text style={s.text}>
            {FREE_TIME_BREAK_MESSAGES[messageRotateIndex % FREE_TIME_BREAK_MESSAGES.length]}
          </Text>
        ) : minutes > 0 ? (
          <Text style={s.text}>
            <Text style={s.bold}>{minutes} min</Text> free before what&apos;s next.
          </Text>
        ) : (
          <Text style={s.text}>Flows right into what&apos;s next.</Text>
        )}
      </View>
    </View>
  );
}

/** drag is a no-op here — real planner updates task times; onboarding preview is static */
function noopTimelineDrag(_newY: number) {}

/**
 * minimal `Task` for `TimelineItem` — no `icon` so the row is the single blend card (matches non-icon tasks on the planner).
 */
function createOnboardingAnchorTask(
  id: string,
  title: string,
  timeHm: string,
  color: TaskColor,
  durationMinutes = 0,
): Task {
  return {
    id,
    userId: 'onboarding-local',
    listId: null,
    title,
    description: '',
    time: timeHm,
    duration: durationMinutes,
    dueDate: null,
    isCompleted: false,
    completedAt: null,
    priorityLevel: 3,
    color,
    routineType: 'once',
    sortOrder: 0,
    metadata: { subtasks: [], reminders: [] },
    softDeleted: false,
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
  };
}

/** extra column height under the sleep band so time labels / borders are not clipped by tight parents */
const ONBOARDING_PLANNER_TIMELINE_COLUMN_BOTTOM_CLEARANCE_PX = 14;

/** top/bottom padding in this strip’s `ScrollView` — shared with the questionnaire `heightProbe` so finish-step layers are not clipped (those layers are `absoluteFill` to the probe height). */
export const ONBOARDING_PLANNER_TIMELINE_SCROLL_PADDING_TOP_PX = 16;
export const ONBOARDING_PLANNER_TIMELINE_SCROLL_PADDING_BOTTOM_PX = 24;

/**
 * finish slide: headline is padded in `OnboardingSampleSlidePage` (`finishTimelineHeadlinePad`); this strip stays full-bleed horizontally so it does not add another `Paddings.screen` gutter on top of that
 */
const ONBOARDING_TIMELINE_ROOT_HORIZONTAL_PAD = 0;

/** label column starts after root pad; avoid extra margin that used to stack with shell padding */
const ONBOARDING_TIMELINE_LABEL_COLUMN_MARGIN_LEFT = 0;
const ONBOARDING_TIMELINE_LABEL_COLUMN_WIDTH = 56;
/** a bit tighter than main timeline so the strip sits nearer the times (finish slide only) */
const ONBOARDING_TIMELINE_LABELS_RIGHT_PAD = 8;
/**
 * smaller than `Paddings.timelineTasksLeft` — pulls wake/task/sleep + dashed line left toward the label column for this preview
 * (full `TimelineView` still uses `Paddings.timelineTasksLeft`.)
 */
const ONBOARDING_TIMELINE_TASKS_LEFT_PAD = 10;
/**
 * main planner uses 21 for icon-column geometry; wake/sleep here have no icon, so center the dash on the checkbox (card inset + half checkbox)
 */
const ONBOARDING_TIMELINE_DASH_LEFT = Paddings.card + CHECKBOX_SIZE_DEFAULT / 2;

function dateToHHMM(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** pure layout — used here and by `getOnboardingPlannerTimelineMinScrollBodyHeightPx` for the crossfade stack probe */
export function computeOnboardingPlannerTimelineLayout(
  wakeTime: Date,
  sleepTime: Date,
  taskEventTime: Date,
  taskDurationMinutes: number,
  taskHeight: number,
) {
  const wakeHm = dateToHHMM(wakeTime);
  const sleepHm = dateToHHMM(sleepTime);
  const taskHm = dateToHHMM(taskEventTime);
  const wakeM = timeToMinutes(wakeHm);
  const sleepM = timeToMinutes(sleepHm);
  const tStart = timeToMinutes(taskHm);
  const tEnd = tStart + taskDurationMinutes;
  const taskEndHm = minutesToTime(tEnd);

  const gapWakeToTask = getTimelineTaskGapPx(Math.max(0, tStart - wakeM));
  const gapTaskToSleep = getTimelineTaskGapPx(Math.max(0, sleepM - tEnd));

  const anchorRowHeight = getTaskCardHeight(0);
  const wakeTop = 0;
  const taskTop = anchorRowHeight + gapWakeToTask;
  const sleepTop = taskTop + taskHeight + gapTaskToSleep;
  const totalHeight = sleepTop + anchorRowHeight + ONBOARDING_PLANNER_TIMELINE_COLUMN_BOTTOM_CLEARANCE_PX;
  const taskBottom = taskTop + taskHeight;
  const minutesWakeToTask = Math.max(0, tStart - wakeM);
  const minutesTaskToSleep = Math.max(0, sleepM - tEnd);

  return {
    wakeHm,
    sleepHm,
    taskHm,
    taskEndHm,
    wakeTop,
    taskTop,
    sleepTop,
    taskBottom,
    totalHeight,
    lineTop: 0,
    lineHeight: totalHeight,
    gapWakeToTaskPx: gapWakeToTask,
    gapTaskToSleepPx: gapTaskToSleep,
    minutesWakeToTask,
    minutesTaskToSleep,
  };
}

/** scroll body min height (pads + timeline column) for `OnboardingSlideSampleContent` without duplicating the tree */
export function getOnboardingPlannerTimelineMinScrollBodyHeightPx(
  wakeTime: Date,
  sleepTime: Date,
  taskEventTime: Date,
  taskDurationMinutes: number,
  taskHeight: number,
) {
  const { totalHeight } = computeOnboardingPlannerTimelineLayout(
    wakeTime,
    sleepTime,
    taskEventTime,
    taskDurationMinutes,
    taskHeight,
  );
  return (
    ONBOARDING_PLANNER_TIMELINE_SCROLL_PADDING_TOP_PX +
    totalHeight +
    ONBOARDING_PLANNER_TIMELINE_SCROLL_PADDING_BOTTOM_PX
  );
}

/** only the color getters this StyleSheet uses — avoids `ReturnType<typeof useThemeColors>` in a helper some refresh paths mishandle */
type PlannerTimelineThemeColors = {
  background: { primary: () => string };
  border: { secondary: () => string };
};

function createStyles(themeColors: PlannerTimelineThemeColors) {
  return StyleSheet.create({
    root: {
      width: '100%',
      paddingHorizontal: ONBOARDING_TIMELINE_ROOT_HORIZONTAL_PAD,
      backgroundColor: themeColors.background.primary(),
    },
    /** when `scrollBody` is on — fill the crossfade shell so `ScrollView` gets a real max height and can scroll content taller than the viewport */
    rootWhenScrollBody: {
      flex: 1,
      minHeight: 0,
    },
    scrollBodyFill: {
      flex: 1,
      minHeight: 0,
    },
    // no `flexGrow`: height follows the wake→sleep column so parents don’t squeeze the strip
    scrollContent: {
      paddingTop: ONBOARDING_PLANNER_TIMELINE_SCROLL_PADDING_TOP_PX,
      paddingBottom: ONBOARDING_PLANNER_TIMELINE_SCROLL_PADDING_BOTTOM_PX,
    },
    timelineRow: {
      flexDirection: 'row',
    },
    timeLabelsContainer: {
      marginLeft: ONBOARDING_TIMELINE_LABEL_COLUMN_MARGIN_LEFT,
      paddingRight: ONBOARDING_TIMELINE_LABELS_RIGHT_PAD,
      alignItems: 'flex-end',
      position: 'relative',
      width: ONBOARDING_TIMELINE_LABEL_COLUMN_WIDTH,
    },
    tasksContainer: {
      flex: 1,
      position: 'relative',
      paddingLeft: ONBOARDING_TIMELINE_TASKS_LEFT_PAD,
      paddingRight: Paddings.timelineTasksRight,
    },
    timelineLine: {
      position: 'absolute',
      left: ONBOARDING_TIMELINE_DASH_LEFT,
    },
    timelineItemLayer: {
      width: '100%',
    },
    /** middle task sits above free-time gaps like the real planner */
    taskTimelineLayer: {
      zIndex: 1,
    },
  });
}

export type OnboardingPlannerTimelineProps = {
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
  /**
   * fires after layout with the real scroll-body height (uses measured task row height from `onLayout`, not only `getTaskCardHeight`).
   * the questionnaire crossfade stack uses this so its invisible `heightProbe` matches the strip and the sleep anchor isn’t clipped.
   */
  onScrollBodyHeightChange?: (heightPx: number) => void;
  /**
   * finish slide: enable vertical scroll when the strip sits in a flex-limited crossfade shell (outer page no longer wraps a separate `ScrollView`).
   */
  scrollBody?: boolean;
};

export function OnboardingPlannerTimeline({
  wakeTime,
  sleepTime,
  taskEventTime,
  taskDurationMinutes,
  taskAgendaTitle,
  onTaskAgendaTitleChange,
  taskAgendaChecked,
  onTaskAgendaCheckedChange,
  titleInputColor,
  pencilIconColor,
  onScrollBodyHeightChange,
  scrollBody = false,
}: OnboardingPlannerTimelineProps) {
  const themeColors = useThemeColors();
  const colorPalette = useColorPalette();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);

  const [taskHeight, setTaskHeight] = useState(() => getTaskCardHeight(taskDurationMinutes));
  const anchorRowHeight = getTaskCardHeight(0);

  // brand ramps for wake/sleep icons — same `useColorPalette` getters as elsewhere (`moss:` / `sage:` intro tokens)
  const moss600 = colorPalette.getMossBrandColor(600);
  const sage600 = colorPalette.getSageBrandColor(600);
  const wakeSunLeading = useMemo(
    () => <SunshineFillIcon size={CHECKBOX_SIZE_TASK_VIEW} color={moss600} />,
    [moss600],
  );
  const sleepMoonLeading = useMemo(
    () => <MoonFillIcon size={CHECKBOX_SIZE_TASK_VIEW} color={sage600} />,
    [sage600],
  );

  // timeline item reports real card height after layout — same hook the main planner uses to resize gaps
  const onTaskHeightMeasured = useCallback((h: number) => {
    if (h > 0) setTaskHeight(h);
  }, []);

  // push true pixel height to the parent probe — `getTaskCardHeight` in the probe alone underestimates the title row, so sleep was clipping
  useLayoutEffect(() => {
    if (!onScrollBodyHeightChange) return;
    onScrollBodyHeightChange(
      getOnboardingPlannerTimelineMinScrollBodyHeightPx(
        wakeTime,
        sleepTime,
        taskEventTime,
        taskDurationMinutes,
        taskHeight,
      ),
    );
  }, [
    onScrollBodyHeightChange,
    wakeTime,
    sleepTime,
    taskEventTime,
    taskDurationMinutes,
    taskHeight,
  ]);

  const layout = useMemo(
    () =>
      computeOnboardingPlannerTimelineLayout(
        wakeTime,
        sleepTime,
        taskEventTime,
        taskDurationMinutes,
        taskHeight,
      ),
    [wakeTime, sleepTime, taskEventTime, taskDurationMinutes, taskHeight],
  );

  const wakeTask = useMemo(
    () => createOnboardingAnchorTask('onboarding-planner-wake', 'Rise and Shine', layout.wakeHm, 'yellow'),
    [layout.wakeHm],
  );
  const sleepTask = useMemo(
    () => createOnboardingAnchorTask('onboarding-planner-sleep', 'Switch Off', layout.sleepHm, 'teal'),
    [layout.sleepHm],
  );
  const agendaTask = useMemo(
    () =>
      createOnboardingAnchorTask(
        'onboarding-planner-task',
        taskAgendaTitle,
        layout.taskHm,
        'blue',
        taskDurationMinutes,
      ),
    [taskAgendaTitle, layout.taskHm, taskDurationMinutes],
  );

  const wakeFreeGapTop = layout.wakeTop + anchorRowHeight;
  const taskFreeGapTop = layout.taskBottom;

  const wakeCenterY = layout.wakeTop + anchorRowHeight / 2;
  const taskCenterY = layout.taskTop + taskHeight / 2;
  const sleepCenterY = layout.sleepTop + anchorRowHeight / 2;

  return (
    <View
      style={[styles.root, scrollBody && styles.rootWhenScrollBody]}
      accessibilityLabel="Planner-style day preview"
    >
      <ScrollView
        style={scrollBody ? styles.scrollBodyFill : undefined}
        scrollEnabled={scrollBody}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={scrollBody}
        bounces={scrollBody}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.timelineRow, { minHeight: layout.totalHeight }]}>
          <View style={[styles.timeLabelsContainer, { minHeight: layout.totalHeight }]}>
            <TimeLabel time={layout.wakeHm} position={layout.wakeTop} />
            <TimeLabel time={layout.taskHm} position={layout.taskTop} />
            {taskDurationMinutes > 0 ? (
              <TimeLabel time={layout.taskEndHm} position={layout.taskBottom} isEndTime />
            ) : null}
            <TimeLabel time={layout.sleepHm} position={layout.sleepTop} />
          </View>

          <View style={[styles.tasksContainer, { minHeight: layout.totalHeight }]}>
            <DashedVerticalLine
              height={layout.lineHeight}
              color={themeColors.border.secondary()}
              style={[styles.timelineLine, { top: layout.lineTop }]}
            />

            <View pointerEvents="none" style={styles.timelineItemLayer}>
              <TimelineItem
                task={wakeTask}
                centerPosition={wakeCenterY}
                duration={0}
                pixelsPerMinute={TIMELINE_DEFAULT_PIXELS_PER_MINUTE}
                startHour={6}
                onDrag={noopTimelineDrag}
                leadingAccessory={wakeSunLeading}
                hugContent
              />
            </View>

            <OnboardingPlannerFreeTimeGap
              top={wakeFreeGapTop}
              height={layout.gapWakeToTaskPx}
              minutes={layout.minutesWakeToTask}
              messageRotateIndex={0}
            />

            <View style={[styles.timelineItemLayer, styles.taskTimelineLayer]}>
              {/*
                same absolute shell as wake/sleep rows so the dashed line lines up.
                we pass questionnaire UI as `children` so timelineitem skips drag wrappers (text input stays usable).
              */}
              <TimelineItem
                task={agendaTask}
                centerPosition={taskCenterY}
                duration={taskDurationMinutes}
                pixelsPerMinute={TIMELINE_DEFAULT_PIXELS_PER_MINUTE}
                startHour={6}
                onDrag={noopTimelineDrag}
                onHeightMeasured={onTaskHeightMeasured}
              >
                <OnboardingQuestionnaireTaskTitleRow
                  title={taskAgendaTitle}
                  onTitleChange={onTaskAgendaTitleChange}
                  checked={taskAgendaChecked}
                  onCheckedChange={onTaskAgendaCheckedChange}
                  titleInputColor={titleInputColor}
                  pencilIconColor={pencilIconColor}
                  suppressTitleKeyboard
                />
              </TimelineItem>
            </View>

            <OnboardingPlannerFreeTimeGap
              top={taskFreeGapTop}
              height={layout.gapTaskToSleepPx}
              minutes={layout.minutesTaskToSleep}
              messageRotateIndex={1}
            />

            <View pointerEvents="none" style={styles.timelineItemLayer}>
              <TimelineItem
                task={sleepTask}
                centerPosition={sleepCenterY}
                duration={0}
                pixelsPerMinute={TIMELINE_DEFAULT_PIXELS_PER_MINUTE}
                startHour={6}
                onDrag={noopTimelineDrag}
                leadingAccessory={sleepMoonLeading}
                hugContent
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
