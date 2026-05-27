/**
 * Synthetic planner timeline rows ("wake up" / "wind down") — not real backend tasks.
 * They share the planner day via `dueDate` so TimelineView`s `tasksWithTime` filter still includes them,
 * while overlap detection skips them via id checks so timed user tasks cannot merge/hide anchors.
 */

import type { Task, TaskColor } from '@/types';
import { isValidWakeSleepHHMM } from '@/utils/preferenceScheduleTimes';
import { mapAlertIdsToTaskReminders } from '@/utils/taskAlertReminders';

export const PLANNER_WAKE_ANCHOR_TASK_ID = '__dailyflo_planner_wake_anchor__';
export const PLANNER_SLEEP_ANCHOR_TASK_ID = '__dailyflo_planner_sleep_anchor__';

/** default os reminder for the planner wind-down anchor — 5 minutes before sleep time */
export const PLANNER_WIND_DOWN_REMINDER_ALERT_ID = 'before-5';

/** how many calendar days ahead to schedule wind-down reminders (today + next N-1 days) */
export const PLANNER_WIND_DOWN_REMINDER_LOOKAHEAD_DAYS = 14;

/** per-day notification task ids — avoids one id colliding across multiple scheduled days */
export function buildPlannerWindDownReminderTaskId(dateStr: string): string {
  return `${PLANNER_SLEEP_ANCHOR_TASK_ID}__${dateStr}`;
}

export function isPlannerWindDownReminderTaskId(id: string): boolean {
  return id.startsWith(`${PLANNER_SLEEP_ANCHOR_TASK_ID}__`);
}

export function isPlannerScheduleAnchorTaskId(id: string): boolean {
  return id === PLANNER_WAKE_ANCHOR_TASK_ID || id === PLANNER_SLEEP_ANCHOR_TASK_ID;
}

/** light grey-ish card tone so anchors read as ambience, not a category */
const ANCHOR_TASK_COLOR: TaskColor = 'teal';

function baseAnchorPartial(
  id: string,
  title: string,
  timeHm: string,
  dueDateIso: string,
  options?: { includeWindDownDefaultAlert?: boolean },
): Task {
  return {
    id,
    userId: 'planner-local',
    listId: null,
    title,
    description: '',
    time: timeHm,
    duration: 0,
    dueDate: dueDateIso,
    isCompleted: false,
    completedAt: null,
    priorityLevel: 3,
    color: ANCHOR_TASK_COLOR,
    routineType: 'once',
    sortOrder: 0,
    metadata: {
      subtasks: [],
      reminders: options?.includeWindDownDefaultAlert
        ? mapAlertIdsToTaskReminders([PLANNER_WIND_DOWN_REMINDER_ALERT_ID])
        : [],
    },
    softDeleted: false,
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
  };
}

/**
 * Builds up to two tasks for wake + sleep anchors; caller supplies `dueDate` as iso for the planner day.
 */
export function buildPlannerWakeSleepAnchorTasks(
  wakeHHMM: string,
  sleepHHMM: string,
  dueDateIso: string | null,
): Task[] {
  if (!dueDateIso) return [];
  const wake = wakeHHMM.trim();
  const sleep = sleepHHMM.trim();
  if (!isValidWakeSleepHHMM(wake) || !isValidWakeSleepHHMM(sleep)) return [];

  const wakeTask = baseAnchorPartial(PLANNER_WAKE_ANCHOR_TASK_ID, 'Wake up', wake, dueDateIso);
  const sleepTask = baseAnchorPartial(
    PLANNER_SLEEP_ANCHOR_TASK_ID,
    'Wind Down',
    sleep,
    dueDateIso,
    { includeWindDownDefaultAlert: true },
  );
  return [wakeTask, sleepTask];
}

/**
 * synthetic task used only for scheduling local wind-down reminders for one calendar day.
 * not shown on the timeline — the visible anchor keeps the fixed sleep anchor id.
 */
export function buildPlannerWindDownReminderTask(sleepHHMM: string, dateStr: string): Task {
  const dueDate = `${dateStr}T12:00:00`;
  return {
    ...baseAnchorPartial(
      buildPlannerWindDownReminderTaskId(dateStr),
      'Wind Down',
      sleepHHMM,
      dueDate,
      { includeWindDownDefaultAlert: true },
    ),
  };
}
