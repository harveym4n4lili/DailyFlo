/**
 * habit increment ring colors — icon 300, progress arc 500, track 500 darkened 60%.
 */

import { lerpIntroHexColor } from '@/components/features/onboarding/auth/scrollTransition/introThemeResolvers';
import { getTaskColorValue } from '@/utils/taskColors';
import type { HabitColor } from '@/types/api/habits';

/** darken amount for the ring track — matches heatmap lowest partial tier */
const HABIT_RING_TRACK_DARKEN = 0.6;

export function getHabitProgressRingColors(color: HabitColor) {
  const progress = getTaskColorValue(color, 500);
  return {
    progress,
    track: lerpIntroHexColor(progress, '#000000', HABIT_RING_TRACK_DARKEN),
    icon: getTaskColorValue(color, 300),
  };
}
