/**
 * browse gamification board — layout, colors, and chrome (not copy/typography).
 * streak/progress accent uses marple brand ramp — pass resolved hex from `useBrandColors()`.
 */

import type { BrandColorShade } from '@/constants/ColorPalette';
import { GamificationColors } from '@/constants/ColorPalette';
import { Paddings } from '@/constants/Paddings';
import { lerpIntroHexColor } from '@/components/features/onboarding/auth/scrollTransition/introThemeResolvers';

/** matches grouped list card radius on browse/settings */
export const PROGRESS_BOARD_CARD_BORDER_RADIUS = 24;

/** liquid glass shell — aligned with planner content panel (`PlannerContentGlassShell`) */
export const PROGRESS_BOARD_GLASS_BORDER_WIDTH = 0.7;
export const PROGRESS_BOARD_GLASS_VEIL_OPACITY = 0.35;
export const PROGRESS_BOARD_GLASS_TINT_OPACITY = 0.72;

/** marple ramp for progress fill — 500 → 600 */
export const PROGRESS_BOARD_PROGRESS_GRADIENT_START_SHADE: BrandColorShade = 500;
export const PROGRESS_BOARD_PROGRESS_GRADIENT_END_SHADE: BrandColorShade = 600;

/** expo-linear-gradient vector — bottom (500) → top (600) */
export const PROGRESS_BOARD_FILL_GRADIENT_START_POINT = { x: 0.5, y: 1 } as const;
export const PROGRESS_BOARD_FILL_GRADIENT_END_POINT = { x: 0.5, y: 0 } as const;

/**
 * where the top stop lands — higher = more marple 500, softer shift (e.g. 0.88 keeps 600 in the upper band only).
 * end stop color is also lerped toward 500 via PROGRESS_BOARD_FILL_GRADIENT_END_BLEND.
 */
export const PROGRESS_BOARD_FILL_GRADIENT_LOCATIONS = [0, 0.88] as const;

/** 0 = full 500, 1 = full 600 — keep low for a subtle, broad gradient */
export const PROGRESS_BOARD_FILL_GRADIENT_END_BLEND = 0.28;

export const PROGRESS_BOARD_TRACK_HEIGHT = Paddings.touchTarget + 2;
export const PROGRESS_BOARD_TRACK_RADIUS = PROGRESS_BOARD_TRACK_HEIGHT / 2;

/** extra space between today's tasks count row and the progress bar (adds to contentRow gap) */
export const PROGRESS_BOARD_TRACK_MARGIN_TOP = Paddings.listItemVertical;

/** per-item inset — same tokens as `GroupedList` defaults / browse settings */
export const PROGRESS_BOARD_GROUPED_LIST_CONTENT_PADDING_HORIZONTAL =
  Paddings.groupedListContentHorizontal;
export const PROGRESS_BOARD_GROUPED_LIST_CONTENT_PADDING_VERTICAL = Paddings.groupedListContentVertical;

/** vertical gap between rows inside each grouped-list item (count row, track, hint) */
export const PROGRESS_BOARD_CONTENT_ROW_GAP = Paddings.touchTargetSmall;

/** extra space below "Daily Streak" / "Today's Tasks" section headers */
export const PROGRESS_BOARD_SECTION_LABEL_MARGIN_BOTTOM = Paddings.touchTargetSmall;

/** horizontal gap inside streak count row and today's tasks count row */
export const PROGRESS_BOARD_SECONDARY_ROW_GAP = Paddings.touchTargetSmall + 2;

/** new-best / longest-streak medal — same 18pt as FormDetailButton grouped-list row icons */
export const PROGRESS_BOARD_LONGEST_STREAK_ICON_SIZE = Paddings.groupedListIconSize;
/** @deprecated use PROGRESS_BOARD_LONGEST_STREAK_ICON_SIZE */
export const PROGRESS_BOARD_NEW_BEST_STAR_SIZE = PROGRESS_BOARD_LONGEST_STREAK_ICON_SIZE;
/** re-export for board code — source of truth: `GamificationColors.newBestStreakMedalGold` in ColorPalette.ts */
export const PROGRESS_BOARD_NEW_BEST_STAR_COLOR = GamificationColors.newBestStreakMedalGold;

/** medal gradient left stop — blended toward base gold */
export const PROGRESS_BOARD_NEW_BEST_MEDAL_GRADIENT_HIGHLIGHT = '#FCD34D';
/** 0 = flat gold, 1 = full highlight on the left */
export const PROGRESS_BOARD_NEW_BEST_MEDAL_GRADIENT_HIGHLIGHT_BLEND = 0.48;

/** [left lighter, right base] for ProgressBoardNewBestMedalIcon horizontal fill */
export function getProgressBoardNewBestMedalGradientColors(
  baseColor: string = PROGRESS_BOARD_NEW_BEST_STAR_COLOR
): readonly [string, string] {
  const left = lerpIntroHexColor(
    baseColor,
    PROGRESS_BOARD_NEW_BEST_MEDAL_GRADIENT_HIGHLIGHT,
    PROGRESS_BOARD_NEW_BEST_MEDAL_GRADIENT_HIGHLIGHT_BLEND
  );
  return [left, baseColor] as const;
}

/** productivity nav row — same grouped-list icon slot */
export const PROGRESS_BOARD_PRODUCTIVITY_ICON_SIZE = PROGRESS_BOARD_LONGEST_STREAK_ICON_SIZE;
export const PROGRESS_BOARD_PRODUCTIVITY_ICON_SHADE: BrandColorShade = 500;

export const PROGRESS_BOARD_GOAL_COUNT_GAP = Paddings.touchTargetSmall;
export const PROGRESS_BOARD_CARD_MARGIN_BOTTOM = Paddings.groupedListHeaderContentGap;
export const PROGRESS_BOARD_LOADER_PADDING_VERTICAL = Paddings.sectionCompact;
