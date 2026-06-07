/**
 * Planner weekly day selector — typography + color tokens in one place.
 *
 * Edit `PLANNER_WEEK_SELECTOR_CHROME` to restyle the Mon–Sun row and month header.
 * Typography uses `TextStyles` keys from Typography.ts; optional `fontWeight` overrides the token weight.
 * Colors use theme roles so light/dark mode stay correct.
 */

import type { TextStyle } from 'react-native';

import { getMarpleBrandColor } from '@/constants/ColorPalette';
import { getTextStyle, FontWeight, type TextStyleName } from '@/constants/Typography';
import type { useThemeColors } from '@/hooks/useColorPalette';
import type { useTypography } from '@/hooks/useTypography';

/** theme / brand color roles — resolved at runtime to hex strings */
export type WeekSelectorColorRole =
  | 'text.primary'
  | 'text.secondary'
  | 'text.tertiary'
  | 'text.invertedPrimary'
  | 'text.invertedSecondary'
  | 'background.primary'
  | 'background.primarySecondaryBlend'
  | 'background.elevated'
  | 'background.invertedPrimary'
  | 'brand.marple500'
  | 'brand.marple600'
  | 'brand.marple700';

/** one text label — `textStyle` from Typography.ts; optional `fontWeight` overrides that token */
export type WeekSelectorTextChrome = {
  /** key from `TextStyles` in Typography.ts — e.g. 'body-medium', 'heading-2', 'heading-3' */
  textStyle: TextStyleName;
  /** optional — e.g. FontWeight.bold ('700'); omit to use the textStyle token's weight */
  fontWeight?: TextStyle['fontWeight'];
  color: WeekSelectorColorRole;
};

export type PlannerWeekSelectorChromeConfig = {
  /** tappable month row above the week grid (e.g. "6 March 2026") */
  monthHeader: {
    dayMonth: WeekSelectorTextChrome;
    year: WeekSelectorTextChrome;
  };
  /** chevron beside the month header */
  monthHeaderChevron: {
    color: WeekSelectorColorRole;
    /** ionicons chevron-forward size — keep smaller than day/month text */
    size: number;
    /** horizontal gap between the year label and chevron — use negative values to tuck the icon closer */
    gapFromYear: number;
  };
  /** single-letter day header (M, T, W…) */
  dayLetter: {
    default: WeekSelectorTextChrome;
    selected: WeekSelectorTextChrome;
  };
  /** calendar date number under the letter */
  dayNumber: {
    default: WeekSelectorTextChrome;
    selected: WeekSelectorTextChrome;
  };
  /** vertical pill behind the selected column */
  selectedBackground: {
    color: WeekSelectorColorRole;
  };
  /** spacing + touch target for each day column */
  layout: {
    letterNumberGap: number;
    columnMinWidth: number;
    columnPaddingVertical: number;
    columnPaddingHorizontal: number;
    pillBorderRadius: number;
    /** fixed touch target height so typography changes do not shift the row */
    columnMinHeight: number;
    /** gap above the Mon–Sun row (planner uses hideMonthHeader on ios) */
    sectionPaddingTop: number;
    sectionPaddingBottom: number;
  };
};

/** default planner week selector look — change values here to tweak the UI globally */
export const PLANNER_WEEK_SELECTOR_CHROME: PlannerWeekSelectorChromeConfig = {
  monthHeader: {
    dayMonth: {
      textStyle: 'heading-3',
      fontWeight: FontWeight.semibold,
      color: 'text.primary',
    },
    year: {
      textStyle: 'heading-3',
      color: 'brand.marple600',
    },
  },
  monthHeaderChevron: {
    color: 'brand.marple600',
    size: 20,
    gapFromYear: 2,
  },
  dayLetter: {
    default: {
      textStyle: 'body-medium',
      color: 'text.tertiary',
    },
    selected: {
      textStyle: 'body-medium',
      color: 'brand.marple500',
    },
  },
  dayNumber: {
    default: {
      textStyle: 'body-medium',

      color: 'text.primary',
    },
    selected: {
      textStyle: 'body-large',
      fontWeight: FontWeight.bold,
      color: 'brand.marple600',
    },
  },
  selectedBackground: {
    color: 'background.primarySecondaryBlend',
  },
  layout: {
    letterNumberGap: 4,
    columnMinWidth: 44,
    columnPaddingVertical: 10,
    columnPaddingHorizontal: 10,
    pillBorderRadius: 999,
    columnMinHeight: 56,
    sectionPaddingTop: 8,
    sectionPaddingBottom: 6,
  },
};

export type ResolvedWeekSelectorChrome = {
  monthHeader: { dayMonth: TextStyle; year: TextStyle };
  monthHeaderChevronColor: string;
  monthHeaderChevronSize: number;
  monthHeaderChevronGapFromYear: number;
  dayLetter: { default: TextStyle; selected: TextStyle };
  dayNumber: { default: TextStyle; selected: TextStyle };
  selectedBackgroundColor: string;
  layout: PlannerWeekSelectorChromeConfig['layout'];
};

type ThemeColors = ReturnType<typeof useThemeColors>;

/** resolves a theme role string to the current light/dark hex from the palette hook */
export function resolveWeekSelectorColor(themeColors: ThemeColors, role: WeekSelectorColorRole): string {
  switch (role) {
    case 'text.primary':
      return themeColors.text.primary();
    case 'text.secondary':
      return themeColors.text.secondary();
    case 'text.tertiary':
      return themeColors.text.tertiary();
    case 'text.invertedPrimary':
      return themeColors.text.invertedPrimary();
    case 'text.invertedSecondary':
      return themeColors.text.invertedSecondary();
    case 'background.primary':
      return themeColors.background.primary();
    case 'background.primarySecondaryBlend':
      return themeColors.background.primarySecondaryBlend();
    case 'background.elevated':
      return themeColors.background.elevated();
    case 'background.invertedPrimary':
      return themeColors.background.invertedPrimary();
    case 'brand.marple500':
      return getMarpleBrandColor(500);
    case 'brand.marple600':
      return getMarpleBrandColor(600);
    case 'brand.marple700':
      return getMarpleBrandColor(700);
    default: {
      const _exhaustive: never = role;
      return _exhaustive;
    }
  }
}

function resolveTextChrome(
  themeColors: ThemeColors,
  typography: ReturnType<typeof useTypography>,
  token: WeekSelectorTextChrome
): TextStyle {
  return {
    ...typography.getTextStyle(token.textStyle),
    ...(token.fontWeight !== undefined ? { fontWeight: token.fontWeight } : null),
    color: resolveWeekSelectorColor(themeColors, token.color),
  };
}

/** builds runtime text styles + selected pill color from the static chrome config */
export function resolvePlannerWeekSelectorChrome(
  themeColors: ThemeColors,
  typography: ReturnType<typeof useTypography>,
  config: PlannerWeekSelectorChromeConfig = PLANNER_WEEK_SELECTOR_CHROME
): ResolvedWeekSelectorChrome {
  return {
    monthHeader: {
      dayMonth: resolveTextChrome(themeColors, typography, config.monthHeader.dayMonth),
      year: resolveTextChrome(themeColors, typography, config.monthHeader.year),
    },
    monthHeaderChevronColor: resolveWeekSelectorColor(
      themeColors,
      config.monthHeaderChevron.color
    ),
    monthHeaderChevronSize: config.monthHeaderChevron.size,
    monthHeaderChevronGapFromYear: config.monthHeaderChevron.gapFromYear,
    dayLetter: {
      default: resolveTextChrome(themeColors, typography, config.dayLetter.default),
      selected: resolveTextChrome(themeColors, typography, config.dayLetter.selected),
    },
    dayNumber: {
      default: resolveTextChrome(themeColors, typography, config.dayNumber.default),
      selected: resolveTextChrome(themeColors, typography, config.dayNumber.selected),
    },
    selectedBackgroundColor: resolveWeekSelectorColor(
      themeColors,
      config.selectedBackground.color
    ),
    layout: config.layout,
  };
}

/** helper when you only need a one-off text style from the config (e.g. Storybook) */
export function weekSelectorTextStyleFromToken(token: WeekSelectorTextChrome): TextStyle {
  return {
    ...getTextStyle(token.textStyle),
    ...(token.fontWeight !== undefined ? { fontWeight: token.fontWeight } : null),
  };
}

/**
 * keeps row height stable when default vs selected use different Typography tokens.
 * uses the larger token for fontSize/lineHeight/weight; only color follows selection state.
 */
export function resolveStableWeekSelectorTextStyle(
  defaultStyle: TextStyle,
  selectedStyle: TextStyle,
  isSelected: boolean
): TextStyle {
  const activeStyle = isSelected ? selectedStyle : defaultStyle;
  const layoutStyle =
    (selectedStyle.fontSize ?? 0) >= (defaultStyle.fontSize ?? 0)
      ? selectedStyle
      : defaultStyle;

  const resolvedLineHeight =
    Math.max(
      typeof defaultStyle.lineHeight === 'number' ? defaultStyle.lineHeight : 0,
      typeof selectedStyle.lineHeight === 'number' ? selectedStyle.lineHeight : 0
    ) ||
    layoutStyle.lineHeight ||
    layoutStyle.fontSize;

  return {
    fontSize: layoutStyle.fontSize,
    lineHeight: resolvedLineHeight,
    fontWeight: activeStyle.fontWeight ?? layoutStyle.fontWeight,
    fontFamily: layoutStyle.fontFamily,
    letterSpacing: layoutStyle.letterSpacing,
    color: activeStyle.color,
  };
}
