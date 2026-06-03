/**
 * grouped list rows for the browse progress board — no-icon items inside GroupedList.
 */

import React from 'react';
import { View, Text, StyleSheet, type TextStyle, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SFSymbolIcon } from '@/components/ui/Icon';
import {
  PROGRESS_BOARD_NEW_BEST_STREAK_ACCESSIBILITY_LABEL,
  PROGRESS_BOARD_STREAK_EMPTY_HINT,
  PROGRESS_BOARD_STREAK_LABEL,
  PROGRESS_BOARD_TODAYS_TASKS_LABEL,
} from './progressBoardTextValues';
import {
  PROGRESS_BOARD_CONTENT_ROW_GAP,
  PROGRESS_BOARD_SECTION_LABEL_MARGIN_BOTTOM,
  PROGRESS_BOARD_GOAL_COUNT_GAP,
  PROGRESS_BOARD_NEW_BEST_STAR_SIZE,
  PROGRESS_BOARD_SECONDARY_ROW_GAP,
  PROGRESS_BOARD_TRACK_HEIGHT,
  PROGRESS_BOARD_TRACK_RADIUS,
} from './progressBoardUiTokens';

type RowColorProps = {
  primaryColor: string;
  tertiaryColor: string;
};

type ProgressBoardStreakGroupedRowProps = RowColorProps & {
  /** golden fill for new-best streak star */
  newBestStarColor: string;
  newBestStarGlowStyle: ViewStyle;
  /** streak count + unit — same color as quick-add pill label (`interactive.active`) */
  streakCountTextColor: string;
  streakLabelStyle: TextStyle;
  streakCounterStyle: TextStyle;
  streakUnitStyle: TextStyle;
  longestStreakStyle: TextStyle;
  streakHintStyle: TextStyle;
  streakNumberLabel: string;
  streakUnitLabel: string | null;
  longestStreakLabel: string;
  showNewBestStreakStar: boolean;
  showEmptyHint: boolean;
};

/** no icon column — full width under grouped list padding */
export function ProgressBoardStreakGroupedRow({
  streakLabelStyle,
  streakCounterStyle,
  streakUnitStyle,
  longestStreakStyle,
  streakHintStyle,
  streakNumberLabel,
  streakUnitLabel,
  longestStreakLabel,
  showNewBestStreakStar,
  showEmptyHint,
  streakCountTextColor,
  newBestStarColor,
  newBestStarGlowStyle,
  primaryColor,
  tertiaryColor,
}: ProgressBoardStreakGroupedRowProps) {
  return (
    <View style={styles.contentRow}>
      <Text style={[streakLabelStyle, styles.sectionLabel, { color: tertiaryColor }]}>
        {PROGRESS_BOARD_STREAK_LABEL}
      </Text>
      <View style={[styles.secondaryRow, styles.splitSecondaryRow]}>
        <View style={styles.streakCountLeft}>
          <Text style={[streakCounterStyle, { color: streakCountTextColor }]}>{streakNumberLabel}</Text>
          {streakUnitLabel ? (
            <Text style={[streakUnitStyle, { color: streakCountTextColor }]}>{streakUnitLabel}</Text>
          ) : null}
          {showNewBestStreakStar && streakUnitLabel ? (
            <View
              accessible
              accessibilityRole="image"
              accessibilityLabel={PROGRESS_BOARD_NEW_BEST_STREAK_ACCESSIBILITY_LABEL}
              style={[styles.newBestMedalWrap, newBestStarGlowStyle]}
            >
              <SFSymbolIcon
                name="medal.fill"
                size={PROGRESS_BOARD_NEW_BEST_STAR_SIZE}
                color={newBestStarColor}
                fallback={
                  <Ionicons
                    name="medal"
                    size={PROGRESS_BOARD_NEW_BEST_STAR_SIZE}
                    color={newBestStarColor}
                  />
                }
              />
            </View>
          ) : null}
        </View>
        <Text style={[longestStreakStyle, styles.splitSecondaryTrailing, { color: tertiaryColor }]}>
          {longestStreakLabel}
        </Text>
      </View>
      {showEmptyHint ? (
        <Text style={[streakHintStyle, { color: tertiaryColor }]}>
          {PROGRESS_BOARD_STREAK_EMPTY_HINT}
        </Text>
      ) : null}
    </View>
  );
}

type ProgressBoardMetricBarGroupedRowProps = RowColorProps & {
  sectionLabel: string;
  sectionLabelStyle: TextStyle;
  primaryCountStyle: TextStyle;
  goalSuffixStyle: TextStyle;
  percentStyle: TextStyle;
  primaryCountLabel: string;
  goalSuffixLabel: string;
  percentLabel: string;
  fillWidthPercent: number;
  trackBg: string;
  fillColor: string;
  fillGlowStyle: ViewStyle;
};

/** section label + count/goal row + marple progress bar (today's tasks) */
export function ProgressBoardMetricBarGroupedRow({
  sectionLabel,
  sectionLabelStyle,
  primaryCountStyle,
  goalSuffixStyle,
  percentStyle,
  primaryCountLabel,
  goalSuffixLabel,
  percentLabel,
  primaryColor,
  tertiaryColor,
  fillWidthPercent,
  trackBg,
  fillColor,
  fillGlowStyle,
}: ProgressBoardMetricBarGroupedRowProps) {
  return (
    <View style={styles.contentRow}>
      <Text style={[sectionLabelStyle, styles.sectionLabel, { color: tertiaryColor }]}>
        {sectionLabel}
      </Text>
      <View style={[styles.secondaryRow, styles.splitSecondaryRow]}>
        <View style={styles.splitSecondaryLeft}>
          <Text style={[primaryCountStyle, { color: primaryColor }]}>{primaryCountLabel}</Text>
          <Text style={[goalSuffixStyle, { color: tertiaryColor }]}>{goalSuffixLabel}</Text>
        </View>
        <Text style={[percentStyle, styles.splitSecondaryTrailing, { color: tertiaryColor }]}>
          {percentLabel}
        </Text>
      </View>
      <View style={[styles.track, { backgroundColor: trackBg }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${fillWidthPercent}%`,
              backgroundColor: fillColor,
              ...fillGlowStyle,
            },
          ]}
        />
      </View>
    </View>
  );
}

type ProgressBoardTasksGroupedRowProps = Omit<
  ProgressBoardMetricBarGroupedRowProps,
  'sectionLabel' | 'sectionLabelStyle' | 'primaryCountStyle' | 'goalSuffixStyle'
> & {
  todaysTasksLabelStyle: TextStyle;
  tasksCompletedStyle: TextStyle;
  tasksGoalSuffixStyle: TextStyle;
};

export function ProgressBoardTasksGroupedRow({
  todaysTasksLabelStyle,
  tasksCompletedStyle,
  tasksGoalSuffixStyle,
  ...metricProps
}: ProgressBoardTasksGroupedRowProps) {
  return (
    <ProgressBoardMetricBarGroupedRow
      sectionLabel={PROGRESS_BOARD_TODAYS_TASKS_LABEL}
      sectionLabelStyle={todaysTasksLabelStyle}
      primaryCountStyle={tasksCompletedStyle}
      goalSuffixStyle={tasksGoalSuffixStyle}
      {...metricProps}
    />
  );
}

const styles = StyleSheet.create({
  /** shared vertical rhythm: label → split row → extra line or track */
  contentRow: {
    flex: 1,
    width: '100%',
    gap: PROGRESS_BOARD_CONTENT_ROW_GAP,
  },
  sectionLabel: {
    marginBottom: PROGRESS_BOARD_SECTION_LABEL_MARGIN_BOTTOM,
  },
  secondaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: PROGRESS_BOARD_SECONDARY_ROW_GAP,
  },
  splitSecondaryRow: {
    justifyContent: 'space-between',
  },
  streakCountLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    flexShrink: 1,
    gap: PROGRESS_BOARD_SECONDARY_ROW_GAP,
  },
  newBestMedalWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  splitSecondaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    flexShrink: 1,
    gap: PROGRESS_BOARD_GOAL_COUNT_GAP,
  },
  splitSecondaryTrailing: {
    marginLeft: PROGRESS_BOARD_GOAL_COUNT_GAP,
    flexShrink: 0,
  },
  track: {
    height: PROGRESS_BOARD_TRACK_HEIGHT,
    borderRadius: PROGRESS_BOARD_TRACK_RADIUS,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: PROGRESS_BOARD_TRACK_RADIUS,
    minWidth: 0,
  },
});
