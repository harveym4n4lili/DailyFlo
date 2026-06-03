/**
 * browse gamification board — layout, colors, and chrome (not copy/typography).
 * glow + streak/progress accent use marple brand ramp — pass resolved hex from `useBrandColors()`.
 */

import { Platform, type ViewStyle } from 'react-native';
import type { BrandColorShade } from '@/constants/ColorPalette';
import { GamificationColors } from '@/constants/ColorPalette';
import { Paddings } from '@/constants/Paddings';

/** matches grouped list card radius on browse/settings */
export const PROGRESS_BOARD_CARD_BORDER_RADIUS = 24;

/** liquid glass shell — aligned with planner content panel (`PlannerContentGlassShell`) */
export const PROGRESS_BOARD_GLASS_BORDER_WIDTH = 0.7;
export const PROGRESS_BOARD_GLASS_VEIL_OPACITY = 0.35;
export const PROGRESS_BOARD_GLASS_TINT_OPACITY = 0.72;

/** marple step for progress bar fill + ios glow shadow (marple 600) */
export const PROGRESS_BOARD_PROGRESS_FILL_SHADE: BrandColorShade = 600;

/** marple step for progress track tint (behind the fill) */
export const PROGRESS_BOARD_BRAND_TRACK_SHADE: BrandColorShade = 500;

export const PROGRESS_BOARD_TRACK_HEIGHT = Paddings.touchTarget + 2;
export const PROGRESS_BOARD_TRACK_RADIUS = PROGRESS_BOARD_TRACK_HEIGHT / 2;

/** per-item inset — same tokens as `GroupedList` defaults / browse settings */
export const PROGRESS_BOARD_GROUPED_LIST_CONTENT_PADDING_HORIZONTAL =
  Paddings.groupedListContentHorizontal;
export const PROGRESS_BOARD_GROUPED_LIST_CONTENT_PADDING_VERTICAL = Paddings.groupedListContentVertical;

/** ios glow on filled progress segment — `glowColor` = marple hex */
export function getProgressBoardFillGlow(glowColor: string): ViewStyle {
  return Platform.select({
    ios: {
      shadowColor: glowColor,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.85,
      shadowRadius: Paddings.touchTarget,
    },
    android: { elevation: 4 },
    default: {},
  }) as ViewStyle;
}

/** vertical gap between rows inside each grouped-list item (count row, track, hint) */
export const PROGRESS_BOARD_CONTENT_ROW_GAP = Paddings.touchTargetSmall;

/** extra space below "Daily Streak" / "Today's Tasks" section headers */
export const PROGRESS_BOARD_SECTION_LABEL_MARGIN_BOTTOM = Paddings.touchTargetSmall;

/** horizontal gap inside streak count row and today's tasks count row */
export const PROGRESS_BOARD_SECONDARY_ROW_GAP = Paddings.touchTargetSmall + 2;

/** golden medal beside day/days when `isProgressBoardNewBestStreak` is true */
export const PROGRESS_BOARD_NEW_BEST_STAR_SIZE = Paddings.groupedListIconSize;
/** re-export for board code — source of truth: `GamificationColors.newBestStreakMedalGold` in ColorPalette.ts */
export const PROGRESS_BOARD_NEW_BEST_STAR_COLOR = GamificationColors.newBestStreakMedalGold;

/** ios medal glow spread — tune in `progressBoardUiTokens` (smaller radius = tighter halo) */
export const PROGRESS_BOARD_NEW_BEST_MEDAL_GLOW_SHADOW_RADIUS = 4;
export const PROGRESS_BOARD_NEW_BEST_MEDAL_GLOW_SHADOW_OPACITY = 0.55;
export const PROGRESS_BOARD_NEW_BEST_MEDAL_GLOW_ELEVATION = 2;

/** soft halo around the new-best medal — `glowColor` should match medal fill */
export function getProgressBoardNewBestStarGlow(glowColor: string): ViewStyle {
  return Platform.select({
    ios: {
      shadowColor: glowColor,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: PROGRESS_BOARD_NEW_BEST_MEDAL_GLOW_SHADOW_OPACITY,
      shadowRadius: PROGRESS_BOARD_NEW_BEST_MEDAL_GLOW_SHADOW_RADIUS,
    },
    android: { elevation: PROGRESS_BOARD_NEW_BEST_MEDAL_GLOW_ELEVATION },
    default: {},
  }) as ViewStyle;
}

/** productivity nav row — matches browse settings grouped-list icons */
export const PROGRESS_BOARD_PRODUCTIVITY_ICON_SIZE = Paddings.groupedListIconSize;
export const PROGRESS_BOARD_PRODUCTIVITY_ICON_SHADE: BrandColorShade = 500;

export const PROGRESS_BOARD_GOAL_COUNT_GAP = Paddings.touchTargetSmall;
export const PROGRESS_BOARD_CARD_MARGIN_BOTTOM = Paddings.groupedListHeaderContentGap;
export const PROGRESS_BOARD_LOADER_PADDING_VERTICAL = Paddings.sectionCompact;

/** track background alpha when layered on card */
export const PROGRESS_BOARD_TRACK_MARPLE_OPACITY_DARK = 0.35;
export const PROGRESS_BOARD_TRACK_MARPLE_OPACITY_LIGHT = 0.12;
