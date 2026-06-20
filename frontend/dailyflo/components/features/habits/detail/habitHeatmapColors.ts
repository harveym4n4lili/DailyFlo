/**
 * heatmap cell fill — Less→More: 500@60%, 500@30%, 500, 300 (complete).
 */

import { lerpIntroHexColor } from '@/components/features/onboarding/auth/scrollTransition/introThemeResolvers';
import type { useThemeColors } from '@/hooks/useColorPalette';
import { getTaskColorValue } from '@/utils/taskColors';
import type { HabitColor, HabitHeatmapData } from '@/types/api/habits';

/** darken amount applied to palette 500 for the two lowest partial tiers */
const HEATMAP_DARKEN_MILD = 0.3;
const HEATMAP_DARKEN_STRONG = 0.6;

/** one score per legend swatch — must match heatmapScoreToTier bands */
const LEGEND_SCORES = [0.125, 0.375, 0.625, 1] as const;

export type HabitHeatmapLegendItem = {
  score: number;
  fill: string;
};

/** 0 = most (300), 1 = 500, 2 = 500+30%, 3 = 500+60%; -1 = empty */
function heatmapScoreToTier(score: number): number {
  if (score <= 0) return -1;
  if (score >= 1) return 0;
  if (score > 0.5) return 1;
  if (score > 0.25) return 2;
  return 3;
}

function heatmapFillForTier(tier: number, color: HabitColor): string {
  const base500 = getTaskColorValue(color, 500);

  switch (tier) {
    case 0:
      return getTaskColorValue(color, 300);
    case 1:
      return base500;
    case 2:
      return lerpIntroHexColor(base500, '#000000', HEATMAP_DARKEN_MILD);
    case 3:
      return lerpIntroHexColor(base500, '#000000', HEATMAP_DARKEN_STRONG);
    default:
      return base500;
  }
}

export function getHabitHeatmapLegendItems(
  color: HabitColor,
  themeColors: ReturnType<typeof useThemeColors>,
): HabitHeatmapLegendItem[] {
  return LEGEND_SCORES.map((score) => ({
    score,
    fill: getHabitHeatmapCellFill(score, color, themeColors),
  }));
}

export function getHabitHeatmapDayScore(
  heatmap: HabitHeatmapData,
  dayIso: string,
): number {
  const fromScores = heatmap.dayScores?.[dayIso];
  if (fromScores != null) {
    return fromScores;
  }
  return heatmap.completedDates.includes(dayIso) ? 1 : 0;
}

export function getHabitHeatmapCellFill(
  score: number,
  color: HabitColor,
  themeColors: ReturnType<typeof useThemeColors>,
): string {
  const emptyFill = themeColors.withOpacity(themeColors.text.tertiary(), 0.2);
  if (score <= 0) {
    return emptyFill;
  }

  const tier = heatmapScoreToTier(score);
  return heatmapFillForTier(tier, color);
}

/** score for today after a log — used by redux optimistic heatmap patches */
export function habitTodayHeatmapScore(
  trackingType: 'binary' | 'numeric',
  loggedValue: number,
  isCompleteToday: boolean,
  targetValue: number | null,
): number {
  if (trackingType === 'binary') {
    return isCompleteToday ? 1 : 0;
  }
  const target = targetValue ?? 1;
  if ((loggedValue ?? 0) <= 0) {
    return 0;
  }
  return isCompleteToday ? 1 : Math.min(1, (loggedValue ?? 0) / target);
}

export function patchHabitHeatmapDayScore(
  heatmap: HabitHeatmapData,
  dayIso: string,
  score: number,
): HabitHeatmapData {
  if (!dayIso) return heatmap;

  const dayScores = { ...(heatmap.dayScores ?? {}) };
  const clamped = Math.max(0, Math.min(1, score));

  if (clamped <= 0) {
    delete dayScores[dayIso];
  } else {
    dayScores[dayIso] = clamped;
  }

  const dates = new Set(heatmap.completedDates);
  if (clamped >= 1) {
    dates.add(dayIso);
  } else {
    dates.delete(dayIso);
  }

  return {
    ...heatmap,
    dayScores,
    completedDates: [...dates].sort(),
  };
}
