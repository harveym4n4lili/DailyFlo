/**
 * habits tab — "All habits" block for habits not due today.
 * redux `allHabits` comes from GET /habits/ (includes streak + heatmap for habit cards).
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Animated from 'react-native-reanimated';

import { HabitCard } from '../list/HabitCard';
import { LAYOUT_TRANSITION_SPRING } from '@/constants/LayoutTransitions';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { useHabits } from '@/store/hooks';
import { Paddings } from '@/constants/Paddings';
import { HABIT_SECTION_HEADER_CONTENT_GAP } from './habitSectionUiTokens';
import { HabitsCollapsibleSection } from './HabitsCollapsibleSection';

type HabitsAllSectionProps = {
  onOpenDetail?: (habitId: string) => void;
};

export function HabitsAllSection({ onOpenDetail }: HabitsAllSectionProps) {
  const themeColors = useThemeColors();
  const typography = useTypography();
  const { allHabits, todayHabits, isAllLoading, allError } = useHabits();

  const styles = useMemo(
    () => createStyles(themeColors, typography),
    [themeColors, typography],
  );

  // hide habits already shown in today's habit cards above this section
  const otherHabits = useMemo(() => {
    const todayIds = new Set(todayHabits.map((habit) => habit.id));
    return allHabits.filter((habit) => !todayIds.has(habit.id));
  }, [allHabits, todayHabits]);

  const sectionBody = (() => {
    if (isAllLoading && allHabits.length === 0) {
      return (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={themeColors.text.secondary()} />
        </View>
      );
    }

    if (allError && allHabits.length === 0) {
      return (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyHint}>{allError}</Text>
        </View>
      );
    }

    if (otherHabits.length === 0) {
      return (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyHint}>
            {allHabits.length === 0
              ? 'No habits yet. Tap + to create your first one.'
              : 'Every habit is scheduled for today.'}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.habitCards}>
        {otherHabits.map((habit) => (
          <Animated.View key={habit.id} layout={LAYOUT_TRANSITION_SPRING}>
            <HabitCard
              defaultVariant="simplified"
              title={habit.title}
              color={habit.color}
              currentStreak={habit.currentStreak}
              heatmap={habit.heatmap}
              onPress={onOpenDetail ? () => onOpenDetail(habit.id) : undefined}
            />
          </Animated.View>
        ))}
      </View>
    );
  })();

  return (
    <HabitsCollapsibleSection
      title="All habits"
      placement="following"
      itemCount={otherHabits.length}
    >
      {sectionBody}
    </HabitsCollapsibleSection>
  );
}

const createStyles = (
  themeColors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useTypography>,
) =>
  StyleSheet.create({
    loadingWrap: {
      paddingTop: HABIT_SECTION_HEADER_CONTENT_GAP,
      paddingVertical: Paddings.sectionCompact,
      alignItems: 'center',
    },
    emptyWrap: {
      paddingTop: HABIT_SECTION_HEADER_CONTENT_GAP,
      paddingHorizontal: Paddings.touchTargetSmall,
    },
    emptyHint: {
      ...typography.getTextStyle('body-medium'),
      color: themeColors.text.secondary(),
    },
    habitCards: {
      gap: Paddings.screen,
      paddingTop: HABIT_SECTION_HEADER_CONTENT_GAP,
    },
  });
