/**
 * vertical gaps between two scheduled times on the planner timeline (non-overlapping case).
 * lives beside `TimelineView` so onboarding can reuse the same spacing without importing the full component.
 */

export const TIMELINE_SPACING_LESS_THAN_30_MIN = 20;
export const TIMELINE_SPACING_30_MIN_TO_2_HOURS = 84;
export const TIMELINE_SPACING_MORE_THAN_2_HOURS = 140;

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
