/**
 * Alert options for task reminders.
 * Shared by alert-select, alert-offset-select, and notification scheduling.
 */

export interface AlertOption {
  id: string;
  label: string;
  value: number; // minutes before (0 = start, -1 = end, positive = minutes before)
  /** ios SF Symbol — always `.fill` variant on alert screen */
  sfSymbol: string;
  /** android/web fallback — ionicons filled glyph name */
  ionicon: 'play' | 'stop' | 'alarm' | 'time';
}

/** legacy preset rows — still valid ids in saved tasks */
export const ALERT_OPTIONS: AlertOption[] = [
  { id: 'start', label: 'Start of task', value: 0, sfSymbol: 'play.fill', ionicon: 'play' },
  { id: 'end', label: 'End of task', value: -1, sfSymbol: 'stop.fill', ionicon: 'stop' },
  { id: '15-min', label: '15 minutes before', value: 15, sfSymbol: 'clock.fill', ionicon: 'time' },
];

export const END_TASK_ALERT_ID = 'end';

/** max hours on the add-alert native spinner (left wheel) */
export const ALERT_OFFSET_MAX_HOURS = 23;

/** minute steps on the add-alert native spinner (right wheel) */
export const ALERT_OFFSET_MINUTE_INTERVAL = 5;

/** legacy preset list — native spinner uses hour + minute wheels instead */
export const ALERT_OFFSET_MINUTES_PRESETS = [0, 5, 10, 15, 20, 30, 45, 60, 90, 120] as const;

/** convert stored offset minutes → date for countdown / time spinner wheels */
export function offsetMinutesToPickerDate(totalMinutes: number): Date {
  const maxMinuteStep = 60 - ALERT_OFFSET_MINUTE_INTERVAL;
  const maxMinutes = ALERT_OFFSET_MAX_HOURS * 60 + maxMinuteStep;
  const clamped = Math.max(0, Math.min(maxMinutes, totalMinutes));
  const hours = Math.floor(clamped / 60);
  const rawMinutes = clamped % 60;
  const snappedMinutes =
    Math.round(rawMinutes / ALERT_OFFSET_MINUTE_INTERVAL) * ALERT_OFFSET_MINUTE_INTERVAL;
  return new Date(2000, 0, 1, hours, snappedMinutes, 0);
}

/** read hour + minute wheels back into total minutes before task start */
export function pickerDateToOffsetMinutes(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

/** minute choices for the right spinner column (web fallback) */
export function getAlertOffsetMinuteWheelValues(): number[] {
  const values: number[] = [];
  for (let m = 0; m < 60; m += ALERT_OFFSET_MINUTE_INTERVAL) {
    values.push(m);
  }
  return values;
}

export function isEndAlertId(alertId: string): boolean {
  return alertId === END_TASK_ALERT_ID;
}

/** minutes before task start — null for end-of-task or unknown ids */
export function getMinutesBeforeStart(alertId: string): number | null {
  if (isEndAlertId(alertId)) return null;
  if (alertId === 'start' || alertId === 'before-0') return 0;
  if (alertId === '15-min') return 15;

  const match = /^before-(\d+)$/.exec(alertId);
  if (match) return parseInt(match[1], 10);

  const legacy = ALERT_OPTIONS.find((o) => o.id === alertId);
  if (legacy && legacy.value >= 0) return legacy.value;

  return null;
}

/** stable id when user picks an offset on the add-alert wheel */
export function alertIdForMinutesBefore(minutes: number): string {
  if (minutes <= 0) return 'start';
  if (minutes === 15) return '15-min';
  return `before-${minutes}`;
}

/** compare ids that represent the same reminder (start === before-0, 15-min === before-15) */
export function normalizeAlertIdForComparison(alertId: string): string {
  if (isEndAlertId(alertId)) return END_TASK_ALERT_ID;
  const minutes = getMinutesBeforeStart(alertId);
  if (minutes === null) return alertId;
  return alertIdForMinutesBefore(minutes);
}

export function isKnownAlertId(alertId: string): boolean {
  return isEndAlertId(alertId) || getMinutesBeforeStart(alertId) !== null;
}

/** human label for spinner wheel rows */
export function formatAlertOffsetWheelLabel(minutes: number): string {
  if (minutes <= 0) return 'At start of task';
  if (minutes === 1) return '1 minute before';
  if (minutes < 60) return `${minutes} minutes before`;
  if (minutes === 60) return '1 hour before';
  if (minutes % 60 === 0) return `${minutes / 60} hours before`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours} hr ${mins} min before`;
}

/** grouped list row copy + icons for a saved alert id */
export function getAlertRowDisplay(alertId: string): {
  label: string;
  sfSymbol: string;
  ionicon: AlertOption['ionicon'];
} {
  if (isEndAlertId(alertId)) {
    return { label: 'End of task', sfSymbol: 'stop.fill', ionicon: 'stop' };
  }

  const minutes = getMinutesBeforeStart(alertId);
  if (minutes === null) {
    return { label: alertId, sfSymbol: 'bell.fill', ionicon: 'alarm' };
  }

  if (minutes === 0) {
    return { label: 'Start of task', sfSymbol: 'play.fill', ionicon: 'play' };
  }

  return {
    label: formatAlertOffsetWheelLabel(minutes),
    sfSymbol: 'clock.fill',
    ionicon: 'time',
  };
}

/** sort for display: start first, ascending offsets, end last */
export function sortAlertIdsForDisplay(alertIds: string[]): string[] {
  const rank = (id: string): number => {
    if (isEndAlertId(id)) return Number.MAX_SAFE_INTEGER;
    const minutes = getMinutesBeforeStart(id);
    return minutes ?? Number.MAX_SAFE_INTEGER - 1;
  };

  return [...alertIds].sort((a, b) => rank(a) - rank(b));
}

/** end-of-task alert only applies when the task has a length (duration in minutes) */
export function taskHasDurationForEndAlert(duration: number | undefined | null): boolean {
  return typeof duration === 'number' && duration > 0;
}

/** alert picker rows — hides "End of task" when there is no duration */
export function getAlertOptionsForTask(duration: number | undefined | null): AlertOption[] {
  if (taskHasDurationForEndAlert(duration)) {
    return ALERT_OPTIONS;
  }
  return ALERT_OPTIONS.filter((option) => option.id !== END_TASK_ALERT_ID);
}

/** drop end alert from saved ids when duration was cleared */
export function withoutEndAlertUnlessDuration(
  alertIds: string[],
  duration: number | undefined | null,
): string[] {
  if (taskHasDurationForEndAlert(duration)) {
    return alertIds;
  }
  return alertIds.filter((id) => id !== END_TASK_ALERT_ID);
}
