/**

 * browse home progress board — liquid glass shell + GroupedList (streak, today's tasks, productivity link).

 */



import React from 'react';

import { StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SFSymbolIcon } from '@/components/ui/Icon';

import { useThemeColors, useBrandColors } from '@/hooks/useColorPalette';

import { GroupedList, FormDetailButton } from '@/components/ui/List/GroupedList';

import { emptySummary } from '@/store/slices/gamification/gamificationSlice';

import type { GamificationSummary } from '@/types/api/gamification';

import { ProgressBoardGlassShell } from './ProgressBoardGlassShell';

import {

  ProgressBoardStreakGroupedRow,

  ProgressBoardTasksGroupedRow,

} from './ProgressBoardGroupedRows';

import {

  getProgressBoardPercentTextStyle,

  getProgressBoardStreakCounterTextStyle,

  getProgressBoardLongestStreakTextStyle,

  getProgressBoardStreakHintTextStyle,

  getProgressBoardStreakLabelTextStyle,

  getProgressBoardStreakUnitTextStyle,

  getProgressBoardTasksCompletedTextStyle,

  getProgressBoardTasksGoalSuffixTextStyle,

  getProgressBoardTodaysTasksLabelTextStyle,

} from './progressBoardText';

import {

  formatProgressBoardLongestStreakLabel,

  formatProgressBoardPercentLabel,

  formatProgressBoardStreakNumber,

  formatProgressBoardTasksCompletedCount,

  formatProgressBoardTasksGoalSuffix,

  PROGRESS_BOARD_PRODUCTIVITY_LABEL,

  getProgressBoardStreakUnitLabel,

  isProgressBoardNewBestStreak,

} from './progressBoardTextValues';

import {

  PROGRESS_BOARD_CARD_BORDER_RADIUS,

  PROGRESS_BOARD_CARD_MARGIN_BOTTOM,

  PROGRESS_BOARD_LOADER_PADDING_VERTICAL,

  PROGRESS_BOARD_PROGRESS_FILL_SHADE,

  PROGRESS_BOARD_BRAND_TRACK_SHADE,

  PROGRESS_BOARD_PRODUCTIVITY_ICON_SIZE,

  PROGRESS_BOARD_PRODUCTIVITY_ICON_SHADE,

  PROGRESS_BOARD_GROUPED_LIST_CONTENT_PADDING_HORIZONTAL,

  PROGRESS_BOARD_GROUPED_LIST_CONTENT_PADDING_VERTICAL,

  PROGRESS_BOARD_TRACK_MARPLE_OPACITY_DARK,

  PROGRESS_BOARD_TRACK_MARPLE_OPACITY_LIGHT,

  getProgressBoardFillGlow,
  getProgressBoardNewBestStarGlow,
  PROGRESS_BOARD_NEW_BEST_STAR_COLOR,

} from './progressBoardUiTokens';



export type BrowseProgressCardProps = {

  summary: GamificationSummary | null;

  isLoading: boolean;

  todayTaskGoal: number;

  /** opens browse productivity hub (goals, achievements, completed) */

  onProductivityPress: () => void;

};



export function BrowseProgressCard({

  summary,

  isLoading,

  todayTaskGoal,

  onProductivityPress,

}: BrowseProgressCardProps) {

  const themeColors = useThemeColors();

  const { getMarpleBrandColor, withOpacity } = useBrandColors();



  const streakLabelStyle = getProgressBoardStreakLabelTextStyle();

  const streakCounterStyle = getProgressBoardStreakCounterTextStyle();

  const streakUnitStyle = getProgressBoardStreakUnitTextStyle();

  const longestStreakStyle = getProgressBoardLongestStreakTextStyle();

  const streakHintStyle = getProgressBoardStreakHintTextStyle();

  const todaysTasksLabelStyle = getProgressBoardTodaysTasksLabelTextStyle();

  const tasksCompletedStyle = getProgressBoardTasksCompletedTextStyle();

  const tasksGoalSuffixStyle = getProgressBoardTasksGoalSuffixTextStyle();

  const percentStyle = getProgressBoardPercentTextStyle();



  const marpleFill = getMarpleBrandColor(PROGRESS_BOARD_PROGRESS_FILL_SHADE);

  const fillGlowStyle = getProgressBoardFillGlow(marpleFill);

  const marpleTrack = getMarpleBrandColor(PROGRESS_BOARD_BRAND_TRACK_SHADE);



  const data = summary ?? emptySummary;

  const streakDays = data.currentStreak;

  const longestStreakDays = data.longestStreak;

  const completedToday = data.completionsToday;

  const goal = Math.max(1, todayTaskGoal);

  const progress = Math.min(1, completedToday / goal);



  const streakNumberLabel = formatProgressBoardStreakNumber(streakDays);

  const streakUnitLabel = getProgressBoardStreakUnitLabel(streakDays);

  const tasksCompletedLabel = formatProgressBoardTasksCompletedCount(completedToday);

  const tasksGoalSuffixLabel = formatProgressBoardTasksGoalSuffix(goal);

  const percentLabel = formatProgressBoardPercentLabel(progress);

  const longestStreakLabel = formatProgressBoardLongestStreakLabel(longestStreakDays);

  const showNewBestStreakStar = isProgressBoardNewBestStreak(streakDays, longestStreakDays);

  const showStreakEmptyHint = streakDays === 0 && data.lastCompletionDate == null;

  const newBestStarColor = PROGRESS_BOARD_NEW_BEST_STAR_COLOR;
  const newBestStarGlowStyle = getProgressBoardNewBestStarGlow(newBestStarColor);
  const productivityIconColor = getMarpleBrandColor(PROGRESS_BOARD_PRODUCTIVITY_ICON_SHADE);



  const fillWidthPercent = Math.max(

    progress * 100,

    streakDays > 0 || completedToday > 0 ? 4 : 0

  );



  const trackBg = withOpacity(

    marpleTrack,

    themeColors.isDark ? PROGRESS_BOARD_TRACK_MARPLE_OPACITY_DARK : PROGRESS_BOARD_TRACK_MARPLE_OPACITY_LIGHT

  );



  const primaryColor = themeColors.text.primary();

  const tertiaryColor = themeColors.text.tertiary();

  // matches quick-add outlined pill label color
  const streakCountTextColor = themeColors.interactive.active();



  return (

    <ProgressBoardGlassShell style={styles.shell}>

      {isLoading && !summary ? (

        <ActivityIndicator

          style={styles.loader}

          color={themeColors.text.secondary()}

        />

      ) : (

        <GroupedList

          backgroundColor={themeColors.background.primary()}

          borderRadius={PROGRESS_BOARD_CARD_BORDER_RADIUS}

          separatorVariant="solid"

          contentPaddingHorizontal={PROGRESS_BOARD_GROUPED_LIST_CONTENT_PADDING_HORIZONTAL}

          contentPaddingVertical={PROGRESS_BOARD_GROUPED_LIST_CONTENT_PADDING_VERTICAL}

          separatorInsetRight={PROGRESS_BOARD_GROUPED_LIST_CONTENT_PADDING_HORIZONTAL}

          contentMinHeight={52}

        >

          <ProgressBoardStreakGroupedRow

            key="streak"

            streakLabelStyle={streakLabelStyle}

            streakCounterStyle={streakCounterStyle}

            streakUnitStyle={streakUnitStyle}

            longestStreakStyle={longestStreakStyle}

            streakHintStyle={streakHintStyle}

            streakNumberLabel={streakNumberLabel}

            streakUnitLabel={streakUnitLabel}

            longestStreakLabel={longestStreakLabel}

            showNewBestStreakStar={showNewBestStreakStar}

            showEmptyHint={showStreakEmptyHint}

            streakCountTextColor={streakCountTextColor}

            primaryColor={primaryColor}

            tertiaryColor={tertiaryColor}

            newBestStarColor={newBestStarColor}
            newBestStarGlowStyle={newBestStarGlowStyle}

          />

          <ProgressBoardTasksGroupedRow

            key="tasks"

            todaysTasksLabelStyle={todaysTasksLabelStyle}

            tasksCompletedStyle={tasksCompletedStyle}

            tasksGoalSuffixStyle={tasksGoalSuffixStyle}

            percentStyle={percentStyle}

            primaryCountLabel={tasksCompletedLabel}

            goalSuffixLabel={tasksGoalSuffixLabel}

            percentLabel={percentLabel}

            primaryColor={primaryColor}

            tertiaryColor={tertiaryColor}

            fillWidthPercent={fillWidthPercent}

            trackBg={trackBg}

            fillColor={marpleFill}

            fillGlowStyle={fillGlowStyle}

          />

          <FormDetailButton

            key="productivity"

            iconComponent={

              <SFSymbolIcon

                name="chart.line.uptrend.xyaxis"

                size={PROGRESS_BOARD_PRODUCTIVITY_ICON_SIZE}

                color={productivityIconColor}

                fallback={

                  <Ionicons

                    name="stats-chart"

                    size={PROGRESS_BOARD_PRODUCTIVITY_ICON_SIZE}

                    color={productivityIconColor}

                  />

                }

              />

            }

            label={PROGRESS_BOARD_PRODUCTIVITY_LABEL}

            value=""

            onPress={onProductivityPress}

            showChevron

          />

        </GroupedList>

      )}

    </ProgressBoardGlassShell>

  );

}



const styles = StyleSheet.create({

  shell: {

    marginBottom: PROGRESS_BOARD_CARD_MARGIN_BOTTOM,

  },

  loader: {

    paddingVertical: PROGRESS_BOARD_LOADER_PADDING_VERTICAL,

    alignSelf: 'center',

  },

});


