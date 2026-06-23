/**
 * shared layout tokens + GroupedList props for habit create/edit — mirrors browse list-create.tsx.
 */

import { Paddings } from '@/constants/Paddings';
import type { useThemeColors } from '@/hooks/useColorPalette';

export const HABIT_FORM_HEADER_ROW_HEIGHT = 42;
export const HABIT_FORM_HEADER_TOP = Paddings.screen;
export const HABIT_FORM_FADE_OVERFLOW = 48;
export const HABIT_FORM_TOP_SECTION_HEIGHT =
  HABIT_FORM_HEADER_TOP + HABIT_FORM_HEADER_ROW_HEIGHT + HABIT_FORM_FADE_OVERFLOW;

type ThemeColors = ReturnType<typeof useThemeColors>;

/** same card chrome as list-create grouped lists (radius 24, solid separators) */
export function getHabitFormListGroupProps(themeColors: ThemeColors) {
  return {
    backgroundColor: themeColors.background.primarySecondaryBlend(),
    separatorColor: themeColors.border.primary(),
    separatorInsetRight: Paddings.groupedListContentHorizontal,
    separatorVariant: 'solid' as const,
    borderRadius: Paddings.groupedListBorderRadius,
    minimalStyle: false,
    separatorConsiderIconColumn: true,
    iconColumnWidth: 30,
    itemPadding: 'root' as const,
  };
}

/** title row has no leading icon — separator spans full width like list name field */
export function getHabitFormNameGroupProps(themeColors: ThemeColors) {
  return {
    ...getHabitFormListGroupProps(themeColors),
    separatorConsiderIconColumn: false,
    contentMinHeight: 0,
  };
}
