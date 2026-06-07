/**
 * one user goal row with progress bar — long-press to delete.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { Paddings } from '@/constants/Paddings';
import type { UserGoalItem } from '@/types/api/gamification';

export type GoalListItemProps = {
  goal: UserGoalItem;
  onDelete: () => void;
};

export function GoalListItem({ goal, onDelete }: GoalListItemProps) {
  const themeColors = useThemeColors();
  const typography = useTypography();
  const progress = goal.targetCount > 0 ? Math.min(1, goal.currentCount / goal.targetCount) : 0;

  return (
    <Pressable
      onLongPress={onDelete}
      style={[styles.goalCard, { backgroundColor: themeColors.background.primarySecondaryBlend() }]}
    >
      <Text style={[typography.getTextStyle('body-large'), { color: themeColors.text.primary() }]}>
        {goal.title}
      </Text>
      <Text style={[typography.getTextStyle('body-small'), { color: themeColors.text.secondary() }]}>
        {goal.periodLabel} · {goal.currentCount}/{goal.targetCount}
        {goal.isMet ? ' · Done' : ''}
      </Text>
      <View style={[styles.progressTrack, { backgroundColor: themeColors.border.primary() }]}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${progress * 100}%`,
              backgroundColor: goal.isMet
                ? themeColors.text.primary()
                : themeColors.text.secondary(),
            },
          ]}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  goalCard: {
    borderRadius: Paddings.formDataPillRadius,
    padding: Paddings.groupedListContentHorizontal,
    gap: Paddings.touchTarget,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
});
