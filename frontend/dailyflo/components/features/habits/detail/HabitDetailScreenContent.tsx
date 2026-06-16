/**
 * habit detail body — browse list-detail chrome (blur header, heading-1 title) + grouped sections.
 */

import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  useAnimatedReaction,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { useThemeColors, useSemanticColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { MainBackButton } from '@/components/ui/Button';
import { GroupedList, FormDetailButton, GroupedListHeader } from '@/components/ui/List/GroupedList';
import { Paddings } from '@/constants/Paddings';
import { getTaskColorValue } from '@/utils/taskColors';
import { useHabits } from '@/store/hooks';
import { HabitListItem } from '../list/HabitListItem';
import { HabitHeatmap } from './HabitHeatmap';
import { HabitTrendChart } from './HabitTrendChart';
import type { HabitTodayItem } from '@/types/api/habits';

const TOP_SECTION_ROW_HEIGHT = 48;
const TOP_SECTION_ANCHOR_HEIGHT = 64;
const SCROLL_THRESHOLD = 16;

type HabitDetailScreenContentProps = {
  habitId: string;
};

export function HabitDetailScreenContent({ habitId }: HabitDetailScreenContentProps) {
  const router = useGuardedRouter();
  const insets = useSafeAreaInsets();
  const themeColors = useThemeColors();
  const semanticColors = useSemanticColors();
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
  const title = detailHabit?.title ?? 'Habit';
  const deleteColor = semanticColors.error();

  const listGroupProps = useMemo(
    () => ({
      backgroundColor: themeColors.background.primarySecondaryBlend(),
      separatorColor: themeColors.border.primary(),
      separatorInsetRight: Paddings.groupedListContentHorizontal,
      separatorVariant: 'solid' as const,
      borderRadius: 24,
      minimalStyle: false,
      separatorConsiderIconColumn: true,
      iconColumnWidth: 30,
      itemPadding: 'root' as const,
    }),
    [themeColors],
  );

  const styles = useMemo(() => createStyles(typography, insets), [typography, insets]);

  const scrollY = useSharedValue(0);
  const miniHeaderOpacity = useSharedValue(0);

  useAnimatedReaction(
    () => scrollY.value > SCROLL_THRESHOLD,
    (shouldShow) => {
      miniHeaderOpacity.value = withTiming(shouldShow ? 1 : 0, { duration: 200 });
    },
  );

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y;
    },
  });

  const miniHeaderStyle = useAnimatedStyle(() => ({
    opacity: miniHeaderOpacity.value,
  }));

  const bigHeaderStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, SCROLL_THRESHOLD], [1, 0], Extrapolation.CLAMP),
  }));

  const backButtonTop = insets.top + (TOP_SECTION_ROW_HEIGHT - 42) / 2;

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
      reminderTime: detailHabit.reminderTime ?? '',
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
        <Text style={[styles.errorText, { color: themeColors.text.secondary() }]}>{detailError}</Text>
      </View>
    );
  }

  if (!detailHabit) return null;

  return (
    <View style={styles.screen}>
      <View
        style={[styles.topSectionAnchor, { height: insets.top + TOP_SECTION_ANCHOR_HEIGHT }]}
      >
        <BlurView
          tint={themeColors.isDark ? 'dark' : 'light'}
          intensity={1}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={[
            themeColors.background.root(),
            themeColors.withOpacity(themeColors.background.root(), 0),
          ]}
          locations={[0.4, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={styles.topSectionRow} pointerEvents="box-none">
          <View style={styles.topSectionPlaceholder} pointerEvents="none" />
          <Animated.View style={[styles.miniHeader, miniHeaderStyle]} pointerEvents="none">
            <Text
              style={[styles.miniHeaderText, { color: themeColors.text.primary() }]}
              numberOfLines={1}
            >
              {title}
            </Text>
          </Animated.View>
        </View>
      </View>

      {Platform.OS === 'android' ? (
        <View style={styles.backButtonContainer} pointerEvents="box-none">
          <MainBackButton onPress={() => router.back()} top={backButtonTop} left={Paddings.screen} />
        </View>
      ) : null}

      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        contentInsetAdjustmentBehavior={Platform.OS === 'ios' ? 'never' : undefined}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.paddedHorizontal}>
          <Animated.View style={[bigHeaderStyle, styles.contentSection]}>
            <Text style={[styles.bigHeader, { color: themeColors.text.primary() }]} numberOfLines={2}>
              {title}
            </Text>
          </Animated.View>
        </View>

        <View style={styles.paddedHorizontal}>
          <GroupedList containerStyle={styles.listContainer} {...listGroupProps}>
            <FormDetailButton
              label="Current streak"
              value={String(detailStats?.currentStreak ?? 0)}
              onPress={() => {}}
              disabled
              showChevron={false}
              customStyles={{ value: { color: accent, fontWeight: '600' } }}
            />
            <FormDetailButton
              label="Longest streak"
              value={String(detailStats?.longestStreak ?? 0)}
              onPress={() => {}}
              disabled
              showChevron={false}
            />
          </GroupedList>
        </View>

        {todayRow ? (
          <View style={styles.paddedHorizontal}>
            <GroupedListHeader title="Today" />
            <GroupedList containerStyle={styles.listContainer} {...listGroupProps}>
              <HabitListItem habit={todayRow} compact />
            </GroupedList>
          </View>
        ) : null}

        {detailStats ? (
          <>
            <View style={styles.paddedHorizontal}>
              <GroupedListHeader title="Consistency" />
              <Text style={[styles.sectionHint, { color: themeColors.text.tertiary() }]}>
                Last {detailStats.heatmap.days} days
              </Text>
              <GroupedList containerStyle={styles.listContainer} {...listGroupProps}>
                <View style={styles.chartWrap}>
                  <HabitHeatmap heatmap={detailStats.heatmap} color={detailHabit.color} />
                </View>
              </GroupedList>
            </View>

            <View style={styles.paddedHorizontal}>
              <GroupedListHeader title="7-day rolling rate" />
              <Text style={[styles.sectionHint, { color: themeColors.text.tertiary() }]}>
                Last {detailStats.trend.windowDays} days
              </Text>
              <GroupedList containerStyle={styles.listContainer} {...listGroupProps}>
                <View style={styles.chartWrap}>
                  <HabitTrendChart trend={detailStats.trend} color={detailHabit.color} />
                </View>
              </GroupedList>
            </View>
          </>
        ) : null}

        <View style={styles.paddedHorizontal}>
          <GroupedListHeader title="Manage" style={styles.manageHeader} />
          <GroupedList containerStyle={styles.listContainer} {...listGroupProps}>
            <FormDetailButton
              icon="create-outline"
              label="Edit habit"
              value=""
              onPress={handleEdit}
            />
            <FormDetailButton
              iconComponent={
                <Ionicons name="trash-outline" size={18} color={deleteColor} />
              }
              label="Delete habit"
              value=""
              onPress={handleDelete}
              showChevron={false}
              customStyles={{ label: { color: deleteColor } }}
            />
          </GroupedList>
        </View>

        <View style={styles.bottomSpacer} />
      </Animated.ScrollView>
    </View>
  );
}

const createStyles = (
  typography: ReturnType<typeof useTypography>,
  insets: ReturnType<typeof useSafeAreaInsets>,
) =>
  StyleSheet.create({
    screen: {
      flex: 1,
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: Paddings.screen,
    },
    errorText: {
      ...typography.getTextStyle('body-medium'),
    },
    topSectionAnchor: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10,
      overflow: 'hidden',
    },
    topSectionRow: {
      position: 'absolute',
      top: insets.top,
      left: 0,
      right: 0,
      height: TOP_SECTION_ROW_HEIGHT,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Paddings.screen,
    },
    topSectionPlaceholder: {
      width: 44,
      height: 44,
    },
    miniHeader: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 56,
    },
    miniHeaderText: {
      ...typography.getTextStyle('heading-3'),
    },
    backButtonContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: insets.top + TOP_SECTION_ROW_HEIGHT,
      zIndex: 11,
      overflow: 'visible',
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      // productivity pattern: scroll body starts below insets.top + 64 blur band (not browseScrollPaddingTop overlap)
      paddingTop: insets.top + TOP_SECTION_ANCHOR_HEIGHT,
      flexGrow: 1,
      gap: Paddings.formDataPillRowGap,
      paddingBottom: Paddings.scrollBottomExtra + Paddings.sectionCompact,
    },
    paddedHorizontal: {
      paddingHorizontal: Paddings.screen,
    },
    contentSection: {
      marginTop: Paddings.sectionCompact,
      marginBottom: Paddings.sectionCompact,
    },
    bigHeader: {
      ...typography.getTextStyle('heading-1'),
      marginBottom: 8,
    },
    listContainer: {
      marginVertical: 0,
    },
    sectionHint: {
      ...typography.getTextStyle('body-small'),
      marginTop: -4,
      marginBottom: 8,
      paddingHorizontal: Paddings.touchTargetSmall,
    },
    chartWrap: {
      width: '100%',
    },
    manageHeader: {
      marginTop: Paddings.sectionCompact,
    },
    bottomSpacer: {
      height: 200,
    },
  });
