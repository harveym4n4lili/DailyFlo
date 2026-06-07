/**
 * goals list body — fetch via redux on focus; route adds toolbar + FAB to create.
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { useGamification } from '@/store/hooks';
import { MainBackButton } from '@/components/ui/Button';
import { FloatingActionButton } from '@/components/ui/Button';
import { Paddings } from '@/constants/Paddings';
import { browseScrollPaddingTop } from '@/constants/browseScrollPaddingTop';
import type { UserGoalItem } from '@/types/api/gamification';
import { GoalListItem } from './GoalListItem';

export function GoalsScreenContent() {
  const router = useGuardedRouter();
  const themeColors = useThemeColors();
  const typography = useTypography();
  const insets = useSafeAreaInsets();
  const { goals, isGoalsLoading, goalsError, fetchGoals, deleteGoal } = useGamification();

  useFocusEffect(
    useCallback(() => {
      void fetchGoals();
    }, [fetchGoals])
  );

  const handleDelete = (goal: UserGoalItem) => {
    Alert.alert('Remove goal', `Remove "${goal.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => void deleteGoal(goal.id),
      },
    ]);
  };

  return (
    <View style={[styles.screen, { backgroundColor: themeColors.background.root() }]}>
      {Platform.OS === 'android' ? (
        <View style={[styles.androidHeader, { paddingTop: insets.top }]}>
          <MainBackButton />
          <Text style={[typography.getTextStyle('heading-3'), { color: themeColors.text.primary() }]}>
            Goals
          </Text>
        </View>
      ) : null}
      <ScrollView
        contentContainerStyle={{
          paddingTop: browseScrollPaddingTop(insets),
          paddingHorizontal: Paddings.screen,
          paddingBottom: Paddings.scrollBottomExtra + Paddings.contentVertical,
          gap: Paddings.formDataPillRowGap,
        }}
      >
        {isGoalsLoading && goals.length === 0 ? (
          <ActivityIndicator color={themeColors.text.secondary()} />
        ) : null}
        {goalsError ? (
          <Text style={{ color: themeColors.text.secondary() }}>{goalsError}</Text>
        ) : null}
        {goals.length === 0 && !isGoalsLoading ? (
          <Text style={[typography.getTextStyle('body-medium'), { color: themeColors.text.tertiary() }]}>
            No goals yet. Tap + to add one (up to 5 active).
          </Text>
        ) : null}
        {goals.map((goal) => (
          <GoalListItem key={goal.id} goal={goal} onDelete={() => handleDelete(goal)} />
        ))}
      </ScrollView>
      <View style={[styles.fabWrap, { bottom: insets.bottom + Paddings.listItemVertical * 2 }]}>
        <FloatingActionButton
          onPress={() => router.push('/(tabs)/browse/goal-create' as any)}
          accessibilityLabel="Create goal"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  androidHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Paddings.screen,
    gap: Paddings.touchTarget,
    minHeight: 48,
  },
  fabWrap: {
    position: 'absolute',
    right: Paddings.screen,
  },
});
