/**
 * browse gamification board — typography per UI text slot (pairs with progressBoardTextValues.ts).
 * each slot: `*_TEXT_STYLE_NAME` (token from constants/Typography) + `*_STYLE_OVERRIDES` (wins over token).
 * colors come from theme in BrowseProgressCard — not here.
 */

import type { TextStyle } from 'react-native';
import { Platform } from 'react-native';

import {
  getTypographyStyle,
  getFontFamilyWithWeight,
  type Platform as TypographyPlatform,
  type TextStyleName,
  FontWeight,
} from '@/constants/Typography';

const TYPO_PLATFORM = Platform.OS as TypographyPlatform;

type FontWeightKey = keyof typeof FontWeight;

function fontWeightOverrideToFamilyKey(fontWeight: TextStyle['fontWeight']): FontWeightKey {
  const normalized = `${fontWeight ?? FontWeight.regular}`;
  return (
    (Object.entries(FontWeight).find(([, value]) => value === normalized)?.[0] as FontWeightKey) ??
    'regular'
  );
}

/**
 * merges token + overrides. if overrides include fontWeight, also swaps the Inter font file
 * (on ios/android, fontWeight alone does nothing while fontFamily still points at semibold).
 */
function resolveProgressBoardTextStyle(
  styleName: TextStyleName,
  styleOverrides: Partial<TextStyle>
): TextStyle {
  const base = getTypographyStyle(styleName, TYPO_PLATFORM);
  const merged: TextStyle = { ...base, ...styleOverrides };

  if (styleOverrides.fontWeight === undefined) {
    return merged;
  }

  const weightKey = fontWeightOverrideToFamilyKey(styleOverrides.fontWeight);
  const fontFamily = getFontFamilyWithWeight(weightKey, TYPO_PLATFORM);

  if (TYPO_PLATFORM === 'web') {
    return { ...merged, fontFamily, fontWeight: styleOverrides.fontWeight };
  }

  const { fontWeight: _drop, ...rest } = merged;
  return { ...rest, fontFamily };
}

// —— shared row typography (daily streak + today's tasks — same layout, same tokens) ——

/** section title: "Daily Streak" | "Today's Tasks" */
export const PROGRESS_BOARD_SECTION_LABEL_TEXT_STYLE_NAME: TextStyleName = 'body-large';
export const PROGRESS_BOARD_SECTION_LABEL_STYLE_OVERRIDES: Partial<TextStyle> = {};

function getProgressBoardSectionLabelTextStyle(): TextStyle {
  return resolveProgressBoardTextStyle(
    PROGRESS_BOARD_SECTION_LABEL_TEXT_STYLE_NAME,
    PROGRESS_BOARD_SECTION_LABEL_STYLE_OVERRIDES
  );
}

/** count row left primary: streak number | completed count */
export const PROGRESS_BOARD_COUNT_PRIMARY_TEXT_STYLE_NAME: TextStyleName = 'body-large';
export const PROGRESS_BOARD_COUNT_PRIMARY_STYLE_OVERRIDES: Partial<TextStyle> = {
  fontWeight: FontWeight.bold,
};

function getProgressBoardCountPrimaryTextStyle(): TextStyle {
  return resolveProgressBoardTextStyle(
    PROGRESS_BOARD_COUNT_PRIMARY_TEXT_STYLE_NAME,
    PROGRESS_BOARD_COUNT_PRIMARY_STYLE_OVERRIDES
  );
}

/** count row left secondary: day/days unit | /goal suffix */
export const PROGRESS_BOARD_COUNT_SECONDARY_TEXT_STYLE_NAME: TextStyleName = 'body-large';
export const PROGRESS_BOARD_COUNT_SECONDARY_STYLE_OVERRIDES: Partial<TextStyle> = {
  fontWeight: FontWeight.regular,
};

function getProgressBoardCountSecondaryTextStyle(): TextStyle {
  return resolveProgressBoardTextStyle(
    PROGRESS_BOARD_COUNT_SECONDARY_TEXT_STYLE_NAME,
    PROGRESS_BOARD_COUNT_SECONDARY_STYLE_OVERRIDES
  );
}

/** count row right trailing: longest streak | percent */
export const PROGRESS_BOARD_COUNT_TRAILING_TEXT_STYLE_NAME: TextStyleName = 'body-medium';
export const PROGRESS_BOARD_COUNT_TRAILING_STYLE_OVERRIDES: Partial<TextStyle> = {
  fontWeight: FontWeight.medium,
};

function getProgressBoardCountTrailingTextStyle(): TextStyle {
  return resolveProgressBoardTextStyle(
    PROGRESS_BOARD_COUNT_TRAILING_TEXT_STYLE_NAME,
    PROGRESS_BOARD_COUNT_TRAILING_STYLE_OVERRIDES
  );
}

// —— streak slots (aliases — keep per-line exports for progressBoardTextValues pairing) ——
export const PROGRESS_BOARD_STREAK_LABEL_TEXT_STYLE_NAME = PROGRESS_BOARD_SECTION_LABEL_TEXT_STYLE_NAME;
export const PROGRESS_BOARD_STREAK_LABEL_STYLE_OVERRIDES = PROGRESS_BOARD_SECTION_LABEL_STYLE_OVERRIDES;
export function getProgressBoardStreakLabelTextStyle(): TextStyle {
  return getProgressBoardSectionLabelTextStyle();
}

/** streak pill — same token as quick-add outlined pills (`body-large`); count is bold */
export const PROGRESS_BOARD_STREAK_COUNTER_TEXT_STYLE_NAME: TextStyleName = 'body-large';
export const PROGRESS_BOARD_STREAK_COUNTER_STYLE_OVERRIDES: Partial<TextStyle> = {
  fontWeight: FontWeight.bold,
};

export function getProgressBoardStreakCounterTextStyle(): TextStyle {
  return resolveProgressBoardTextStyle(
    PROGRESS_BOARD_STREAK_COUNTER_TEXT_STYLE_NAME,
    PROGRESS_BOARD_STREAK_COUNTER_STYLE_OVERRIDES
  );
}

export const PROGRESS_BOARD_STREAK_UNIT_TEXT_STYLE_NAME: TextStyleName = 'body-large';
export const PROGRESS_BOARD_STREAK_UNIT_STYLE_OVERRIDES: Partial<TextStyle> = {
  fontWeight: FontWeight.regular,
};

export function getProgressBoardStreakUnitTextStyle(): TextStyle {
  return resolveProgressBoardTextStyle(
    PROGRESS_BOARD_STREAK_UNIT_TEXT_STYLE_NAME,
    PROGRESS_BOARD_STREAK_UNIT_STYLE_OVERRIDES
  );
}

export const PROGRESS_BOARD_LONGEST_STREAK_TEXT_STYLE_NAME = PROGRESS_BOARD_COUNT_TRAILING_TEXT_STYLE_NAME;
export const PROGRESS_BOARD_LONGEST_STREAK_STYLE_OVERRIDES = PROGRESS_BOARD_COUNT_TRAILING_STYLE_OVERRIDES;
export function getProgressBoardLongestStreakTextStyle(): TextStyle {
  return getProgressBoardCountTrailingTextStyle();
}

// —— streak empty-state hint (no today's tasks equivalent) ——
export const PROGRESS_BOARD_STREAK_HINT_TEXT_STYLE_NAME: TextStyleName = 'body-medium';
/** body-medium token is medium — hint stays regular like before on body-large */
export const PROGRESS_BOARD_STREAK_HINT_STYLE_OVERRIDES: Partial<TextStyle> = {
  fontWeight: FontWeight.regular,
};

export function getProgressBoardStreakHintTextStyle(): TextStyle {
  return resolveProgressBoardTextStyle(
    PROGRESS_BOARD_STREAK_HINT_TEXT_STYLE_NAME,
    PROGRESS_BOARD_STREAK_HINT_STYLE_OVERRIDES
  );
}

// —— today's tasks slots (same shared tokens as streak) ——
export const PROGRESS_BOARD_TODAYS_TASKS_LABEL_TEXT_STYLE_NAME = PROGRESS_BOARD_SECTION_LABEL_TEXT_STYLE_NAME;
export const PROGRESS_BOARD_TODAYS_TASKS_LABEL_STYLE_OVERRIDES = PROGRESS_BOARD_SECTION_LABEL_STYLE_OVERRIDES;
export function getProgressBoardTodaysTasksLabelTextStyle(): TextStyle {
  return getProgressBoardSectionLabelTextStyle();
}

export const PROGRESS_BOARD_TASKS_COMPLETED_TEXT_STYLE_NAME = PROGRESS_BOARD_COUNT_PRIMARY_TEXT_STYLE_NAME;
export const PROGRESS_BOARD_TASKS_COMPLETED_STYLE_OVERRIDES = PROGRESS_BOARD_COUNT_PRIMARY_STYLE_OVERRIDES;
export function getProgressBoardTasksCompletedTextStyle(): TextStyle {
  return getProgressBoardCountPrimaryTextStyle();
}

export const PROGRESS_BOARD_TASKS_GOAL_SUFFIX_TEXT_STYLE_NAME = PROGRESS_BOARD_COUNT_SECONDARY_TEXT_STYLE_NAME;
export const PROGRESS_BOARD_TASKS_GOAL_SUFFIX_STYLE_OVERRIDES = PROGRESS_BOARD_COUNT_SECONDARY_STYLE_OVERRIDES;
export function getProgressBoardTasksGoalSuffixTextStyle(): TextStyle {
  return getProgressBoardCountSecondaryTextStyle();
}

export const PROGRESS_BOARD_PERCENT_TEXT_STYLE_NAME = PROGRESS_BOARD_COUNT_TRAILING_TEXT_STYLE_NAME;
export const PROGRESS_BOARD_PERCENT_STYLE_OVERRIDES = PROGRESS_BOARD_COUNT_TRAILING_STYLE_OVERRIDES;
export function getProgressBoardPercentTextStyle(): TextStyle {
  return getProgressBoardCountTrailingTextStyle();
}
