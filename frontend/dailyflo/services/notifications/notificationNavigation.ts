/**
 * maps expo notification payload `data` → expo-router href when user taps a banner.
 */

import type { Href } from 'expo-router';

import { isPlannerWindDownReminderTaskId } from '@/components/features/timeline/plannerScheduleAnchors';
import { getBaseTaskId } from '@/utils/recurrenceUtils';

const CALENDAR_DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

/** pull YYYY-MM-DD from taskStartIso for older notifications missing occurrenceDate */
function occurrenceDateFromTaskStartIso(taskStartIso: unknown): string | null {
  if (typeof taskStartIso !== 'string') return null;
  try {
    const d = new Date(taskStartIso);
    if (Number.isNaN(d.getTime())) return null;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  } catch {
    return null;
  }
}

/** build router target from notification content.data — null when unknown / not actionable */
export function getHrefFromNotificationData(data: unknown): Href | null {
  if (!data || typeof data !== 'object') return null;

  const payload = data as Record<string, unknown>;
  const type = payload.type;

  if (type === 'wind_down_reminder') {
    return '/(tabs)/planner' as Href;
  }

  if (type !== 'task_reminder' || typeof payload.taskId !== 'string') {
    return null;
  }

  const rawTaskId = payload.taskId;
  if (isPlannerWindDownReminderTaskId(rawTaskId)) {
    return '/(tabs)/planner' as Href;
  }

  const taskId = getBaseTaskId(rawTaskId);
  const params: Record<string, string> = { taskId };

  if (typeof payload.occurrenceDate === 'string' && CALENDAR_DAY_RE.test(payload.occurrenceDate)) {
    params.occurrenceDate = payload.occurrenceDate;
  } else {
    const inferred = occurrenceDateFromTaskStartIso(payload.taskStartIso);
    if (inferred) params.occurrenceDate = inferred;
  }

  return { pathname: '/task/[taskId]', params } as Href;
}
