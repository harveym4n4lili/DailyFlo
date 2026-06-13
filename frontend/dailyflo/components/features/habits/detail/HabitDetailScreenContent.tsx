/**
 * habit detail body — streaks, today log row, heatmap, trend, edit/delete actions.
 */

import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useFocusEffect } from 'expo-router';

import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { Paddings } from '@/constants/Paddings';
import { getTaskColorValue } from '@/utils/taskColors';
import { useHabits } from '@/store/hooks';
import { HabitListItem } from '../list/HabitListItem';
import { HabitHeatmap } from './HabitHeatmap';
import { HabitTrendChart } from './HabitTrendChart';
import type { HabitTodayItem } from '@/types/api/habits';

type HabitDetailScreenContentProps = {
  habitId: string;
};

export function HabitDetailScreenContent({ habitId }: HabitDetailScreenContentProps) {
  const router = useGuardedRouter();
  const themeColors = useThemeColors();
  const typography = useTypography();
  const {
    detailHabit,
    detailStats,
    todayHabits,
    isDetailLoading,
    detailError,
    fetchHabit,
    fetchHabitStats,
    fetchToday,
    deleteHabit,
    clearHabitDetail,
  } = useHabits();

  useFocusEffect(
    useCallback(() => {
      void fetchToday();
      void fetchHabit(habitId);
      void fetchHabitStats(habitId);
      return () => clearHabitDetail();
    }, [habitId, fetchToday, fetchHabit, fetchHabitStats, clearHabitDetail]),
  );

  const accent = useMemo(
    () => getTaskColorValue(detailHabit?.color ?? 'green'),
    [detailHabit?.color],
  );
  const styles = useMemo(
    () => createStyles(themeColors, typography, accent),
    [themeColors, typography, accent],
  );

  const todayRow: HabitTodayItem | null = useMemo(() => {
    const fromToday = todayHabits.find((h) => h.id === habitId);
    if (fromToday) return fromToday;
    if (!detailHabit) return null;
    return {
      id: detailHabit.id,
      title: detailHabit.title,
      iconKey: detailHabit.iconKey,
      color: detailHabit.color,
      trackingType: detailHabit.trackingType,
      targetValue: detailHabit.targetValue,
      loggedValue: 0,
      unitLabel: detailHabit.unitLabel,
      isCompleteToday: false,
      currentStreak: detailStats?.currentStreak ?? 0,
      longestStreak: detailStats?.longestStreak ?? 0,
      frequencyType: detailHabit.frequencyType,
    };
  }, [todayHabits, habitId, detailHabit, detailStats]);

  const handleEdit = useCallback(() => {
    router.push(`/(tabs)/habits/${habitId}/edit` as any);
  }, [router, habitId]);

  const handleDelete = useCallback(() => {
    Alert.alert('Delete habit', 'This habit will be removed from your lists.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await deleteHabit(habitId);
              router.back();
            } catch (e) {
              Alert.alert('Could not delete', e instanceof Error ? e.message : 'Try again');
            }
          })();
        },
      },
    ]);
  }, [habitId, deleteHabit, router]);

  if (isDetailLoading && !detailHabit) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={themeColors.text.secondary()} />
      </View>
    );
  }

  if (detailError && !detailHabit) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{detailError}</Text>
      </View>
    );
  }

  if (!detailHabit) return null;

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior={Platform.OS === 'ios' ? 'automatic' : undefined}
    >
      <Text style={styles.title}>{detailHabit.title}</Text>
      <View style={styles.streakRow}>
        <View style={styles.streakCard}>
          <Text style={styles.streakValue}>{detailStats?.currentStreak ?? 0}</Text>
          <Text style={styles.streakLabel}>Current streak</Text>
        </View>
        <View style={styles.streakCard}>
          <Text style={styles.streakValue}>{detailStats?.longestStreak ?? 0}</Text>
          <Text style={styles.streakLabel}>Longest streak</Text>
        </View>
      </View>

      {todayRow ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today</Text>
          <HabitListItem habit={todayRow} />
        </View>
      ) : null}

      {detailStats ? (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Consistency</Text>
            <Text style={styles.sectionHint}>Last {detailStats.heatmap.days} days</Text>
            <HabitHeatmap heatmap={detailStats.heatmap} color={detailHabit.color} />
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>7-day rolling rate</Text>
            <Text style={styles.sectionHint}>Last {detailStats.trend.windowDays} days</Text>
            <HabitTrendChart trend={detailStats.trend} color={detailHabit.color} />
          </View>
        </>
      ) : null}

      <View style={styles.actions}>
        <Pressable style={styles.actionButton} onPress={handleEdit}>
          <Text style={styles.actionButtonText}>Edit habit</Text>
        </Pressable>
        <Pressable style={[styles.actionButton, styles.deleteButton]} onPress={handleDelete}>
          <Text style={[styles.actionButtonText, styles.deleteText]}>Delete habit</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const createStyles = (
  themeColors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useTypography>,
  accent: string,
) =>
  StyleSheet.create({
    scroll: {
      padding: Paddings.screen,
      paddingBottom: Paddings.scrollBottomExtra + Paddings.section,
      gap: Paddings.sectionCompact,
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: Paddings.screen,
    },
    errorText: {
      ...typography.getTextStyle('body-medium'),
      color: themeColors.text.secondary(),
    },
    title: {
      ...typography.getTextStyle('heading-2'),
      color: themeColors.text.primary(),
    },
    streakRow: {
      flexDirection: 'row',
      gap: 12,
    },
    streakCard: {
      flex: 1,
      backgroundColor: themeColors.background.primarySecondaryBlend(),
      borderRadius: 16,
      padding: Paddings.card,
    },
    streakValue: {
      ...typography.getTextStyle('heading-2'),
      color: accent,
    },
    streakLabel: {
      ...typography.getTextStyle('body-small'),
      color: themeColors.text.secondary(),
      marginTop: 4,
    },
    section: {
      gap: 8,
    },
    sectionTitle: {
      ...typography.getTextStyle('heading-4'),
      color: themeColors.text.primary(),
    },
    sectionHint: {
      ...typography.getTextStyle('body-small'),
      color: themeColors.text.tertiary(),
    },
    actions: {
      gap: 10,
      marginTop: 8,
    },
    actionButton: {
      backgroundColor: themeColors.background.primarySecondaryBlend(),
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
    },
    actionButtonText: {
      ...typography.getTextStyle('body-medium'),
      color: themeColors.text.primary(),
      fontWeight: '600',
    },
    deleteButton: {
      backgroundColor: themeColors.withOpacity(themeColors.text.tertiary(), 0.12),
    },
    deleteText: {
      color: themeColors.text.secondary(),
    },
  });
