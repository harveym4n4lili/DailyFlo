/**
 * wake/sleep schedule strings live in django `preferences` as `wake_time` / `sleep_time` (`HH:mm` local intent).
 * the planner timeline still uses coarse hour anchors (`startHour` / `endHour`) built from those strings.
 */

import { timeToMinutes, minutesToTime } from '@/components/features/timeline/timelineUtils';

/** matches planner defaults before onboarding or old accounts without persisted schedule */
export const DEFAULT_WAKE_HHMM = '06:00';
export const DEFAULT_SLEEP_HHMM = '23:00';

const HHMM_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** fast guard so bad api data never blows up planners */
export function isValidWakeSleepHHMM(s: string | undefined | null): s is string {
  return !!s && HHMM_RE.test(s.trim());
}

export function coerceWakeSleepHHMM(value: string | undefined | null, fallback: string): string {
  const trimmed = (value ?? '').trim();
  if (isValidWakeSleepHHMM(trimmed)) return trimmed;
  return fallback;
}

/** picker components want a Date — use today's calendar date with saved clock fields */
export function hhmmLocalToReferenceDate(value: string, fallbackHHMM: string): Date {
  const safe = coerceWakeSleepHHMM(value, fallbackHHMM);
  const [hours, mins] = safe.split(':').map(Number);
  const d = new Date();
  d.setHours(hours, mins, 0, 0);
  return d;
}

/**
 * onboarding stores iso instants (`wakeTimeIso`) — strip to local clock `HH:mm` matching questionnaire wheels.
 */
export function isoInstantToLocalHHMM(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return DEFAULT_WAKE_HHMM;
    return minutesToTime(d.getHours() * 60 + d.getMinutes());
  } catch {
    return DEFAULT_WAKE_HHMM;
  }
}

/**
 * round to 15-minute steps so settings + onboarding wheels stay visually consistent (`minuteInterval={15}`).
 */
export function snapMinutesToQuarterHour(totalMinutesFromMidnight: number): number {
  const capped = Math.max(0, Math.min(24 * 60 - 15, totalMinutesFromMidnight));
  return Math.round(capped / 15) * 15;
}

export function snapWakeSleepHHMM(raw: string, fallback: string): string {
  const base = coerceWakeSleepHHMM(raw, fallback);
  const snapped = snapMinutesToQuarterHour(timeToMinutes(base));
  return minutesToTime(snapped);
}

/**
 * TimelineView anchors are whole hours; widen to cover fractional wake/sleep (e.g. 07:30 → start hour 7, end padded).
 * if sleep crosses midnight (sleep <= wake after parsing), stretch to end-of-day instead of exploding math.
 */
export function timelinePlannerHoursFromWakeSleepHHMM(wakeHHMM: string, sleepHHMM: string): { startHour: number; endHour: number } {
  const w = timeToMinutes(coerceWakeSleepHHMM(wakeHHMM, DEFAULT_WAKE_HHMM));
  let s = timeToMinutes(coerceWakeSleepHHMM(sleepHHMM, DEFAULT_SLEEP_HHMM));
  if (s <= w) {
    // overnight schedule not supported yet — keep a usable daytime band
    s = Math.min(23 * 60 + 45, w + 16 * 60);
  }
  const startHour = Math.max(0, Math.floor(w / 60));
  const endHour = Math.min(23, Math.ceil(s / 60));
  return { startHour, endHour: Math.max(endHour, startHour + 1) };
}

/**
 * converts a picker `Date` (today + chosen clock) → stored `HH:mm` string on the same 15m grid onboarding uses.
 */
export function scheduleDateToSnappedHHMM(date: Date): string {
  const total = date.getHours() * 60 + date.getMinutes();
  return minutesToTime(snapMinutesToQuarterHour(total));
}

/** human label for grouped settings rows respecting stored `preferences.timeFormat` choice */
export function formatWakeSleepLabel(
  rawHHMM: string,
  fallbackHHMM: string,
  timeFormat: '12h' | '24h',
): string {
  const safe = coerceWakeSleepHHMM(rawHHMM, fallbackHHMM);
  const [hours, mins] = safe.split(':').map(Number);
  const d = new Date();
  d.setHours(hours, mins, 0, 0);
  return d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: timeFormat === '12h',
  });
}
