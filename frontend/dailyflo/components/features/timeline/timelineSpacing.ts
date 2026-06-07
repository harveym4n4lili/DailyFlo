/**
 * vertical gaps between two scheduled times on the planner timeline (non-overlapping case).
 * lives beside `TimelineView` so onboarding can reuse the same spacing without importing the full component.
 * free-time copy in those gaps uses `TIMELINE_CONTENT_LEFT` from `timelineChrome.ts` to align with task text.
 */

export const TIMELINE_SPACING_LESS_THAN_30_MIN = 20;
export const TIMELINE_SPACING_30_MIN_TO_2_HOURS = 64;
export const TIMELINE_SPACING_MORE_THAN_2_HOURS = 120;

/**
 * @param timeDifferenceMinutes — minutes from previous block’s end to next block’s start (same as `TimelineView` loop)
 */
export function getTimelineTaskGapPx(timeDifferenceMinutes: number): number {
  if (timeDifferenceMinutes < 30) {
    return TIMELINE_SPACING_LESS_THAN_30_MIN;
  }
  if (timeDifferenceMinutes <= 120) {
    return TIMELINE_SPACING_30_MIN_TO_2_HOURS;
  }
  return TIMELINE_SPACING_MORE_THAN_2_HOURS;
}
